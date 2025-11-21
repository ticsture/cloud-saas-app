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
}

type ViewMode = "list" | "board";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Create task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  // 1. Load workspaces
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

  // 2. Load projects when workspace changes
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

  // 3. Load tasks when project changes
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

  // Create a new task in the selected project
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject) {
      setError("Please select a project first");
      return;
    }
    if (!newTaskTitle.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setError(null);
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

  // Update task status (used in board view quick actions)
  async function updateTaskStatus(taskId: string, status: string) {
    try {
      await apiPutAuth<{ task: Task }>(`/tasks/${taskId}`, { status });
      await refreshTasks();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const tasksTodo = tasks.filter((t) => t.status === "todo");
  const tasksInProgress = tasks.filter((t) => t.status === "in_progress");
  const tasksDone = tasks.filter((t) => t.status === "done");

  if (loading && !selectedWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-3">Workspaces</h2>

        <div className="space-y-1 mb-6">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setSelectedWorkspace(ws.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedWorkspace === ws.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {ws.name}
            </button>
          ))}
          {workspaces.length === 0 && (
            <p className="text-xs text-slate-500">
              No workspaces. Sign up flow creates one by default.
            </p>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-3">Projects</h2>
        <div className="space-y-1 flex-1 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedProject === p.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {p.name}
            </button>
          ))}
          {projects.length === 0 && (
            <p className="text-xs text-slate-500">
              No projects in this workspace yet.
              <br />
              (We can later add a create-project UI.)
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tasks</h1>
            <p className="text-sm text-slate-400">
              Workspace:{" "}
              {workspaces.find((w) => w.id === selectedWorkspace)?.name ||
                "None"}{" "}
              · Project:{" "}
              {projects.find((p) => p.id === selectedProject)?.name || "None"}
            </p>
          </div>

          <div className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-700 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                viewMode === "list"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                viewMode === "board"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Board View
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-950/40 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Create Task Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-medium mb-3">Create New Task</h2>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Implement Kanban board"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-sm font-medium"
              >
                Add Task
              </button>
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs text-slate-400 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="Add some details about this task..."
              />
            </div>
          </form>
        </div>

        {/* View area */}
        {viewMode === "list" ? (
          // LIST VIEW
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No tasks found for this project. Create one above.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-medium">{task.title}</h3>
                      <p className="text-xs text-slate-400">
                        Status: {task.status} · Priority: {task.priority || "medium"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTaskStatus(task.id, "todo")}
                        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      >
                        To Do
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, "in_progress")}
                        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
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
                ))}
              </div>
            )}
          </div>
        ) : (
          // BOARD VIEW
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column: To Do */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col">
              <h3 className="text-sm font-semibold mb-2">To Do</h3>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {tasksTodo.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                  >
                    <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Priority: {task.priority || "medium"}
                    </p>
                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                    >
                      Move to In Progress
                    </button>
                  </div>
                ))}
                {tasksTodo.length === 0 && (
                  <p className="text-xs text-slate-500">No tasks.</p>
                )}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col">
              <h3 className="text-sm font-semibold mb-2">In Progress</h3>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {tasksInProgress.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                  >
                    <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Priority: {task.priority || "medium"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTaskStatus(task.id, "todo")}
                        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      >
                        Back to To Do
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, "done")}
                        className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}
                {tasksInProgress.length === 0 && (
                  <p className="text-xs text-slate-500">No tasks.</p>
                )}
              </div>
            </div>

            {/* Column: Done */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col">
              <h3 className="text-sm font-semibold mb-2">Done</h3>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {tasksDone.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                  >
                    <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      Priority: {task.priority || "medium"}
                    </p>
                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                    >
                      Move back to In Progress
                    </button>
                  </div>
                ))}
                {tasksDone.length === 0 && (
                  <p className="text-xs text-slate-500">No tasks.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
