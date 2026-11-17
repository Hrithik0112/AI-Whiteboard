import Link from 'next/link';
import { ArrowUpRight, Layout } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ProjectItem } from './ProjectList';
import type { ReactNode } from 'react';

export default function BoardCard({ project, children }: { project: ProjectItem; children: ReactNode }) {
  let edited = 'recently';
  const date = new Date(project.updatedAt || project.createdAt);
  if (!Number.isNaN(date.getTime())) edited = formatDistanceToNow(date, { addSuffix: true });
  return <article className="db-board-card">
    <Link href={`/workspace/${project.projectId}`} className="db-board-link">
      <div className="db-board-preview">{project.image ? <img src={project.image} alt={`Preview of ${project.projectName}`} /> : <div className="db-blank-canvas"><Layout size={25} strokeWidth={1.3} /><span>A little space for an idea</span></div>}<ArrowUpRight className="db-board-arrow" size={17} /></div>
      <div className="db-board-info"><h3 title={project.projectName}>{project.projectName}</h3><p>Edited {edited}</p></div>
    </Link>
    <div className="db-board-footer"><span>Whiteboard</span><div>{children}</div></div>
  </article>;
}
