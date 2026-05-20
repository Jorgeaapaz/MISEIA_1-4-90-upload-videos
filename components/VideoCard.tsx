'use client';

import Link from 'next/link';

interface VideoCardProps {
  id: string;
  name: string;
  tags: string[];
  size: number;
  uploadedAt: string;
  contentType: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function VideoCard({ id, name, tags, size, uploadedAt, contentType }: VideoCardProps) {
  return (
    <Link
      href={`/videos/${id}`}
      className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-violet-500/30 hover:bg-white/10"
    >
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30">
        <svg className="h-16 w-16 text-white/20 transition-colors group-hover:text-violet-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-white">{name}</h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
          <span>{formatSize(size)}</span>
          <span>&middot;</span>
          <span>{contentType.replace('video/', '').toUpperCase()}</span>
          <span>&middot;</span>
          <span>{new Date(uploadedAt).toLocaleDateString()}</span>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/30">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
