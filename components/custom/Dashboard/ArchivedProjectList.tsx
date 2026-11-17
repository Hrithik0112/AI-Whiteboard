"use client";
import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Loader2, RotateCcw, Trash2, Archive } from "lucide-react";
import BoardCard from "./BoardCard";
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
import { ProjectItem } from "./ProjectList";
import { UserDetailsContext } from "@/context/UserDetailsContext";

function ArchivedProjectList() {
  const [error, setError] = useState(false);
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { refreshUserDetails } = useContext(UserDetailsContext) || {};

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  const fetchArchivedProjects = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await axios.get("/api/projects?archived=true");
      if (Array.isArray(res.data)) {
        setProjectList(res.data);
      }
    } catch (err) {
      setError(true);
      console.error("Failed to load archived projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (projectId: string) => {
    try {
      setRestoringId(projectId);
      const res = await axios.patch(`/api/projects?projectId=${projectId}&action=restore`);
      if (res.status === 200) {
        setProjectList((prev) => prev.filter((p) => p.projectId !== projectId));
        await refreshUserDetails?.();
        toast.add({ title: "Board restored to dashboard", type: "success" });
      }
    } catch (err: any) {
      void refreshUserDetails?.();
      console.error("Failed to restore project:", err);
      toast.add({ title: err?.response?.data?.error || "Failed to restore board", type: "error" });
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    try {
      setDeleting(true);
      const res = await axios.delete(`/api/projects?projectId=${permanentDeleteId}&permanent=true`);
      if (res.status === 200) {
        setProjectList((prev) => prev.filter((p) => p.projectId !== permanentDeleteId));
        await refreshUserDetails?.();
        toast.add({ title: "Board permanently deleted", type: "success" });
      }
    } catch (err) {
      console.error("Failed to delete project permanently:", err);
      toast.add({ title: "Failed to delete board", type: "error" });
    } finally {
      setDeleting(false);
      setPermanentDeleteId(null);
    }
  };

  return (
    <section>
      <div className="db-welcome"><div><span className="db-eyebrow">SAVED FOR LATER</span><h1>Archived boards.</h1><p>A place for ideas on pause. Restore them whenever you’re ready.</p></div></div>
      {loading ? <div className="db-empty" role="status"><Loader2 size={23} className="animate-spin" /><p>Loading archived boards…</p></div> : error ? <div className="db-empty" role="alert"><h3>Couldn’t load your archive.</h3><button className="db-button" onClick={fetchArchivedProjects}>Try again</button></div> : projectList.length === 0 ? <div className="db-empty"><div className="db-empty-icon"><Archive size={28} strokeWidth={1.2} /></div><h3>Nothing tucked away yet.</h3><p>Boards you archive will appear here.</p><Link href="/dashboard" className="db-secondary-button">Back to your boards</Link></div> : <div className="db-board-grid">{projectList.map(project => <BoardCard key={project.projectId} project={project}><button className="db-restore" disabled={restoringId !== null} onClick={() => handleRestore(project.projectId)} aria-label={`Restore ${project.projectName}`}><RotateCcw size={14} className={restoringId === project.projectId ? 'animate-spin' : ''} />{restoringId === project.projectId ? 'Restoring…' : 'Restore'}</button><button className="db-icon-button db-danger" onClick={() => setPermanentDeleteId(project.projectId)} aria-label={`Permanently delete ${project.projectName}`} title="Delete permanently"><Trash2 size={15} /></button></BoardCard>)}</div>}

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        open={!!permanentDeleteId}
        onOpenChange={(open) => !open && setPermanentDeleteId(null)}
      >
        <AlertDialogContent className="db-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Board?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently erase the whiteboard and all its canvas drawings from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default ArchivedProjectList;