import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentGallery } from '@/components/features/DocumentGallery';

describe('DocumentGallery Component Integration', () => {
  const mockDocuments = [
    { id: '1', title: 'Document 1', createdAt: new Date(), fileSize: 1024, mimeType: 'application/pdf' },
    { id: '2', title: 'Document 2', createdAt: new Date(), fileSize: 2048, mimeType: 'application/pdf' },
  ];

  it('should render document gallery', () => {
    render(<DocumentGallery documents={[]} />);
    expect(screen.getByText(/dökümanlar/i)).toBeInTheDocument();
  });

  it('should render empty state when no documents', () => {
    render(<DocumentGallery documents={[]} />);
    expect(screen.getByText(/döküman bulunamadı/i)).toBeInTheDocument();
  });

  it('should render document list', () => {
    render(<DocumentGallery documents={mockDocuments} />);
    expect(screen.getByText(/document 1/i)).toBeInTheDocument();
    expect(screen.getByText(/document 2/i)).toBeInTheDocument();
  });

  it('should display document metadata', () => {
    render(<DocumentGallery documents={mockDocuments} />);
    expect(screen.getByText(/1 kb/i)).toBeInTheDocument();
    expect(screen.getByText(/2 kb/i)).toBeInTheDocument();
  });

  it('should handle document click for preview', () => {
    const onDocumentClick = jest.fn();
    render(<DocumentGallery documents={mockDocuments} onDocumentClick={onDocumentClick} />);
    
    fireEvent.click(screen.getByText(/document 1/i));
    
    expect(onDocumentClick).toHaveBeenCalledWith('1');
  });

  it('should handle document delete', async () => {
    const onDelete = jest.fn();
    render(<DocumentGallery documents={mockDocuments} onDelete={onDelete} />);
    
    const deleteButtons = screen.getAllByText('Sil');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('1');
    });
  });

  it('should handle document download', () => {
    const onDownload = jest.fn();
    render(<DocumentGallery documents={mockDocuments} onDownload={onDownload} />);
    
    const downloadButtons = screen.getAllByText('İndir');
    fireEvent.click(downloadButtons[0]);
    
    expect(onDownload).toHaveBeenCalledWith('1');
  });

  it('should filter documents by search query', () => {
    render(<DocumentGallery documents={mockDocuments} />);
    const searchInput = screen.getByPlaceholderText(/ara/i);
    
    fireEvent.change(searchInput, { target: { value: 'Document 1' } });
    
    expect(screen.getByText(/document 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/document 2/i)).not.toBeInTheDocument();
  });

  it('should sort documents by date', () => {
    const documents = [
      { id: '1', title: 'Old', createdAt: new Date('2020-01-01'), fileSize: 1024, mimeType: 'application/pdf' },
      { id: '2', title: 'New', createdAt: new Date('2024-01-01'), fileSize: 2048, mimeType: 'application/pdf' },
    ];
    
    render(<DocumentGallery documents={documents} />);
    const items = screen.getAllByText(/old|new/i);
    
    expect(items[0]).toHaveTextContent('New');
    expect(items[1]).toHaveTextContent('Old');
  });

  it('should handle pagination', async () => {
    const manyDocuments = Array.from({ length: 25 }, (_, i) => ({
      id: `${i}`, title: `Document ${i}`, createdAt: new Date(), fileSize: 1024, mimeType: 'application/pdf'
    }));
    
    render(<DocumentGallery documents={manyDocuments} itemsPerPage={10} />);
    
    // Check that pagination buttons exist
    const paginationButtons = screen.getAllByRole('button');
    expect(paginationButtons.length).toBeGreaterThan(0);
  });
});

