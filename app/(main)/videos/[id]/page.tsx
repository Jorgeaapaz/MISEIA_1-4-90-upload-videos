'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import TagInput from '@/components/TagInput';
import MetadataForm from '@/components/MetadataForm';

interface Video {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  metadata: Record<string, string>;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  updatedAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editMetadata, setEditMetadata] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/videos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Video) => {
        setVideo(data);
        setEditName(data.name);
        setEditDescription(data.description);
        setEditTags(data.tags);
        setEditMetadata(data.metadata);
      })
      .catch(() => router.push('/videos'))
      .finally(() => setLoading(false));
  }, [id, token, router]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          tags: editTags,
          metadata: editMetadata,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVideo(updated);
        setEditing(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!token || !confirm('Estas seguro de que quieres eliminar este video?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) router.push('/videos');
    } catch { /* ignore */ }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <VideoPlayer videoId={id} />

      <div className="mt-6 space-y-6">
        {editing ? (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
            <div>
              <label className="mb-1 block text-sm text-white/70">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Descripcion</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Tags</label>
              <TagInput tags={editTags} onChange={setEditTags} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Metadatos</label>
              <MetadataForm metadata={editMetadata} onChange={setEditMetadata} />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-white/10 px-5 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{video.name}</h1>
                {video.description && (
                  <p className="mt-2 text-white/60">{video.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/40">
              <span>{formatSize(video.size)}</span>
              <span>{video.contentType}</span>
              <span>Subido: {new Date(video.uploadedAt).toLocaleString()}</span>
            </div>

            {video.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {video.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-violet-500/15 px-3 py-1 text-sm text-violet-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {Object.keys(video.metadata).length > 0 && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 text-sm font-medium text-white/70">Metadatos</h3>
                <div className="space-y-1">
                  {Object.entries(video.metadata).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="font-medium text-white/50">{k}:</span>
                      <span className="text-white/70">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
