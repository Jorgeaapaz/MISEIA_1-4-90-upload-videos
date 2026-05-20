'use client';

import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div className="px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-white">Subir Video</h1>
      <UploadForm />
    </div>
  );
}
