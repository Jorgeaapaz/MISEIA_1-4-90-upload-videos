'use client';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}

export default function StatsCard({ title, value, icon, subtitle }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
          {icon}
        </div>
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
