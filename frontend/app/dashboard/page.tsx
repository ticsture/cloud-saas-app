"use client";

import { useEffect, useState } from "react";
import { apiGetAuth, apiPostAuth, apiPutAuth } from "@/lib/api";

interface Workspace {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  workspaceId: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  description?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}

interface Attachment {
  id: string;
  fileName: string;
  createdAt: string;
}

type ViewMode = "list" | "board";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, Attachment[]>>({});
  const [attachmentsLoading, setAttachmentsLoading] = useState<Record<string, boolean>>({});

  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  // Edit/Delete state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Create Task Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  // -------------------------------
  // 1. Load Workspaces
  // -------------------------------
  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await apiGetAuth<{ workspaces: Workspace[] }>("/workspaces/my");
        setWorkspaces(data.workspaces);

        if (data.workspaces.length > 0) {
          setSelectedWorkspace(data.workspaces[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    loadWorkspaces();
  }, []);

  // -------------------------------
  // 2. Load Projects
  // -------------------------------
  useEffect(() => {
    if (!selectedWorkspace) return;

    async function loadProjects() {
      try {
        setLoading(true);
        const data = await apiGetAuth<{ projects: Project[] }>(
          `/projects?workspaceId=${selectedWorkspace}`
        );
        setProjects(data.projects);

        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        } else {
          setSelectedProject(null);
          setTasks([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [selectedWorkspace]);

  // -------------------------------
  // 3. Load Tasks
  // -------------------------------
  useEffect(() => {
    if (!selectedProject) return;

    async function loadTasks() {
      try {
        const data = await apiGetAuth<{ tasks: Task[] }>(
          `/tasks?projectId=${selectedProject}`
        );
        setTasks(data.tasks);
      } catch (err: any) {
        setError(err.message);
      }
    }

    loadTasks();
  }, [selectedProject]);

  async function refreshTasks() {
    if (!selectedProject) return;
    try {
      const data = await apiGetAuth<{ tasks: Task[] }>(
        `/tasks?projectId=${selectedProject}`
      );
      setTasks(data.tasks);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // -------------------------------
  // Attachments (lazy load per task)
  // -------------------------------
  async function loadAttachments(taskId: string) {
    if (attachmentsLoading[taskId]) return;
    if (attachmentsMap[taskId]) return; // already loaded
    setAttachmentsLoading((prev) => ({ ...prev, [taskId]: true }));
    try {
      const data = await apiGetAuth<{ attachments: Attachment[] }>(
        `/attachments/task/${taskId}`
      );
      setAttachmentsMap((prev) => ({ ...prev, [taskId]: data.attachments }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAttachmentsLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  }

  async function downloadAttachment(attachmentId: string) {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/attachments/${attachmentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to get download URL");
      }
      const { downloadUrl } = await res.json();
      if (downloadUrl) window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      setError(err.message);
    }
  }

  // -------------------------------
  // ⭐ UPLOAD ATTACHMENT TO S3
  // -------------------------------
  async function uploadAttachment(taskId: string, file: File) {
    try {
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      const res = await fetch(`${API_URL}/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "File upload failed");
      }

      setSuccessMessage("Attachment uploaded!");
      setTimeout(() => setSuccessMessage(null), 2500);
      // Force reload attachments list for this task
      setAttachmentsMap((prev) => ({ ...prev, [taskId]: undefined as any }));
      loadAttachments(taskId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // -------------------------------
  // Update Task Status
  // -------------------------------
  async function updateTaskStatus(taskId: string, status: string) {
    try {
      await apiPutAuth<{ task: Task }>(`/tasks/${taskId}`, { status });
      await refreshTasks();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // -------------------------------
  // Edit Task (open modal)
  // -------------------------------
  function openEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "medium");
    setShowEditModal(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTaskId) return;
    try {
      await apiPutAuth<{ task: Task }>(`/tasks/${editingTaskId}`, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      });
      setShowEditModal(false);
      setEditingTaskId(null);
      await refreshTasks();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // -------------------------------
  // Delete Task
  // -------------------------------
  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to delete task");
      }
      // Clean attachments cache
      setAttachmentsMap((prev) => {
        const clone = { ...prev };
        delete clone[taskId];
        return clone;
      });
      await refreshTasks();
      setSuccessMessage("Task deleted");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // -------------------------------
  // Create Task
  // -------------------------------
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) return setError("Select a project first");
    if (!newTaskTitle.trim()) return setError("Task title required");

    try {
      await apiPostAuth<{ task: Task }>("/tasks", {
        title: newTaskTitle,
        description: newTaskDescription,
        projectId: selectedProject,
        priority: newTaskPriority,
      });

      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      await refreshTasks();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Split tasks for board view
  const tasksTodo = tasks.filter((t) => t.status === "todo");
  const tasksInProgress = tasks.filter((t) => t.status === "in_progress");
  const tasksDone = tasks.filter((t) => t.status === "done");

  // -------------------------------
  // UI
  // -------------------------------
  if (loading && !selectedWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-3">Workspaces</h2>

        <div className="space-y-1 mb-6">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setSelectedWorkspace(ws.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedWorkspace === ws.id
                  ? "bg-emerald-600"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {ws.name}
            </button>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-3">Projects</h2>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedProject === p.id
                  ? "bg-emerald-600"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 p-6 flex flex-col gap-4">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tasks</h1>
            <p className="text-sm text-slate-400">
              Workspace: {workspaces.find(w => w.id === selectedWorkspace)?.name} ·
              Project: {projects.find(p => p.id === selectedProject)?.name}
            </p>
          </div>

          <div className="inline-flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === "list"
                  ? "bg-emerald-600"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === "board"
                  ? "bg-emerald-600"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Board View
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-950/40 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-500 bg-emerald-900/40 text-emerald-200 px-3 py-2 text-sm">
            {successMessage}
          </div>
        )}

        {/* CREATE TASK */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-lg font-medium mb-3">Create New Task</h2>

          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Title</label>
              <input
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium"
            >
              Add Task
            </button>

            <div className="md:col-span-4">
              <label className="text-xs text-slate-400 mb-1 block">
                Description (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                rows={2}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* --------------------------- */}
        {/* LIST VIEW */}
        {/* --------------------------- */}
        {viewMode === "list" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-slate-400">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="group bg-slate-800/90 rounded-lg px-4 py-4 border border-slate-700/60 hover:border-emerald-600/60 transition-colors flex flex-col gap-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                          {task.title}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                            {task.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300 capitalize">
                            {task.priority || "medium"}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          ID: <span className="font-mono text-slate-300/80">{task.id.slice(0,8)}</span>
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 max-w-[480px]">{task.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => openEditTask(task)}
                          className="px-2 py-1 text-xs rounded bg-slate-700/70 hover:bg-slate-600"
                          title="Edit"
                        >Edit</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2 py-1 text-xs rounded bg-red-600/80 hover:bg-red-600"
                          title="Delete"
                        >Del</button>
                        <label className="px-2 py-1 text-xs rounded bg-slate-700/70 hover:bg-slate-600 cursor-pointer transition-colors">
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadAttachment(task.id, file);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={() => updateTaskStatus(task.id, "todo")}
                          className="px-2 py-1 text-xs rounded bg-slate-700/70 hover:bg-slate-600"
                        >
                          To Do
                        </button>
                        <button
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="px-2 py-1 text-xs rounded bg-slate-700/70 hover:bg-slate-600"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => updateTaskStatus(task.id, "done")}
                          className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-slate-700/50 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">Attachments</span>
                        {attachmentsLoading[task.id] && (
                          <span className="text-[10px] text-emerald-400 animate-pulse">Loading…</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(attachmentsMap[task.id] || []).map((att) => (
                          <button
                            key={att.id}
                            onClick={() => downloadAttachment(att.id)}
                            className="group/att relative px-3 py-1.5 text-[11px] rounded-md bg-slate-750/70 hover:bg-slate-700 border border-slate-600/60 hover:border-emerald-500/60 flex items-center gap-2 font-medium text-slate-200 transition-colors"
                            title={`Download ${att.fileName}`}
                          >
                            <span className="truncate max-w-[120px]">{att.fileName}</span>
                            <span className="text-emerald-400 opacity-0 group-hover/att:opacity-100 transition-opacity">↓</span>
                          </button>
                        ))}
                        {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                          <button
                            onClick={() => loadAttachments(task.id)}
                            className="px-3 py-1.5 text-[11px] rounded-md bg-slate-750/70 hover:bg-slate-700 border border-dashed border-slate-600/60 text-slate-300"
                          >
                            Load
                          </button>
                        )}
                        {attachmentsMap[task.id] && attachmentsMap[task.id].length === 0 && (
                          <span className="text-[11px] text-slate-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --------------------------- */}
        {/* BOARD VIEW */}
        {/* --------------------------- */}
        {viewMode === "board" && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* COLUMN: To Do */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-3">
              <h3 className="font-semibold mb-2">To Do</h3>
              <div className="space-y-2">
                {tasksTodo.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 hover:border-emerald-600/60 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm mb-1 flex-1">{task.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTask(task)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-700 hover:bg-slate-600"
                          title="Edit"
                        >E</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2 py-1 text-[10px] rounded bg-red-600/80 hover:bg-red-600"
                          title="Delete"
                        >X</button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Priority: {task.priority}
                    </p>

                    <label className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 cursor-pointer mr-2">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadAttachment(task.id, file);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>

                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                    >
                      Move to In Progress
                    </button>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(attachmentsMap[task.id] || []).map((att) => (
                        <button
                          key={att.id}
                          onClick={() => downloadAttachment(att.id)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-700/70 hover:bg-slate-600 border border-slate-600/50 hover:border-emerald-500/60 transition-colors"
                        >
                          {att.fileName}
                        </button>
                      ))}
                      {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                        <button
                          onClick={() => loadAttachments(task.id)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-750/70 hover:bg-slate-700 border border-dashed border-slate-600/60"
                        >Load</button>
                      )}
                      {attachmentsLoading[task.id] && (
                        <span className="text-[10px] text-emerald-400 animate-pulse">Loading…</span>
                      )}
                      {attachmentsMap[task.id] && attachmentsMap[task.id].length === 0 && (
                        <span className="text-[10px] text-slate-500">No attachments</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: In Progress */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-3">
              <h3 className="font-semibold mb-2">In Progress</h3>
              <div className="space-y-2">
                {tasksInProgress.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 hover:border-emerald-600/60 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm mb-1 flex-1">{task.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTask(task)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-700 hover:bg-slate-600"
                          title="Edit"
                        >E</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2 py-1 text-[10px] rounded bg-red-600/80 hover:bg-red-600"
                          title="Delete"
                        >X</button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Priority: {task.priority}
                    </p>

                    <label className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 cursor-pointer mr-2">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadAttachment(task.id, file);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTaskStatus(task.id, "todo")}
                        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, "done")}
                        className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                      >
                        Done
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(attachmentsMap[task.id] || []).map((att) => (
                        <button
                          key={att.id}
                          onClick={() => downloadAttachment(att.id)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-700/70 hover:bg-slate-600 border border-slate-600/50 hover:border-emerald-500/60 transition-colors"
                        >
                          {att.fileName}
                        </button>
                      ))}
                      {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                        <button
                          onClick={() => loadAttachments(task.id)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-750/70 hover:bg-slate-700 border border-dashed border-slate-600/60"
                        >Load</button>
                      )}
                      {attachmentsLoading[task.id] && (
                        <span className="text-[10px] text-emerald-400 animate-pulse">Loading…</span>
                      )}
                      {attachmentsMap[task.id] && attachmentsMap[task.id].length === 0 && (
                        <span className="text-[10px] text-slate-500">No attachments</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: Done */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-3">
              <h3 className="font-semibold mb-2">Done</h3>
              <div className="space-y-2">
                {tasksDone.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 hover:border-emerald-600/60 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm mb-1 flex-1">{task.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTask(task)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-700 hover:bg-slate-600"
                          title="Edit"
                        >E</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2 py-1 text-[10px] rounded bg-red-600/80 hover:bg-red-600"
                          title="Delete"
                        >X</button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Priority: {task.priority}
                    </p>

                    <label className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 cursor-pointer mr-2">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadAttachment(task.id, file);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>

                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                    >
                      Move Back
                    </button>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(attachmentsMap[task.id] || []).map((att) => (
                        <button
                          key={att.id}
                          onClick={() => downloadAttachment(att.id)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-700/70 hover:bg-slate-600 border border-slate-600/50 hover:border-emerald-500/60 transition-colors"
                        >
                          {att.fileName}
                        </button>
                      ))}
                      {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                        <button
                          onClick={() => loadAttachments(task.id)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-750/70 hover:bg-slate-700 border border-dashed border-slate-600/60"
                        >Load</button>
                      )}
                      {attachmentsLoading[task.id] && (
                        <span className="text-[10px] text-emerald-400 animate-pulse">Loading…</span>
                      )}
                      {attachmentsMap[task.id] && attachmentsMap[task.id].length === 0 && (
                        <span className="text-[10px] text-slate-500">No attachments</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>{/* END MAIN AREA */}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Title</label>
                <input
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingTaskId(null); }}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600"
                >Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium"
                >Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
