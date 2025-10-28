import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentUpload } from '@/components/features/DocumentUpload';

describe('DocumentUpload Component Integration', () => {
  it('should render file upload interface', () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    expect(screen.getByText(/döküman yükle/i)).toBeInTheDocument();
  });

  it('should render drag and drop zone', () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    expect(screen.getByText(/dosyaları buraya/i)).toBeInTheDocument();
  });

  it('should handle file selection', () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText(/dosya seç/i);
    expect(input).toBeInTheDocument();
  });

  it('should show file validation errors for invalid file types', async () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/geçersiz dosya/i)).toBeInTheDocument();
    });
  });

  it('should accept valid document files', async () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/yüklendi/i)).toBeInTheDocument();
    });
  });

  it('should call onUploadSuccess callback after successful upload', async () => {
    const onUploadSuccess = jest.fn();
    render(<DocumentUpload onUploadSuccess={onUploadSuccess} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalled();
    });
  });

  it('should show loading state during upload', async () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
  });

  it('should display uploaded file name', async () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
    });
  });

  it('should handle multiple file uploads', async () => {
    render(<DocumentUpload onUploadSuccess={() => {}} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file1, file2] } });
    
    await waitFor(() => {
      expect(screen.getByText(/test1.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/test2.pdf/i)).toBeInTheDocument();
    });
  });

  it('should handle file size validation', async () => {
    render(<DocumentUpload onUploadSuccess={() => {}} maxSize={1000000} />);
    const input = screen.getByLabelText(/dosya seç/i);
    const largeFile = new File([new ArrayBuffer(2000000)], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/dosya boyutu/i)).toBeInTheDocument();
    });
  });
});

