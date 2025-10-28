'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  extractedText?: string;
}

interface AnalysisResult {
  id: string;
  documentId: string;
  analysisType: string;
  status: string;
  results: any;
  createdAt: string;
  updatedAt: string;
}

export default function AnalysisPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
      fetchAnalyses();
    }
  }, [user?.id]);

  const fetchDocuments = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/documents?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyses = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/v1/analyses?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    }
  };

  const handleAnalyze = async (documentId: string) => {
    if (!user?.id) return;
    
    setAnalyzing(documentId);
    try {
      const response = await fetch(`/api/v1/documents/${documentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'kvkk' }),
      });

      if (response.ok) {
        setToast({ message: 'Analiz başlatıldı! Sonuçları görmek için sayfayı yenileyin.', type: 'success' });
        fetchAnalyses();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Analiz başarısız', type: 'error' });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setToast({ message: 'Analiz yapılırken bir hata oluştu', type: 'error' });
    } finally {
      setAnalyzing(null);
    }
  };

  const getAnalysisStatus = (documentId: string) => {
    const analysis = analyses.find(a => a.documentId === documentId);
    return analysis;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1A237E] mb-2">KVKK Analiz Merkezi</h1>
            <p className="text-gray-600">Belgelerinizi Türk Kişisel Verilerin Korunması Kanunu'na göre analiz edin</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">Analiz için döküman bulunamadı</p>
            <Link href="/documents">
              <Button variant="primary">Döküman Yükle</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => {
              const analysis = getAnalysisStatus(doc.id);
              return (
                <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1A237E] mb-1">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </p>
                      {analysis && (
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            analysis.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {analysis.status === 'completed' ? '✓ Analiz Tamamlandı' : '⏳ Analiz Ediliyor'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!analysis && (
                        <Button
                          variant="primary"
                          onClick={() => handleAnalyze(doc.id)}
                          disabled={analyzing === doc.id}
                        >
                          {analyzing === doc.id ? 'Analiz Ediliyor...' : 'Analiz Et'}
                        </Button>
                      )}
                      {analysis && analysis.status === 'completed' && (
                        <Link href={`/analysis/${analysis.id}`}>
                          <Button variant="outline">
                            Sonuçları Gör →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

