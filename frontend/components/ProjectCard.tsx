"use client";

import { useState } from "react";
import { apiDeleteAuth, apiPutAuth } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description?: string | null;
}

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onUpdate: () => void;
  onSelect: (projectId: string) => void;
  isSelected: boolean;
}

export default function ProjectCard({ 
  project, 
  taskCount, 
  onUpdate, 
  onSelect, 
  isSelected 
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || "");
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      setUpdating(true);
      await apiPutAuth(`/projects/${project.id}`, {
        name: editName,
        description: editDescription || null,
      });
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete "${project.name}"? This will also delete all tasks in this project.`)) {
      return;
    }
    
    try {
      setDeleting(true);
      await apiDeleteAuth(`/projects/${project.id}`);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => onSelect(project.id)}
        className={`w-full text-left btn-base text-sm transition-all group ${
          isSelected ? 'btn-accent' : 'hover:scale-[1.02]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--code-green)] to-[var(--code-yellow)] flex items-center justify-center">
            <span className="text-white font-bold text-xs">{project.name[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{project.name}</div>
            <div className="text-xs text-faint truncate">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ⋮
          </button>
        </div>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 z-10 card p-2 min-w-[120px]">
          <button
            onClick={() => {
              setShowEditModal(true);
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDeleteProject}
            disabled={deleting}
            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[var(--bg-hover)] transition-colors code-color-red"
          >
            {deleting ? "🔄 Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-primary mb-4">Edit Project</h3>
            
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditName(project.name);
                    setEditDescription(project.description || "");
                  }}
                  className="btn-base text-sm px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-base btn-accent text-sm px-4 py-2 transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}