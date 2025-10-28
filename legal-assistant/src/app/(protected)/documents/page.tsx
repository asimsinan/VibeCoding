'use client';

import { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components/features/DocumentUpload';
import { DocumentGallery } from '@/components/features/DocumentGallery';
import { Toast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';

interface Document {
  id: string;
  title: string;
  createdAt: Date;
  fileSize: number;
  mimeType: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/documents?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents?.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          createdAt: new Date(doc.createdAt),
          fileSize: doc.fileSize,
          mimeType: doc.mimeType
        })) || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user?.id]);


  const handleDocumentClick = (id: string) => {
    window.location.href = `/documents/${id}`;
  };

  const handleDeleteClick = (id: string) => {
    setDocToDelete(id);
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/documents/${docToDelete}`, { 
        method: 'DELETE' 
      });

      if (response.ok) {
        setToast({ message: 'Döküman başarıyla silindi', type: 'success' });
        await fetchDocuments();
        setDocToDelete(null);
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Silme işlemi başarısız', type: 'error' });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setToast({ message: 'Silme işlemi sırasında bir hata oluştu', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user?.id) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('userId', user.id);

      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setToast({ message: 'Döküman başarıyla yüklendi', type: 'success' });
        await fetchDocuments();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Yükleme başarısız', type: 'error' });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setToast({ message: 'Yükleme sırasında bir hata oluştu', type: 'error' });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/documents/${id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const doc = documents.find(d => d.id === id);
        a.download = doc?.title || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-[#1A237E] mb-6">Dökümanlar</h1>
        
        <DocumentUpload onUploadSuccess={handleUpload} />
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : (
          <DocumentGallery
            documents={documents}
            onDocumentClick={handleDocumentClick}
            onDelete={handleDeleteClick}
            onDownload={handleDownload}
          />
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {docToDelete && (
        <ConfirmModal
          title="Dökümanı Sil"
          message="Bu dökümanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDocToDelete(null)}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
        />
      )}
    </div>
  );
}

