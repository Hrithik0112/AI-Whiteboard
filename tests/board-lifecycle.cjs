// Runs real route SQL against disposable PostgreSQL (PGlite), never DATABASE_URL.
// Install @electric-sql/pglite in a temporary directory, then run:
// NODE_PATH=/private/tmp/archflow-board-verification/node_modules node --test tests/board-lifecycle.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
const { drizzle } = require('drizzle-orm/neon-http');

// Transpile application TS in memory, replacing only the network DB and auth.
function loader(overrides) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const customRequire = id => {
      if (id in overrides) return overrides[id];
      if (id.startsWith('@/')) return load(`${id.slice(2)}.ts`);
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), `${id}.ts`));
      return require(id);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(customRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

test('board count and quota follow the complete board lifecycle', async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`
      CREATE TABLE users (id serial PRIMARY KEY, name text, email text NOT NULL UNIQUE, credits integer DEFAULT 3, "created_at" timestamp DEFAULT now() NOT NULL);
      CREATE TABLE projects (id serial PRIMARY KEY, "projectId" varchar NOT NULL UNIQUE, "projectName" varchar NOT NULL, "userEmail" varchar NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, archived boolean DEFAULT false);
      CREATE TABLE "whiteboardData" (id serial PRIMARY KEY, "projectId" varchar NOT NULL UNIQUE REFERENCES projects("projectId"), elements jsonb, "appState" jsonb, files jsonb, image text, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
    `);
    // Preserve the Neon lazy-query and transaction contract using local PG.
    const run = async (executor, query) => {
      const result = await executor.query(query.sql, query.params);
      const normalize = value => value instanceof Date ? value.toISOString() : value;
      return { ...result, rows: result.rows.map(row => query.options?.arrayMode
        ? result.fields.map(field => normalize(row[field.name]))
        : Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalize(value)]))) };
    };
    const client = {
      query(sql, params, options) {
        const query = { sql, params, options };
        return { ...query, then(resolve, reject) { return run(pg, query).then(resolve, reject); } };
      },
      transaction(queries) {
        return pg.transaction(async tx => {
          const results = [];
          for (const query of queries) results.push(await run(tx, query));
          return results;
        });
      },
    };
    const schema = loader({})('db/schema.ts');
    const db = drizzle({ client, schema });
    let email = 'owner@example.com';
    const load = loader({
      '@/db': { db, ...schema },
      '@clerk/nextjs/server': { currentUser: async () => email ? { firstName: 'Test', lastName: 'User', primaryEmailAddress: { emailAddress: email } } : null },
    });
    const routes = load('app/api/projects/route.ts');
    const users = load('app/api/users/route.ts');
    const request = (id, extra = '', body = {}) => ({ nextUrl: new URL(`https://test.local/api/projects?projectId=${id}${extra}`), json: async () => body });
    const create = id => routes.POST(request(id, '', { projectId: id, projectName: id }));
    const archive = id => routes.DELETE(request(id));
    const restore = id => routes.PATCH(request(id, '&action=restore'));
    const remove = id => routes.DELETE(request(id, '&permanent=true'));
    async function usage(expected, credits) {
      const response = await users.POST();
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.boardCount, expected);
      assert.equal(data.boardLimit, 3);
      assert.equal(data.credits, credits);
    }

    await usage(0, 3);
    assert.equal((await create('one')).status, 200);
    await usage(1, 2);
    assert.equal((await create('two')).status, 200);
    assert.equal((await create('three')).status, 200);
    await usage(3, 0);
    assert.equal((await create('four')).status, 409);
    await usage(3, 0);
    // Renaming does not consume a board slot, even at the limit.
    assert.equal((await create('one')).status, 200);
    await usage(3, 0);
    assert.equal((await archive('one')).status, 200);
    await usage(2, 1);
    assert.equal((await archive('one')).status, 200);
    await usage(2, 1);
    assert.equal((await remove('one')).status, 200);
    await usage(2, 1);
    assert.equal((await remove('one')).status, 404);
    await usage(2, 1);
    assert.equal((await archive('two')).status, 200);
    assert.equal((await restore('two')).status, 200);
    assert.equal((await restore('two')).status, 200);
    await usage(2, 1);
    assert.equal((await archive('two')).status, 200);
    assert.equal((await create('four')).status, 200);
    assert.equal((await create('five')).status, 200);
    assert.equal((await restore('two')).status, 409);
    await usage(3, 0);
    // Stale legacy credits do not alter the count or enforcement.
    await pg.query('UPDATE users SET credits = 3');
    await usage(3, 0);
    assert.equal((await create('six')).status, 409);
    email = 'someone-else@example.com';
    assert.equal((await archive('three')).status, 404);
    assert.equal((await restore('two')).status, 404);
    assert.equal((await remove('three')).status, 404);
    await usage(0, 3);
    email = 'owner@example.com';
    // Permanent removal of an active board frees exactly one slot.
    assert.equal((await remove('three')).status, 200);
    await usage(2, 1);
    // Competing create/restore writes can consume only the final slot.
    const statuses = (await Promise.all([create('six'), restore('two')])).map(result => result.status).sort();
    assert.deepEqual(statuses, [200, 409]);
    await usage(3, 0);
    // Older records with null archived flags still count as active.
    await pg.query('UPDATE projects SET archived = NULL WHERE "projectId" = $1', ['four']);
    await usage(3, 0);
    assert.equal((await create('legacy-limit')).status, 409);
    email = null;
    assert.equal((await create('unauthorized')).status, 401);
    assert.equal((await users.POST()).status, 401);
  } finally {
    await pg.close();
  }
});
