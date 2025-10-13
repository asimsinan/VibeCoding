'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';

interface CertificateVerification {
  valid: boolean;
  certificate: {
    certificateNumber: string;
    courseTitle: string;
    studentName: string;
    organizationName: string;
    issuedDate: string;
    status: string;
    verificationCode: string;
  };
}

function CertificateVerificationContent() {
  const searchParams = useSearchParams();
  const certificateNumber = searchParams.get('certificateNumber');
  const verificationCode = searchParams.get('verificationCode');
  
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      if (!certificateNumber) {
        setError('Certificate number is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `/api/certificates/verify?certificateNumber=${certificateNumber}${verificationCode ? `&verificationCode=${verificationCode}` : ''}`;
        const result = await apiClient.get<CertificateVerification>(url);
        setVerification(result);
      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to verify certificate');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateNumber, verificationCode]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Verification Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">{error}</p>
              <div className="mt-4 text-center">
                <Link href="/">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!verification?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Invalid Certificate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">This certificate could not be verified.</p>
              <div className="mt-4 text-center">
                <Link href="/">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { certificate } = verification;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
            <p className="text-lg text-gray-600">Verify the authenticity of this certificate</p>
          </div>
          
          <Card className="border-2 border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-green-600">Certificate Verified</CardTitle>
              <Badge className="bg-green-100 text-green-800 mx-auto">
                Valid Certificate
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h2>
                <p className="text-lg text-gray-600">This is to certify that</p>
                <h3 className="text-2xl font-bold text-red-600 my-4">{certificate.studentName}</h3>
                <p className="text-lg text-gray-600">has successfully completed the course</p>
                <h4 className="text-xl font-semibold text-gray-900 mt-2">{certificate.courseTitle}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Certificate Number:</span>
                    <span className="font-mono font-semibold">{certificate.certificateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issued Date:</span>
                    <span className="font-semibold">{formatDate(certificate.issuedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800">{certificate.status}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organization:</span>
                    <span className="font-semibold">{certificate.organizationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification Code:</span>
                    <span className="font-mono text-sm">{certificate.verificationCode}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-6 border-t">
                <p className="text-sm text-gray-500">
                  This certificate was issued digitally and can be verified at any time using the certificate number and verification code.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CertificateVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    }>
      <CertificateVerificationContent />
    </Suspense>
  );
}
