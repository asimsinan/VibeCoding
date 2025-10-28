'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface KVKKIssue {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

interface KVKKCompliance {
  isCompliant: boolean;
  issues: KVKKIssue[];
}

interface Analysis {
  id: string;
  documentId: string;
  kvkkCompliance: KVKKCompliance;
  recommendations: string[];
}

interface AnalysisReportProps {
  analysis: Analysis;
  onExport?: (id: string) => void;
}

export function AnalysisReport({ analysis, onExport }: AnalysisReportProps) {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  const toggleIssue = (issueIndex: number) => {
    setExpandedIssues(prev => 
      prev.includes(`${analysis.id}-${issueIndex}`)
        ? prev.filter(i => i !== `${analysis.id}-${issueIndex}`)
        : [...prev, `${analysis.id}-${issueIndex}`]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'border-red-500';
      case 'MEDIUM': return 'border-yellow-500';
      case 'LOW': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-turkish-blue">Analiz Raporu</h2>
        {onExport && <Button onClick={() => onExport(analysis.id)}>Dışa Aktar</Button>}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">KVKK Uyumluluğu</h3>
        <p className={`font-bold ${analysis.kvkkCompliance.isCompliant ? 'text-green-600' : 'text-red-600'}`}>
          {analysis.kvkkCompliance.isCompliant ? 'KVKK Uyumlu' : 'KVKK Uyumlu Değil'}
        </p>
        <p className="text-sm text-gray-600 mt-1">{analysis.kvkkCompliance.issues.length} sorun bulundu</p>
      </div>

      {analysis.kvkkCompliance.issues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Sorunlar</h3>
          <div className="space-y-3">
            {analysis.kvkkCompliance.issues.map((issue, index) => (
              <div key={index} className={`p-3 rounded-lg border-2 ${getSeverityColor(issue.severity)} cursor-pointer`}>
                <button onClick={() => toggleIssue(index)} className="w-full text-left">
                  <p className="font-semibold">{issue.message}</p>
                  {expandedIssues.includes(`${analysis.id}-${index}`) && (
                    <p className="text-sm text-gray-600 mt-1">{issue.severity === 'HIGH' ? 'Yüksek Öncelik' : 'Orta Öncelik'}</p>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.recommendations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Öneriler</h3>
          <ul className="list-disc list-inside space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-gray-700">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

