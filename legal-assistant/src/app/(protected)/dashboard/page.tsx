'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const [documentsCount, setDocumentsCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [analysesCount, setAnalysesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch data from API routes with user ID
      const [docsResponse, sessionsResponse] = await Promise.all([
        fetch(`/api/v1/documents?userId=${user.id}`),
        fetch(`/api/v1/chat/sessions?userId=${user.id}`)
      ]);

      const docs = docsResponse.ok ? await docsResponse.json() : { documents: [] };
      const sessions = sessionsResponse.ok ? await sessionsResponse.json() : { sessions: [] };

      setDocumentsCount(docs.documents?.length || 0);
      setSessionsCount(sessions.sessions?.length || 0);
      
      // Fetch analysis count from API
      try {
        const analysisResponse = await fetch(`/api/v1/analyses?userId=${user.id}`);
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setAnalysesCount(analysisData.analyses?.length || 0);
        }
      } catch (error) {
        setAnalysesCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set defaults on error
      setDocumentsCount(0);
      setSessionsCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1A237E] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#1A237E] via-[#283593] to-indigo-600 bg-clip-text text-transparent mb-3">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg font-light">Hoş geldiniz! İşlemlerinize başlayın</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="group relative p-8 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-[#1A237E]">Dökümanlar</h2>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : documentsCount}</p>
              </div>
              <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">📄</div>
            </div>
            <Link href="/documents">
              <Button variant="outline" fullWidth className="mt-6 bg-white/50 border-2 border-[#1A237E] hover:bg-[#1A237E] hover:text-white transition-all duration-300">
                Tümünü Gör →
              </Button>
            </Link>
          </Card>

          <Card className="group relative p-8 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-[#1A237E]">Sohbet Oturumları</h2>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : sessionsCount}</p>
              </div>
              <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">💬</div>
            </div>
            <Link href="/chat">
              <Button variant="outline" fullWidth className="mt-6 bg-white/50 border-2 border-[#1A237E] hover:bg-[#1A237E] hover:text-white transition-all duration-300">
                Sohbet Et →
              </Button>
            </Link>
          </Card>

          <Card className="group relative p-8 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-[#1A237E]">Analizler</h2>
                <p className="text-3xl font-bold text-gray-800">{loading ? '...' : analysesCount}</p>
              </div>
              <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">📊</div>
            </div>
            <Link href="/analysis">
              <Button 
                variant="outline" 
                fullWidth 
                className="mt-6 bg-white/50 border-2 border-[#1A237E] hover:bg-[#1A237E] hover:text-white transition-all duration-300"
              >
                Analiz Yap →
              </Button>
            </Link>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="p-8 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-xl">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#1A237E] to-[#283593] bg-clip-text text-transparent">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link href="/documents/upload">
                <Button fullWidth variant="primary" className="justify-start">
                  📤 Yeni Döküman Yükle
                </Button>
              </Link>
              <Link href="/chat">
                <Button fullWidth variant="outline" className="justify-start">
                  💬 Yeni Sohbet Başlat
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-xl">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#1A237E] to-[#283593] bg-clip-text text-transparent">Son Aktiviteler</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📄 Yeni döküman yüklendi</p>
              <p>💬 Sohbet tamamlandı</p>
              <p>📊 Analiz oluşturuldu</p>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}

