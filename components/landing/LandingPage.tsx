'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Circle, FileText, GitBranch, Hand, Layers, Menu, MousePointer2, Network, Pencil, Plus, Sparkles, Square, X } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import Magnet from './Magnet';
import './landing.css';

const examples = [
  { name: 'A product launch', prompt: 'Map out a simple product launch', root: 'The next big thing', left: 'Understand', middle: 'Create', right: 'Launch', notes: ['Find the real problem', 'Make something useful', 'Share it with the world'] },
  { name: 'An app architecture', prompt: 'Sketch an architecture for my app', root: 'Your application', left: 'Frontend', middle: 'API layer', right: 'Database', notes: ['A thoughtful interface', 'Connect the pieces', 'A home for your data'] },
  { name: 'A user journey', prompt: 'Visualize a new user’s first experience', root: 'A new beginning', left: 'Discover', middle: 'Explore', right: 'Get started', notes: ['A little curiosity', 'That lightbulb moment', 'Turn intent into action'] },
];

function Brand() {
  return <Link href="/" className="af-brand" aria-label="Archflow home"><Image src="/logo.svg" width={33} height={23} alt="" />archflow<span className="af-brand-dot">.</span></Link>;
}

function SignedOutLoginLink() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded || isSignedIn) return null;
  return <Link href="/sign-in" className="af-signin">Log in</Link>;
}

export default function LandingPage({ authConfigured = false }: { authConfigured?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const example = examples[selected];
  return (
    <div className="af-landing">
      <a className="af-skip" href="#main">Skip to content</a>
      <header className="af-header">
        <Brand />
        <nav className={menuOpen ? 'af-nav af-nav-open' : 'af-nav'} aria-label="Main navigation">
          <a href="#canvas" onClick={() => setMenuOpen(false)}>The canvas</a>
          <a href="#possibilities" onClick={() => setMenuOpen(false)}>Possibilities</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        </nav>
        <div className="af-header-actions">{authConfigured && <SignedOutLoginLink />}<Link href="/dashboard" className="af-button af-button-small">Open your canvas <ArrowUpRight size={15} /></Link><button className="af-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
      </header>
      <main id="main">
        <section className="af-hero">
          <div className="af-eyebrow"><span /> A little structure. Endless possibility.</div>
          <h1>Big ideas start<br />with a <span className="af-title-accent">little space.<svg viewBox="0 0 460 22" fill="none" aria-hidden="true"><path d="M4 15C107 2 308 1 454 10M36 20C172 11 329 9 416 16" /></svg></span></h1>
          <p>A canvas for your next what-if.<br className="af-mobile-break" /> Sketch, connect, and turn<br className="af-desktop-break" /> a messy thought into something clear—with a little help from AI.</p>
          <div className="af-hero-actions"><Magnet padding={35} magnetStrength={8}><Link href="/dashboard" className="af-button">Start creating <ArrowUpRight size={18} /></Link></Magnet><a href="#canvas" className="af-text-link">Take a look around <ArrowDown size={16} /></a></div>
          <div className="af-hero-note">Your ideas. Your pace. One infinite canvas.</div>
          <span className="af-doodle af-doodle-left" aria-hidden="true">✳</span><span className="af-doodle af-doodle-right" aria-hidden="true">↗</span>
        </section>

        <section id="canvas" className="af-preview-section" aria-label="Interactive canvas example">
          <div className="af-preview-caption"><span><span className="af-live-dot" /> A small idea, taking shape</span><span>Made for the way you think <ArrowDown size={14} /></span></div>
          <div className="af-preview">
            <div className="af-preview-bar"><div><Image src="/logo.svg" alt="" width={23} height={17} /><span>My next big idea</span><ChevronRight size={13} /><span className="af-muted">Whiteboard</span></div><span className="af-demo-badge">Interactive preview</span></div>
            <div className="af-board">
              <div className="af-toolrail" aria-hidden="true"><MousePointer2 className="af-selected-tool" /><Hand /><Square /><Circle /><Pencil /><FileText /></div>
              <div className="af-diagram" key={selected} aria-live="polite">
                <div className="af-handwritten">everything starts somewhere</div>
                <div className="af-root-node"><Sparkles size={18} />{example.root}</div>
                <svg className="af-connectors" viewBox="0 0 720 96" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M360 0V32Q360 45 345 45H135Q120 45 120 60V94M360 0V94M360 45H585Q600 45 600 60V94" /><path d="m115 87 5 7 5-7m230 0 5 7 5-7m230 0 5 7 5-7" /></svg>
                <div className="af-branches">{[example.left, example.middle, example.right].map((label, i) => <div className="af-branch" key={label}><div className={`af-node af-node-${i}`}>{i === 0 ? <Network size={17} /> : i === 1 ? <Pencil size={17} /> : <ArrowUpRight size={17} />}{label}</div><span>{example.notes[i]}</span></div>)}</div>
              </div>
              <div className="af-sticky">Less overthinking.<br />More connecting.<span>✧</span></div>
              <div className="af-ai-prompt"><span className="af-ai-icon"><Sparkles size={17} /></span><span>{example.prompt}</span><Check size={16} className="af-prompt-check" /></div>
              <div className="af-board-bottom"><span><span className="af-live-dot" /> Room for every idea</span><span>− &nbsp; 100% &nbsp; +</span></div>
            </div>
          </div>
          <div className="af-examples"><span>Try a different thought</span><div role="group" aria-label="Canvas examples">{examples.map((item, i) => <button key={item.name} onClick={() => setSelected(i)} aria-pressed={selected === i} className={selected === i ? 'is-active' : ''}>{item.name}<ArrowUpRight size={13} /></button>)}</div></div>
        </section>

        <section id="possibilities" className="af-features">
          <div className="af-section-heading"><div><span className="af-kicker">THINK OUTSIDE THE TEXT BOX</span><h2>From “what if”<br />to “there it is.”</h2></div><p>Some ideas need more than a document.<br />Give yours the space to come together.</p></div>
          <div className="af-feature-grid">
            <SpotlightCard theme="light" spotlightColor="#e7a46a" className="af-feature"><div className="af-feature-icon"><Sparkles size={23} /></div><h3>A thought. A starting point.</h3><p>Describe what’s on your mind. AI helps turn it into a diagram, flowchart, or wireframe you can make your own.</p><span className="af-feature-label">A LITTLE HELP FROM AI <ArrowUpRight size={15} /></span></SpotlightCard>
            <SpotlightCard theme="light" spotlightColor="#a6bfa2" className="af-feature"><div className="af-feature-icon"><GitBranch size={23} /></div><h3>Make the connections.</h3><p>Map a system, untangle a workflow, or follow a new direction. An infinite whiteboard keeps up with your thinking.</p><span className="af-feature-label">SPACE TO EXPLORE <ArrowUpRight size={15} /></span></SpotlightCard>
            <SpotlightCard theme="light" spotlightColor="#a9b6dc" className="af-feature"><div className="af-feature-icon"><Layers size={23} /></div><h3>Keep the whole picture.</h3><p>Keep your notes beside your diagrams. Bring the visual and the written together, so the context stays close.</p><span className="af-feature-label">IDEAS, ALL TOGETHER <ArrowUpRight size={15} /></span></SpotlightCard>
          </div>
        </section>
        <section id="how-it-works" className="af-process"><span className="af-kicker">LESS SETUP. MORE LIGHTBULB MOMENTS.</span><h2>Just bring an idea.</h2><div className="af-steps">{[['01', 'Open a fresh canvas', 'A blank page, without the pressure.'], ['02', 'Let your thoughts wander', 'Draw it yourself, or ask AI for a start.'], ['03', 'Make it make sense', 'Connect, refine, and find your next step.']].map(([n, title, text]) => <div key={n}><span className="af-step-number">{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
        <section className="af-closing"><div className="af-closing-symbol" aria-hidden="true"><Plus size={36} strokeWidth={1} /></div><h2>What’s on your mind?</h2><p>There’s a canvas for that.</p><Link href="/dashboard" className="af-button">Give your idea some space <ArrowRight size={17} /></Link></section>
      </main>
      <footer className="af-footer"><Brand /><span>A little room for your next big idea.</span><a href="#main">Back to top <ArrowUpRight size={14} /></a></footer>
    </div>
  );
}
