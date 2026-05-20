'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatsCard from '@/components/StatsCard';
import Link from 'next/link';

interface Stats {
  totalVideos: number;
  totalSize: number;
  recentVideos: Array<{
    _id: string;
    name: string;
    size: number;
    uploadedAt: string;
  }>;
  tagDistribution: Array<{ tag: string; count: number }>;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
      <p className="mb-8 text-white/50">Bienvenido, {user?.name}</p>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Videos Subidos"
          value={String(stats?.totalVideos || 0)}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Espacio Ocupado"
          value={formatSize(stats?.totalSize || 0)}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        />
        <StatsCard
          title="Tags Unicos"
          value={String(stats?.tagDistribution?.length || 0)}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Videos */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Videos Recientes</h2>
          {stats?.recentVideos && stats.recentVideos.length > 0 ? (
            <div className="space-y-3">
              {stats.recentVideos.map(v => (
                <Link
                  key={v._id}
                  href={`/videos/${v._id}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 p-3 transition-colors hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{v.name}</p>
                    <p className="text-xs text-white/40">{new Date(v.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-white/30">{formatSize(v.size)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">No hay videos todavia</p>
          )}
        </div>

        {/* Tag Distribution */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Tags mas usados</h2>
          {stats?.tagDistribution && stats.tagDistribution.length > 0 ? (
            <div className="space-y-3">
              {stats.tagDistribution.map(({ tag, count }) => {
                const maxCount = stats.tagDistribution[0].count;
                const width = Math.max(10, (count / maxCount) * 100);
                return (
                  <div key={tag}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-violet-300">{tag}</span>
                      <span className="text-white/40">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/40">No hay tags todavia</p>
          )}
        </div>
      </div>
    </div>
  );
}
