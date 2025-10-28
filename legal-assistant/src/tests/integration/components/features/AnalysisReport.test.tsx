import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisReport } from '@/components/features/AnalysisReport';

describe('AnalysisReport Component Integration', () => {
  const mockAnalysis = {
    id: '1',
    documentId: 'doc-1',
    kvkkCompliance: {
      isCompliant: false,
      issues: [
        { type: 'MISSING_PURPOSE', severity: 'HIGH', message: 'Amaç belirtilmemiş' },
        { type: 'MISSING_CONSENT', severity: 'MEDIUM', message: 'Onay alıcısı eksik' },
      ],
    },
    recommendations: [
      'Amaç belirlemesi ekleyin',
      'Onay alıcısı bilgisi ekleyin',
    ],
  };

  it('should render analysis report', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    expect(screen.getByText(/analiz raporu/i)).toBeInTheDocument();
  });

  it('should display compliance status', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    expect(screen.getByText(/kvkk uyumluluğu/i)).toBeInTheDocument();
    expect(screen.getByText(/uyumlu değil/i)).toBeInTheDocument();
  });

  it('should display compliance issues', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    expect(screen.getByText(/amaç belirtilmemiş/i)).toBeInTheDocument();
    expect(screen.getByText(/onay alıcısı eksik/i)).toBeInTheDocument();
  });

  it('should display recommendations', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    expect(screen.getByText(/öneriler/i)).toBeInTheDocument();
    expect(screen.getByText(/amaç belirlemesi ekleyin/i)).toBeInTheDocument();
  });

  it('should highlight high severity issues', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    const highSeverityIssue = screen.getByText(/amaç belirtilmemiş/i).closest('div');
    expect(highSeverityIssue).toHaveClass('border-red-500');
  });

  it('should show medium severity issues', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    const mediumSeverityIssue = screen.getByText(/onay alıcısı eksik/i).closest('div');
    expect(mediumSeverityIssue).toHaveClass('border-yellow-500');
  });

  it('should handle compliant analysis', () => {
    const compliantAnalysis = {
      ...mockAnalysis,
      kvkkCompliance: { isCompliant: true, issues: [] },
    };
    
    render(<AnalysisReport analysis={compliantAnalysis} />);
    expect(screen.getByText(/^KVKK Uyumlu$/)).toBeInTheDocument();
    expect(screen.queryByText(/uyumlu değil/i)).not.toBeInTheDocument();
  });

  it('should display issue count', () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    expect(screen.getByText(/2 sorun/i)).toBeInTheDocument();
  });

  it('should expand/collapse issue details', async () => {
    render(<AnalysisReport analysis={mockAnalysis} />);
    const expandButton = screen.getByText(/amaç belirtilmemiş/i);
    
    fireEvent.click(expandButton);
    expect(screen.getByText(/yüksek öncelik/i)).toBeInTheDocument();
  });

  it('should generate export button', () => {
    const onExport = jest.fn();
    render(<AnalysisReport analysis={mockAnalysis} onExport={onExport} />);
    
    const exportButton = screen.getByRole('button', { name: /dışa aktar/i });
    fireEvent.click(exportButton);
    
    expect(onExport).toHaveBeenCalledWith('1');
  });

  it('should handle Turkish content', () => {
    const turkishAnalysis = {
      ...mockAnalysis,
      kvkkCompliance: {
        isCompliant: false,
        issues: [{ type: 'MISSING_PURPOSE', severity: 'HIGH', message: 'Amaç belirtilmemiş' }],
      },
    };
    
    render(<AnalysisReport analysis={turkishAnalysis} />);
    expect(screen.getByText(/amaç belirtilmemiş/i)).toBeInTheDocument();
  });
});

