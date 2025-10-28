export interface KVKKComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface KVKKFinding {
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  finding: string;
  recommendation: string;
  evidence?: string;
}

export interface KVKKAnalysisResult {
  documentId: string;
  overallStatus: 'compliant' | 'non-compliant' | 'needs-review';
  riskScore: number;
  findings: KVKKFinding[];
  recommendations: string[];
}

export interface KVKKAnalysisOptions {
  documentText: string;
  documentId: string;
}

