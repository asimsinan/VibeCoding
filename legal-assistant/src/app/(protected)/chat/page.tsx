'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/features/ChatInterface';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

interface Document {
  id: string;
  title: string;
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
      fetchDocuments();
    }
  }, [user?.id]);

  const fetchDocuments = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/v1/documents?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const fetchSessions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/chat/sessions?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!user?.id) return;
    
    // If documents exist, show document picker
    if (documents.length > 0 && !selectedDocumentId) {
      setShowDocumentPicker(true);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Creating session with documentId:', selectedDocumentId);
      const response = await fetch('/api/v1/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: `Sohbet ${new Date().toLocaleString('tr-TR')}`,
          documentId: selectedDocumentId
        })
      });
      if (response.ok) {
        const session = await response.json();
        console.log('Session created:', session);
        setSessionId(session.id);
        setShowDocumentPicker(false);
        setSelectedDocumentId(null);
        await fetchSessions();
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't auto-load first session - user should click to start a chat

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#1A237E]">Sohbet</h1>
          <Button onClick={createNewSession} loading={loading}>
            Yeni Sohbet
          </Button>
        </div>

        {showDocumentPicker && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-white to-blue-50">
            <h3 className="text-xl font-bold text-[#1A237E] mb-4">Döküman Seç</h3>
            <p className="text-gray-600 mb-4">Bu sohbette hangi dökümana referans yapmak istiyorsunuz?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  setSelectedDocumentId(null);
                  setShowDocumentPicker(false);
                  createNewSession();
                }}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-left hover:border-[#1A237E] transition-all"
              >
                <div className="font-semibold text-[#1A237E]">Döküman olmadan devam et</div>
                <div className="text-sm text-gray-500">Genel soru-cevap için</div>
              </button>
              
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedDocumentId === doc.id
                      ? 'border-[#1A237E] bg-blue-50'
                      : 'border-gray-200 hover:border-[#1A237E]'
                  }`}
                >
                  <div className="font-semibold text-[#1A237E]">{doc.title}</div>
                </button>
              ))}
            </div>
            
            {selectedDocumentId && (
              <div className="flex gap-3">
                <Button onClick={createNewSession} loading={loading}>
                  Seçilen Dökümanla Başlat
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDocumentPicker(false);
                    setSelectedDocumentId(null);
                  }}
                >
                  İptal
                </Button>
              </div>
            )}
          </Card>
        )}

        {sessionId ? (
          <ChatInterface sessionId={sessionId} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Henüz sohbet başlatmadınız</p>
            <Button onClick={createNewSession} loading={loading}>
              Yeni Sohbet Başlat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

