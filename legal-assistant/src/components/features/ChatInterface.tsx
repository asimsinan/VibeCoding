'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ChatInterfaceProps {
  sessionId: string;
}

interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing messages on mount
  useEffect(() => {
    if (sessionId) {
      loadMessages();
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [sessionId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { content: input, role: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsTyping(true);

    try {
      // Send message to API
      const response = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: messageContent
        })
      });

      if (response.ok) {
        const assistantResponse = await response.json();
        const aiMessage: Message = { 
          content: assistantResponse.content || 'Cevap alınamadı', 
          role: 'assistant' 
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const aiMessage: Message = { 
        content: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.', 
        role: 'assistant' 
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-turkish-blue mb-4">Sohbet</h2>
      
      <div className="space-y-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 border border-blue-200 ml-auto max-w-[80%]' : 'bg-gray-50 border border-gray-200 max-w-[85%]'}`}
          >
            <div 
              className="prose prose-sm max-w-none whitespace-pre-wrap break-words overflow-wrap-anywhere"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              dangerouslySetInnerHTML={{ 
                __html: msg.content
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br />')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/### (.*)/g, '<h3 class="font-bold mt-2 mb-1 text-base">$1</h3>')
                  .replace(/## (.*)/g, '<h2 class="font-bold mt-3 mb-2 text-lg">$1</h2>')
                  .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
              }}
            />
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <span className="animate-pulse">●</span>
            <span>Yazıyor...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Mesaj yaz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={sendMessage} disabled={!input.trim()}>Gönder</Button>
      </div>
    </Card>
  );
}

