"use client";

import { useEffect, useState } from "react";
import { apiGetAuth, apiPostAuth, apiPutAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import useAuth from "@/lib/useAuth";
import ProjectCard from "@/components/ProjectCard";
import AnalyticsCard from "@/components/AnalyticsCard";
import TeamInsights from "@/components/TeamInsights";

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
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, userEmail, logout } = useAuth();
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
  // Project Management
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [projectTemplate, setProjectTemplate] = useState("blank");
  const [creatingProject, setCreatingProject] = useState(false);
  
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
  // Authentication Check
  // -------------------------------
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

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
  // Create Project
  // -------------------------------
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkspace) return setError("Select a workspace first");
    if (!newProjectName.trim()) return setError("Project name required");

    try {
      setCreatingProject(true);
      await apiPostAuth<{ project: Project }>("/projects", {
        name: newProjectName,
        description: newProjectDescription || null,
        workspaceId: selectedWorkspace,
      });

      setNewProjectName("");
      setNewProjectDescription("");
      setProjectTemplate("blank");
      setShowCreateProject(false);
      setSuccessMessage("Project created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh projects list
      if (selectedWorkspace) {
        const data = await apiGetAuth<{ projects: Project[] }>(
          `/projects?workspaceId=${selectedWorkspace}`
        );
        setProjects(data.projects);
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[data.projects.length - 1].id); // Select newly created project
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingProject(false);
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
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen linear-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--ring)]/30 border-t-[var(--ring)] rounded-full animate-spin"></div>
          <span className="text-primary">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect will handle redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen linear-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--ring)]/30 border-t-[var(--ring)] rounded-full animate-spin"></div>
          <span className="text-primary">Redirecting...</span>
        </div>
      </div>
    );
  }

  if (loading && !selectedWorkspace) {
    return (
      <div className="min-h-screen linear-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--ring)]/30 border-t-[var(--ring)] rounded-full animate-spin"></div>
          <span className="text-primary">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-primary flex">

      {/* LEFT SIDEBAR */}
      <div className="w-80 sidebar p-6 flex flex-col">
        {/* Workspace Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Workspaces</h2>
            <div className="w-2 h-2 rounded-full bg-[var(--code-green)] animate-pulse" title="Active"></div>
          </div>

          <div className="space-y-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws.id)}
                className={`w-full text-left btn-base text-sm transition-all ${
                  selectedWorkspace === ws.id ? 'btn-accent' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--code-blue)] to-[var(--code-purple)] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{ws.name[0].toUpperCase()}</span>
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Projects</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              className="btn-base btn-accent text-xs px-3 py-1.5 transition-all hover:scale-105"
              disabled={!selectedWorkspace}
              title={!selectedWorkspace ? "Select a workspace first" : "Create new project"}
            >
              + New
            </button>
          </div>

          {!selectedWorkspace ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-faint text-sm">Select a workspace to view projects</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-faint text-sm mb-3">No projects yet</p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="btn-base btn-accent text-xs px-4 py-2"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  taskCount={tasks.filter(t => projects.find(proj => proj.id === selectedProject)?.id === selectedProject).length}
                  onUpdate={async () => {
                    if (selectedWorkspace) {
                      const data = await apiGetAuth<{ projects: Project[] }>(
                        `/projects?workspaceId=${selectedWorkspace}`
                      );
                      setProjects(data.projects);
                      // If current project was deleted, clear selection
                      if (!data.projects.find(p => p.id === selectedProject)) {
                        setSelectedProject(null);
                        setTasks([]);
                      }
                    }
                  }}
                  onSelect={setSelectedProject}
                  isSelected={selectedProject === p.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* User Info & Stats */}
        <div className="border-t border-[var(--border)] pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ring)] to-[var(--code-purple)] flex items-center justify-center">
              <span className="text-white font-bold text-xs">{userEmail?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary truncate">{userEmail}</div>
              <div className="text-xs text-faint">Member</div>
            </div>
            <button
              onClick={logout}
              className="btn-base text-xs px-2 py-1 opacity-60 hover:opacity-100"
              title="Logout"
            >
              ↗
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="text-primary font-medium">{projects.length}</div>
              <div className="text-faint">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-primary font-medium">{tasks.length}</div>
              <div className="text-faint">Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 p-6 flex flex-col gap-4">

        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                {projects.find(p => p.id === selectedProject)?.name || 'Tasks'}
                {selectedProject && (
                  <span className="text-sm font-normal pill">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                <span>{workspaces.find(w => w.id === selectedWorkspace)?.name}</span>
                {selectedProject && (
                  <>
                    <span className="text-faint">•</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--code-green)]"></div>
                      <span>Active Project</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            {selectedProject && (
              <div className="hidden md:flex items-center gap-4 ml-8">
                <div className="text-center">
                  <div className="text-lg font-bold code-color-blue">{tasksTodo.length}</div>
                  <div className="text-xs text-faint">To Do</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold code-color-yellow">{tasksInProgress.length}</div>
                  <div className="text-xs text-faint">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold code-color-green">{tasksDone.length}</div>
                  <div className="text-xs text-faint">Completed</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="inline-flex items-center card p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`btn-base text-xs ${viewMode === 'list' ? 'btn-accent' : ''}`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`btn-base text-xs ${viewMode === 'board' ? 'btn-accent' : ''}`}
              >
                📊 Board
              </button>
            </div>
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        {selectedProject && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AnalyticsCard
              title="Total Tasks"
              value={tasks.length}
              icon="📊"
              trend={{ direction: "up", percentage: 12 }}
              color="blue"
            />
            <AnalyticsCard
              title="In Progress"
              value={tasksInProgress.length}
              icon="🔄"
              trend={{ direction: "up", percentage: 8 }}
              color="yellow"
            />
            <AnalyticsCard
              title="Completed"
              value={tasksDone.length}
              icon="✅"
              trend={{ direction: "up", percentage: 23 }}
              color="green"
            />
            <AnalyticsCard
              title="Completion Rate"
              value={Math.round(tasks.length ? (tasksDone.length / tasks.length) * 100 : 0)}
              icon="🎯"
              trend={{ 
                direction: tasksDone.length > tasksInProgress.length ? "up" : "down", 
                percentage: 15 
              }}
              color="purple"
            />
          </div>
        )}

        {/* TEAM INSIGHTS */}
        {selectedProject && tasks.length > 0 && (
          <TeamInsights tasks={tasks} projects={projects} />
        )}

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
        {selectedProject ? (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-semibold text-primary">Create New Task</h2>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary mb-2">Task Title</label>
                  <input
                    className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Priority</label>
                  <select
                    className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Description (optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  rows={3}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Add more details about this task..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-base btn-accent text-sm px-6 py-3 font-medium transition-all hover:scale-[1.02]"
                >
                  ➕ Create Task
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card p-8 mb-6 text-center">
            <div className="w-16 h-16 rounded-lg bg-[var(--bg-hover)] mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Select a Project</h3>
            <p className="text-secondary mb-4">
              Choose a project from the sidebar to start creating and managing tasks.
            </p>
            <button
              onClick={() => setShowCreateProject(true)}
              className="btn-base btn-accent text-sm px-6 py-3"
              disabled={!selectedWorkspace}
            >
              {selectedWorkspace ? "Create New Project" : "Select Workspace First"}
            </button>
          </div>
        )}

        {/* --------------------------- */}
        {/* LIST VIEW */}
        {/* --------------------------- */}
        {viewMode === "list" && (
          <div className="card p-4 flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-slate-400">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="group card card-hover px-4 py-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                          {task.title}
                          <span className={`pill status-${task.status}`}>{task.status.replace('_',' ')}</span>
                          <span className="pill">{task.priority || 'medium'}</span>
                        </h3>
                        <p className="text-xs text-faint">
                          ID: <span className="mono-id text-secondary">{task.id.slice(0,8)}</span>
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 max-w-[480px]">{task.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => openEditTask(task)}
                          className="btn-base text-xs"
                          title="Edit"
                        >Edit</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-base btn-danger text-xs"
                          title="Delete"
                        >Del</button>
                        <label className="btn-base text-xs cursor-pointer">
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
                          className="btn-base text-xs"
                        >To Do</button>
                        <button
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="btn-base text-xs"
                        >In Progress</button>
                        <button
                          onClick={() => updateTaskStatus(task.id, "done")}
                          className="btn-base btn-accent text-xs"
                        >Done</button>
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
                            className="btn-base text-[11px] px-3 py-1.5"
                            title={`Download ${att.fileName}`}
                          >
                            <span className="truncate max-w-[120px]">{att.fileName}</span>
                          </button>
                        ))}
                        {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                          <button
                            onClick={() => loadAttachments(task.id)}
                            className="btn-base text-[11px]"
                          >Load</button>
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
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--code-blue)]"></div>
                To Do
                <span className="pill text-xs ml-auto">{tasksTodo.length}</span>
              </h3>
              <div className="space-y-3">
                {tasksTodo.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="card card-hover p-4 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm text-primary">{task.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTask(task)}
                          className="btn-base text-[10px] px-1.5 py-1"
                          title="Edit"
                        >✏️</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-base btn-danger text-[10px] px-1.5 py-1"
                          title="Delete"
                        >🗑️</button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-secondary line-clamp-2 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={`pill status-${task.status}`}>{task.priority || 'medium'}</span>
                      <span className="mono-id text-faint">{task.id.slice(0,6)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <label className="btn-base text-[10px] px-2 py-1 cursor-pointer">
                        📎
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
                      
                      {(attachmentsMap[task.id] || []).slice(0, 2).map((att) => (
                        <button
                          key={att.id}
                          onClick={() => downloadAttachment(att.id)}
                          className="btn-base text-[10px] px-2 py-1 max-w-[80px] truncate"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </button>
                      ))}
                      
                      {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                        <button
                          onClick={() => loadAttachments(task.id)}
                          className="btn-base text-[10px] px-2 py-1 opacity-60"
                        >Load</button>
                      )}
                    </div>

                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="w-full btn-base btn-accent text-xs py-2"
                    >
                      Start Working →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: In Progress */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--code-yellow)]"></div>
                In Progress
                <span className="pill text-xs ml-auto">{tasksInProgress.length}</span>
              </h3>
              <div className="space-y-3">
                {tasksInProgress.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="card card-hover p-4 transition-all hover:scale-[1.02] cursor-pointer border-l-4 border-[var(--code-yellow)]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm text-primary">{task.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTask(task)}
                          className="btn-base text-[10px] px-1.5 py-1"
                          title="Edit"
                        >✏️</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-base btn-danger text-[10px] px-1.5 py-1"
                          title="Delete"
                        >🗑️</button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-secondary line-clamp-2 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={`pill status-${task.status}`}>{task.priority || 'medium'}</span>
                      <span className="mono-id text-faint">{task.id.slice(0,6)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <label className="btn-base text-[10px] px-2 py-1 cursor-pointer">
                        📎
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
                      
                      {(attachmentsMap[task.id] || []).slice(0, 2).map((att) => (
                        <button
                          key={att.id}
                          onClick={() => downloadAttachment(att.id)}
                          className="btn-base text-[10px] px-2 py-1 max-w-[80px] truncate"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </button>
                      ))}
                      
                      {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                        <button
                          onClick={() => loadAttachments(task.id)}
                          className="btn-base text-[10px] px-2 py-1 opacity-60"
                        >Load</button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTaskStatus(task.id, "todo")}
                        className="flex-1 btn-base text-xs py-2"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, "done")}
                        className="flex-1 btn-base btn-accent text-xs py-2"
                      >
                        Complete ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: Done */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--code-green)]"></div>
                Done
                <span className="pill text-xs ml-auto">{tasksDone.length}</span>
              </h3>
              <div className="space-y-3">
                {tasksDone.map((task) => (
                  <div
                    key={task.id}
                    onMouseEnter={() => loadAttachments(task.id)}
                    className="card card-hover p-4 transition-all hover:scale-[1.02] cursor-pointer border-l-4 border-[var(--code-green)] opacity-75 hover:opacity-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm text-primary line-through">{task.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditTask(task)}
                          className="btn-base text-[10px] px-1.5 py-1"
                          title="Edit"
                        >✏️</button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-base btn-danger text-[10px] px-1.5 py-1"
                          title="Delete"
                        >🗑️</button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-secondary line-clamp-2 mb-3 line-through">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={`pill status-${task.status}`}>{task.priority || 'medium'}</span>
                      <span className="mono-id text-faint">{task.id.slice(0,6)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {(attachmentsMap[task.id] || []).slice(0, 2).map((att) => (
                        <button
                          key={att.id}
                          onClick={() => downloadAttachment(att.id)}
                          className="btn-base text-[10px] px-2 py-1 max-w-[80px] truncate"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </button>
                      ))}
                      
                      {!attachmentsMap[task.id] && !attachmentsLoading[task.id] && (
                        <button
                          onClick={() => loadAttachments(task.id)}
                          className="btn-base text-[10px] px-2 py-1 opacity-60"
                        >Load</button>
                      )}
                    </div>

                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="w-full btn-base text-xs py-2"
                    >
                      ← Reopen
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>{/* END MAIN AREA */}

      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg card p-8 animate-fade-in">
            <h3 className="text-xl font-bold text-primary mb-6">Create New Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  rows={3}
                  placeholder="Describe your project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  Project Template
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectTemplate("blank")}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      projectTemplate === "blank" 
                        ? "border-[var(--ring)] bg-[var(--ring)]/10" 
                        : "border-[var(--border)] hover:border-[var(--border-accent)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📋</span>
                      <div>
                        <div className="font-medium text-primary">Blank Project</div>
                        <div className="text-xs text-secondary">Start from scratch</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setProjectTemplate("kanban")}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      projectTemplate === "kanban" 
                        ? "border-[var(--ring)] bg-[var(--ring)]/10" 
                        : "border-[var(--border)] hover:border-[var(--border-accent)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <div className="font-medium text-primary">Kanban Board</div>
                        <div className="text-xs text-secondary">Pre-configured board layout</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProject(false);
                    setNewProjectName("");
                    setNewProjectDescription("");
                    setProjectTemplate("blank");
                  }}
                  className="btn-base text-sm px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject || !newProjectName.trim()}
                  className="btn-base btn-accent text-sm px-6 py-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {creatingProject ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-primary mb-4">Edit Task</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Title</label>
                <input
                  className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors"
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
                  className="btn-base text-sm px-4 py-2"
                >Cancel</button>
                <button
                  type="submit"
                  className="btn-base btn-accent text-sm px-4 py-2 font-medium"
                >Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
