"use client";

import { useEffect, useState } from "react";
import { apiGetAuth } from "@/lib/api";

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
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

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

  // 2. Load projects of selected workspace
  useEffect(() => {
    if (!selectedWorkspace) return;

    async function loadProjects() {
      try {
        const data = await apiGetAuth<{ projects: Project[] }>(`/projects?workspaceId=${selectedWorkspace}`);
        setProjects(data.projects);

        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();

  }, [selectedWorkspace]);

  // 3. Load tasks of selected project
  useEffect(() => {
    if (!selectedProject) return;

    async function loadTasks() {
      try {
        const data = await apiGetAuth<{ tasks: Task[] }>(`/tasks?projectId=${selectedProject}`);
        setTasks(data.tasks);
      } catch (err: any) {
        setError(err.message);
      }
    }
    loadTasks();

  }, [selectedProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 p-4">
        <h2 className="text-xl font-semibold mb-4">Workspaces</h2>
        
        {workspaces.map(ws => (
          <div
            key={ws.id}
            onClick={() => setSelectedWorkspace(ws.id)}
            className={`p-2 rounded mb-1 cursor-pointer ${
              selectedWorkspace === ws.id 
              ? "bg-emerald-600" 
              : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {ws.name}
          </div>
        ))}

        <h2 className="text-xl font-semibold mt-6 mb-4">Projects</h2>
        {projects.map(p => (
          <div
            key={p.id}
            onClick={() => setSelectedProject(p.id)}
            className={`p-2 rounded mb-1 cursor-pointer ${
              selectedProject === p.id 
              ? "bg-emerald-600" 
              : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {p.name}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl mb-4">Tasks</h1>

        {error && <p className="text-red-400 mb-2">{error}</p>}

        {tasks.length === 0 && (
          <p className="text-slate-400">No tasks in this project.</p>
        )}

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700"
            >
              <h3 className="text-lg font-medium">{task.title}</h3>
              <p className="text-sm text-slate-400">{task.status}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
