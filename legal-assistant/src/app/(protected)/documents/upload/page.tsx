'use client';

import { DocumentUpload } from '@/components/features/DocumentUpload';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadSuccess = (file: File) => {
    console.log('File uploaded:', file.name);
    // After upload, redirect to documents page
    setTimeout(() => {
      router.push('/documents');
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1A237E] mb-6">Döküman Yükle</h1>
        <p className="text-gray-600 mb-8">PDF, DOC veya DOCX formatında dökümanlarınızı yükleyebilirsiniz. Maksimum dosya boyutu 20MB.</p>
        
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
}

