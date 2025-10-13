import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';

export interface Certificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentEmail: string;
  organizationName: string;
  issuedDate: string;
  downloadUrl?: string;
  verificationUrl?: string;
  status: string;
  type: string;
  grade: string;
  score: number;
  maxScore: number;
  completionPercentage: number;
}

export interface CertificateProps {
  certificate: Certificate;
  onDownload?: (certificate: Certificate) => void;
  onVerify?: (certificate: Certificate) => void;
  onShare?: (certificate: Certificate) => void;
}

export const CertificateCard: React.FC<CertificateProps> = ({
  certificate,
  onDownload,
  onVerify,
  onShare,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-2">{certificate.courseTitle}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{certificate.organizationName}</p>
          </div>
          <Badge className="bg-green-100 text-green-800">
            {certificate.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Certificate of Completion</h3>
            <p className="text-sm text-gray-600">Awarded to {certificate.studentName}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Issued Date:</span>
              <span className="text-gray-900">{formatDate(certificate.issuedDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Final Score:</span>
              <span className="text-gray-900">{certificate.score}/{certificate.maxScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Grade:</span>
              <span className="font-semibold text-green-600">{certificate.grade}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Certificate #:</span>
              <span className="text-gray-900 font-mono text-xs">{certificate.certificateNumber}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="flex space-x-2 w-full">
          {onDownload && (
            <Button
              onClick={() => onDownload(certificate)}
              className="flex-1"
              size="sm"
            >
              Download
            </Button>
          )}
          {onVerify && (
            <Button
              onClick={() => onVerify(certificate)}
              variant="outline"
              size="sm"
            >
              Verify
            </Button>
          )}
        </div>
        {onShare && (
          <Button
            onClick={() => onShare(certificate)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Share Certificate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export interface CertificatesListProps {
  certificates: Certificate[];
  onDownload?: (certificate: Certificate) => void;
  onVerify?: (certificate: Certificate) => void;
  onShare?: (certificate: Certificate) => void;
  loading?: boolean;
}

export const CertificatesList: React.FC<CertificatesListProps> = ({
  certificates,
  onDownload,
  onVerify,
  onShare,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Complete courses to earn certificates.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((certificate) => (
        <CertificateCard
          key={certificate.id}
          certificate={certificate}
          onDownload={onDownload}
          onVerify={onVerify}
          onShare={onShare}
        />
      ))}
    </div>
  );
};


