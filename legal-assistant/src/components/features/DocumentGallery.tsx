'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Document {
  id: string;
  title: string;
  createdAt: Date;
  fileSize: number;
  mimeType: string;
}

interface DocumentGalleryProps {
  documents: Document[];
  onDocumentClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  itemsPerPage?: number;
}

export function DocumentGallery({ documents, onDocumentClick, onDelete, onDownload, itemsPerPage = 10 }: DocumentGalleryProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  if (documents.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-turkish-blue mb-4">Dökümanlar</h2>
        <p className="text-gray-600">Döküman bulunamadı</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-turkish-blue">Dökümanlar</h2>
      </div>

      <input
        type="text"
        placeholder="Ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-turkish-blue"
      />

      <div className="space-y-2">
        {paginated.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onDocumentClick?.(doc.id)}>
            <div>
              <p className="font-semibold">{doc.title}</p>
              <p className="text-sm text-gray-600">{Math.round(doc.fileSize / 1024)} KB</p>
            </div>
            <div className="flex gap-2">
              {onDownload && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDownload(doc.id); }}>İndir</Button>}
              {onDelete && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}>Sil</Button>}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? 'primary' : 'outline'}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}

