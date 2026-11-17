"use client";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import BoardCard from "./BoardCard";
import CreateNewBoardDialog from "./CreateNewBoardDialog";
import { Archive, Layout, Loader2, Search } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserDetailsContext } from "@/context/UserDetailsContext";

export interface ProjectItem {
  id: number;
  projectId: string;
  projectName: string;
  userEmail: string;
  createdAt: string;
  updatedAt?: string;
  image?: string | null;
}

function ProjectList() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [error, setError] = useState(false);
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { refreshUserDetails } = useContext(UserDetailsContext) || {};

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await axios.get("/api/projects");
      if (Array.isArray(res.data)) {
        setProjectList(res.data);
      }
    } catch (err) {
      setError(true);
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProjectId) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`/api/projects?projectId=${deleteProjectId}`);
      if (res.status === 200) {
        setProjectList((prev) => prev.filter((p) => p.projectId !== deleteProjectId));
        await refreshUserDetails?.();
        toast.add({ title: "Board moved to archive", type: "success" });
      }
    } catch (err) {
      console.error("Failed to archive project:", err);
      toast.add({ title: "Failed to archive board", type: "error" });
    } finally {
      setDeleting(false);
      setDeleteProjectId(null);
    }
  };

  const visibleProjects = projectList.filter(project => project.projectName.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'name' ? a.projectName.localeCompare(b.projectName) : new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  return (
    <section className="db-boards" aria-label="Your boards">
      <div className="db-list-toolbar">
        <h2>All boards <span>{loading ? '—' : projectList.length}</span></h2>
        <div className="db-list-controls">
          <label className="db-search"><Search size={15} /><input aria-label="Search boards" placeholder="Search boards…" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <select className="db-sort" aria-label="Sort boards" value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently edited</option><option value="name">Name A–Z</option></select>
        </div>
      </div>
      {loading ? <div className="db-empty" role="status"><Loader2 size={23} className="animate-spin" /><p>Loading your boards…</p></div> : error ? <div className="db-empty" role="alert"><h3>Couldn’t load your boards.</h3><p>Please try again in a moment.</p><button className="db-button" onClick={fetchProjects}>Try again</button></div> : projectList.length === 0 ? <div className="db-empty"><div className="db-empty-icon"><Layout size={28} strokeWidth={1.2} /></div><h3>Your next idea starts here.</h3><p>Create a board to sketch, connect, and see things clearly.</p><CreateNewBoardDialog /></div> : visibleProjects.length === 0 ? <div className="db-empty"><Search size={23} /><h3>No matching boards.</h3><p>Try another name or clear your search.</p><button className="db-secondary-button" onClick={() => setQuery('')}>Clear search</button></div> : <div className="db-board-grid">{visibleProjects.map(project => <BoardCard key={project.projectId} project={project}><button className="db-icon-button" onClick={() => setDeleteProjectId(project.projectId)} aria-label={`Archive ${project.projectName}`} title="Archive board"><Archive size={15} /></button></BoardCard>)}</div>}

      {/* Move to Archive Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteProjectId}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
      >
        <AlertDialogContent className="db-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Archive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this board to Archive? You can restore it anytime from the Archived tab in the sidebar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="db-button"
            >
              {deleting ? "Archiving..." : "Move to Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default ProjectList;