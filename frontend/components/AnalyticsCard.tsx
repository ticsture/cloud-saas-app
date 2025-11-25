"use client";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
  color?: "blue" | "green" | "yellow" | "purple" | "red";
}

export default function AnalyticsCard({ 
  title, 
  value, 
  icon, 
  trend,
  color = "blue" 
}: AnalyticsCardProps) {
  const colorClasses = {
    blue: "from-[var(--code-blue)] to-[var(--ring)]",
    green: "from-[var(--code-green)] to-[var(--success)]",
    yellow: "from-[var(--code-yellow)] to-orange-500",
    purple: "from-[var(--code-purple)] to-purple-600",
    red: "from-[var(--code-red)] to-[var(--danger)]",
  };

  return (
    <div className="card p-6 transition-all hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-primary mt-1">{value.toLocaleString()}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs ${
                trend.direction === "up" 
                  ? "code-color-green" 
                  : trend.direction === "down" 
                  ? "code-color-red" 
                  : "text-secondary"
              }`}>
                {trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→"} 
                {trend.percentage}%
              </span>
              <span className="text-xs text-faint">vs last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}