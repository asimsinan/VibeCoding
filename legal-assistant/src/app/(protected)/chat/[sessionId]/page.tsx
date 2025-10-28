'use client';

import { ChatInterface } from '@/components/features/ChatInterface';

export default function ChatSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <ChatInterface sessionId={params.sessionId} />
      </div>
    </div>
  );
}

