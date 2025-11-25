"use client";

import { useState, useEffect } from "react";

interface TeamInsight {
  title: string;
  description: string;
  type: "info" | "warning" | "success";
}

interface TeamInsightsProps {
  tasks: any[];
  projects: any[];
}

export default function TeamInsights({ tasks, projects }: TeamInsightsProps) {
  const [insights, setInsights] = useState<TeamInsight[]>([]);

  useEffect(() => {
    const newInsights: TeamInsight[] = [];

    // High priority overdue tasks
    const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "done");
    if (highPriorityTasks.length > 0) {
      newInsights.push({
        title: `${highPriorityTasks.length} high-priority tasks need attention`,
        description: "Consider reviewing and prioritizing these tasks for faster completion.",
        type: "warning"
      });
    }

    // Completion rate insights
    const completedTasks = tasks.filter(t => t.status === "done");
    const completionRate = tasks.length ? (completedTasks.length / tasks.length) * 100 : 0;
    
    if (completionRate > 75) {
      newInsights.push({
        title: "Excellent completion rate!",
        description: `${Math.round(completionRate)}% of tasks completed. Your team is performing well.`,
        type: "success"
      });
    } else if (completionRate < 25) {
      newInsights.push({
        title: "Low completion rate detected",
        description: "Consider breaking down large tasks or adjusting workload distribution.",
        type: "warning"
      });
    }

    // Project insights
    if (projects.length === 1) {
      newInsights.push({
        title: "Single project workspace",
        description: "Consider organizing work into multiple projects for better structure.",
        type: "info"
      });
    }

    // Task distribution
    const todoTasks = tasks.filter(t => t.status === "todo").length;
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
    
    if (inProgressTasks > todoTasks * 2) {
      newInsights.push({
        title: "High work-in-progress",
        description: "Consider limiting concurrent tasks to improve focus and completion speed.",
        type: "warning"
      });
    }

    setInsights(newInsights.slice(0, 3)); // Show max 3 insights
  }, [tasks, projects]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🧠</span>
        <h3 className="text-lg font-semibold text-primary">Team Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              insight.type === "warning" 
                ? "bg-orange-500/10 border-orange-500" 
                : insight.type === "success"
                ? "bg-green-500/10 border-green-500"
                : "bg-blue-500/10 border-blue-500"
            }`}
          >
            <h4 className="font-medium text-primary text-sm mb-1">{insight.title}</h4>
            <p className="text-secondary text-xs">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}