'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnalysisData {
  id: string;
  documentId: string;
  analysisType: string;
  status: string;
  results: {
    documentId: string;
    overallStatus: string;
    riskScore: number;
    findings: Array<{
      ruleId: string;
      severity: string;
      finding: string;
      recommendation: string;
      evidence?: string;
    }>;
    recommendations: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Turkish rule name mapping
const ruleNameMap: { [key: string]: string } = {
  'data-collection-basis': 'Veri Toplama Hukuki Dayanağı',
  'consent-requirement': 'Açık Rıza Gerekliliği',
  'data-minimization': 'Veri Minimizasyonu',
  'storage-security': 'Depolama Güvenliği',
  'disclosure-requirement': 'Aydınlatma Gerekliliği',
  'information-clarity': 'Bilgi Netliği',
  'data-retention': 'Veri Saklama Süresi',
  'data-transfer': 'Veri Aktarımı',
  'individual-rights': 'İlgili Kişi Hakları',
  'data-processing-purpose': 'Veri İşleme Amacı',
  'transparency': 'Şeffaflık',
};

export default function AnalysisResultsPage({
  params,
}: {
  params: { analysisId: string };
}) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchAnalysis();
  }, [params.analysisId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/analyses/${params.analysisId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setToast({ message: 'Analiz başarıyla silindi', type: 'success' });
        setTimeout(() => {
          router.push('/analysis');
        }, 1500);
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Silme işlemi başarısız', type: 'error' });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setToast({ message: 'Silme işlemi sırasında bir hata oluştu', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${params.analysisId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Analiz bulunamadı</p>
          <Link href="/analysis">
            <Button variant="primary">Geri Dön</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { results } = analysis;
  const statusColors = {
    compliant: 'green',
    'non-compliant': 'red',
    'needs-review': 'yellow',
  };
  const statusLabels = {
    compliant: 'Uyumlu',
    'non-compliant': 'Uyumsuz',
    'needs-review': 'İnceleme Gerekli',
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1A237E] mb-2">Analiz Sonuçları</h1>
            <p className="text-gray-600">KVKK Uyumluluk Analizi</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {deleting ? 'Siliniyor...' : '🗑️ Sil'}
            </Button>
            <Link href="/analysis">
              <Button variant="outline">← Geri Dön</Button>
            </Link>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="p-8 bg-gradient-to-r from-[#1A237E] to-[#283593] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Genel Durum</h2>
              <p className="text-xl opacity-90">
                {statusLabels[results.overallStatus as keyof typeof statusLabels]}
              </p>
            </div>
            <div className="text-6xl">
              {results.overallStatus === 'compliant' ? '✓' : 
               results.overallStatus === 'non-compliant' ? '✗' : '⚠'}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Risk Skoru</span>
              <span>{results.riskScore}/100</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width: `${results.riskScore}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Findings */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-[#1A237E] mb-4">Bulgular</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {results.findings.map((finding, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  finding.severity === 'high'
                    ? 'border-red-500 bg-red-50'
                    : finding.severity === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{ruleNameMap[finding.ruleId] || finding.ruleId}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      finding.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : finding.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {finding.severity === 'high' ? 'Yüksek' : 
                     finding.severity === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
                <div 
                  className="text-gray-700 mb-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: finding.finding.replace(/\n/g, '<br />') }}
                />
                <div 
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: finding.recommendation.replace(/\n/g, '<br />') }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-[#1A237E] mb-4">Öneriler</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {results.recommendations.map((rec, idx) => (
              <div key={idx} className="border-l-4 border-[#1A237E] pl-4 py-2">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
                  dangerouslySetInnerHTML={{ 
                    __html: rec
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/\n/g, '<br />')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/### (.*)/g, '<h3 class="font-bold mt-4 mb-2 text-lg">$1</h3>')
                      .replace(/## (.*)/g, '<h2 class="font-bold mt-4 mb-2 text-xl">$1</h2>')
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {showDeleteConfirm && (
        <ConfirmModal
          title="Analizi Sil"
          message="Bu analizi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
        />
      )}
    </div>
  );
}

