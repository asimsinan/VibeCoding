'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DocumentUploadProps {
  onUploadSuccess?: (file: File) => void;
  maxSize?: number;
}

export function DocumentUpload({ onUploadSuccess, maxSize = 20 * 1024 * 1024 }: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError('');

    for (const file of selectedFiles) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError(`${file.name}: Geçersiz dosya tipi. Sadece PDF, DOC veya DOCX`);
        continue;
      }

      if (file.size > maxSize) {
        setError(`${file.name}: Dosya boyutu çok büyük. Maksimum: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        continue;
      }

      setSelectedFile(file);
      setUploading(true);
      setFiles(prev => [...prev, file]);

      // Call the onUploadSuccess callback if provided
      if (onUploadSuccess) {
        await onUploadSuccess(file);
      }
      
      setUploading(false);
      setError('');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-[#1A237E] mb-4">Döküman Yükle</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1A237E] transition-colors">
        <p className="text-gray-600 mb-4">Dosyaları buraya sürükleyin</p>
        
        <input
          id="file-upload"
          type="file"
            accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Dosya seç"
        />
        <label 
          htmlFor="file-upload" 
          className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#1A237E] to-[#3949AB] text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Dosya Seç
        </label>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {uploading && <p className="mt-4 text-blue-600">Yükleniyor...</p>}
      {files.length > 0 && (
        <div className="mt-4">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded mb-2">
              <span className="text-sm">{file.name}</span>
              {!uploading && <span className="text-sm text-green-600">Yüklendi</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

