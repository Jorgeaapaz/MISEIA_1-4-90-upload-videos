'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import TagInput from './TagInput';
import MetadataForm from './MetadataForm';

export default function UploadForm() {
  const { token } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('Solo se permiten archivos de video');
      return;
    }
    setFile(f);
    setError('');
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || 'Error obteniendo URL de subida');
      }

      const { uploadUrl, key } = await presignRes.json();

      // Step 2: Upload directly to Rustfs via XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Error de red durante la subida'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Step 3: Save metadata
      const metaRes = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          tags,
          metadata,
          fileName: file.name,
          s3Key: key,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!metaRes.ok) {
        const data = await metaRes.json();
        throw new Error(data.error || 'Error guardando metadatos');
      }

      const video = await metaRes.json();
      router.push(`/videos/${video._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la subida');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        {file ? (
          <div>
            <p className="text-lg font-medium text-white">{file.name}</p>
            <p className="mt-1 text-sm text-white/50">
              {(file.size / (1024 * 1024)).toFixed(2)} MB - {file.type}
            </p>
          </div>
        ) : (
          <div>
            <svg className="mx-auto mb-4 h-12 w-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-white/50">Arrastra un video aqui o haz clic para seleccionar</p>
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-violet-500/50"
          placeholder="Nombre del video"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Descripcion</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-violet-500/50"
          placeholder="Descripcion del video"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Tags</label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* Metadata */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">Metadatos adicionales</label>
        <MetadataForm metadata={metadata} onChange={setMetadata} />
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-white/50">Subiendo... {progress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {uploading ? 'Subiendo...' : 'Subir Video'}
      </button>
    </form>
  );
}
