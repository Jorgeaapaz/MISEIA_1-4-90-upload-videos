'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/SearchBar';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';

interface Video {
  _id: string;
  name: string;
  tags: string[];
  size: number;
  uploadedAt: string;
  contentType: string;
}

export default function VideosPage() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState('');

  const fetchVideos = useCallback(async (q: string, t: string, p: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (t) params.set('tags', t);
      params.set('page', String(p));
      params.set('limit', '12');

      const res = await fetch(`/api/videos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos);
        setTotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVideos(query, tags, page);
  }, [query, tags, page, fetchVideos]);

  const handleSearch = useCallback((q: string, t: string) => {
    setQuery(q);
    setTags(t);
    setPage(1);
  }, []);

  return (
    <div className="px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Mis Videos</h1>
        <Link
          href="/upload"
          className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Subir Video
        </Link>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-white/40">No hay videos todavia</p>
          <Link href="/upload" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
            Sube tu primer video
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map(v => (
              <VideoCard
                key={v._id}
                id={v._id}
                name={v.name}
                tags={v.tags}
                size={v.size}
                uploadedAt={v.uploadedAt}
                contentType={v.contentType}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="flex items-center px-4 text-sm text-white/50">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
