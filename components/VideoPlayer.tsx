'use client';

import { useState, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
}

export default function VideoPlayer({ videoId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // The cookie "token" is sent automatically by the browser,
  // and the proxy.ts + route handler will authenticate via cookie.
  const streamUrl = `/api/stream/${videoId}`;

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-white/5">
        <p className="text-white/50">Error al cargar el video</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      {loading && (
        <div className="flex aspect-video items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      )}
      <video
        ref={videoRef}
        src={streamUrl}
        controls
        className={`aspect-video w-full ${loading ? 'hidden' : ''}`}
        onLoadedData={() => setLoading(false)}
        onError={() => setError(true)}
      >
        Tu navegador no soporta la reproduccion de video.
      </video>
    </div>
  );
}
