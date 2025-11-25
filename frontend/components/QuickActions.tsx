"use client";

interface QuickActionsProps {
  onCreateTask: () => void;
  onCreateProject: () => void;
  selectedProject: string | null;
}

export default function QuickActions({ 
  onCreateTask, 
  onCreateProject, 
  selectedProject 
}: QuickActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-faint">Quick Actions</div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onCreateProject}
          className="btn-base text-xs px-3 py-2 transition-all hover:scale-105"
          title="Create new project"
        >
          📁 Project
        </button>
        
        <button
          onClick={onCreateTask}
          disabled={!selectedProject}
          className="btn-base btn-accent text-xs px-3 py-2 transition-all hover:scale-105 disabled:opacity-50"
          title={!selectedProject ? "Select a project first" : "Create new task"}
        >
          ✚ Task
        </button>
        
        <div className="w-px h-6 bg-[var(--border)]"></div>
        
        <button
          className="btn-base text-xs px-3 py-2 transition-all hover:scale-105"
          title="Keyboard shortcuts"
        >
          ⌘K
        </button>
        
        <button
          className="btn-base text-xs px-3 py-2 transition-all hover:scale-105"
          title="Export data"
        >
          📊
        </button>
      </div>
    </div>
  );
}