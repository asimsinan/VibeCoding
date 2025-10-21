'use client';

import React, { useState, useCallback } from 'react';
import { 
  FileUpload, 
  FeedbackDisplay, 
  ProcessingSteps, 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Alert,
  Modal,
  ConfirmModal
} from './components/ui';
import { apiClient } from '../src/lib/api-client';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  Download, 
  Share2 
} from 'lucide-react';
import { generatePdfReport } from '../src/lib/report/pdf';

interface FeedbackData {
  overallScore: number;
  contentScore: number;
  formattingScore: number;
  keywordScore: number;
  suggestions: Array<{
    id: string;
    text: string;
    evidence: string;
    example: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  strengths: Array<{
    id: string;
    text: string;
    evidence: string;
    category: 'leadership' | 'technical' | 'communication' | 'achievement';
  }>;
  improvements: Array<{
    id: string;
    text: string;
    evidence: string;
    example: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  analysis?: {
    sections: Array<{
      name: string;
      score: number;
      details: string;
      issues?: Array<{
        id: string;
        severity: string;
        text: string;
        evidence: string;
        impact: string;
      }>;
      fixes?: Array<{
        id: string;
        action: string;
        example: string;
        reasoning: string;
      }>;
    }>;
    ats?: {
      keywordMatches: string[];
      missingKeywords: string[];
      syntaxFlags: string[];
      compatibilityScore: number;
      parsingIssues: string[];
      optimizationTips: string[];
    };
    recruiterView?: {
      sixSecondScan: string;
      redFlags: string[];
      highlights: string[];
      firstImpression: string;
      scanningPattern: string;
      attentionGrabbers: string[];
      concerns: string[];
    };
    summary?: {
      elevatorPitch: string;
      priorityFixes: Array<{
        id: string;
        impact: string;
        difficulty: string;
        description: string;
        example: string;
        timeToImplement: string;
      }>;
      versioningRecommendation: string;
      industryFit: string;
      seniorityLevel: string;
    };
  };
  metadata?: {
    candidateName?: string;
  };
}

export default function ResumeReviewerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const processingSteps = [
    {
      id: 'parse',
      title: 'Parsing Content',
      description: 'Extracting text and analyzing document structure',
      icon: <FileText className="w-5 h-5 text-blue-500" />
    },
    {
      id: 'analyze',
      title: 'AI Analysis',
      description: 'Our AI is analyzing content, formatting, and keywords',
      icon: <Brain className="w-5 h-5 text-blue-500" />
    },
    {
      id: 'generate',
      title: 'Generating Feedback',
      description: 'Creating personalized recommendations and scores',
      icon: <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  ];

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setFeedback(null);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Upload the file and get response with feedback
      const uploadResponse = await apiClient.uploadResume(selectedFile);
      
      console.log('Upload Response:', uploadResponse);
      
      setIsUploading(false);
      setIsProcessing(true);
      setCurrentStep(0);

      // Simulate processing steps
      for (let step = 0; step < processingSteps.length; step++) {
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setIsProcessing(false);
      setFeedback({
        ...uploadResponse.feedback
      });
      
    } catch (err: any) {
      setIsUploading(false);
      setIsProcessing(false);
      setError(err.message || 'Upload failed. Please try again.');
    }
  };

  const handleNewUpload = () => {
    setShowConfirmModal(true);
  };

  const confirmNewUpload = () => {
    setSelectedFile(null);
    setFeedback(null);
    setError(null);
    setIsUploading(false);
    setIsProcessing(false);
    setCurrentStep(0);
    setShowConfirmModal(false);
  };

  const handleDownloadReport = () => {
    if (!feedback) return;
    generatePdfReport({
      overallScore: feedback.overallScore,
      contentScore: feedback.contentScore,
      formattingScore: feedback.formattingScore,
      keywordScore: feedback.keywordScore,
      suggestions: feedback.suggestions,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      analysis: feedback.analysis,
    });
  };

  const handleShareReport = async () => {
    if (!feedback) return;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const text = `I just analyzed my resume with AI Resume Reviewer! Overall Score: ${feedback.overallScore}. Check it out:`;

    try {
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: 'AI Resume Reviewer', text, url: pageUrl });
        return;
      }
    } catch (_) {
      // continue to fallbacks
    }

    // Fallback: open Twitter intent; users can change target network if needed
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`;
    const w = 600, h = 520;
    const y = typeof window !== 'undefined' ? (window.outerHeight - h) / 2 : 0;
    const x = typeof window !== 'undefined' ? (window.outerWidth - w) / 2 : 0;
    window.open(twitterUrl, '_blank', `width=${w},height=${h},left=${x},top=${y},noopener,noreferrer`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-indigo-100/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6">
            AI Resume Reviewer
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Transform your resume with our advanced AI analysis. Get instant, detailed feedback 
            on content, formatting, and keyword optimization to land your dream job.
          </p>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6">
            <Alert
              type="error"
              title="Analysis failed"
              dismissible
              onDismiss={() => setError(null)}
            >
              {error}
            </Alert>
          </div>
        )}

        {/* Main Content */}
        {!feedback && !isProcessing ? (
          <Card className="max-w-3xl mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        
            
            <div className="space-y-6">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                isUploading={isUploading}
                error={error || undefined}
              />

              {selectedFile && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleUpload}
                    isLoading={isUploading}
                    loadingText="Processing..."
                    size="lg"
                    className="px-8"
                  >
                    Analyze Resume
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : isProcessing ? (
          <Card className="max-w-3xl mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <ProcessingSteps
              currentStep={currentStep}
              steps={processingSteps}
            />
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Action Bar */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Analysis Complete</h3>
                    <p className="text-gray-600">
                      Your resume has been analyzed successfully
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleDownloadReport}
                    leftIcon={<Download className="w-4 h-4" />}
                    className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                  >
                    Download Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShareReport}
                    leftIcon={<Share2 className="w-4 h-4" />}
                    className="hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                  >
                    Share
                  </Button>
                  <Button
                    onClick={handleNewUpload}
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Upload Another
                  </Button>
                </div>
              </div>
            </Card>

            {/* Feedback Display */}
            {feedback && (
              <div>
                {feedback.metadata?.candidateName && (
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Analysis Report for {feedback.metadata.candidateName}'s CV
                    </h2>
                    <p className="text-gray-600">Comprehensive AI-powered resume analysis</p>
                  </div>
                )}
                <FeedbackDisplay feedback={feedback} />
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        {!feedback && !isProcessing && (
          <div className="mt-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                Why Choose Our Resume Reviewer?
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Our AI-powered analysis provides comprehensive feedback to help you create 
                a resume that stands out to employers and gets you noticed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm group">
                <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="mb-4 text-xl font-bold text-gray-900">AI-Powered Analysis</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Advanced machine learning algorithms analyze your resume content, 
                  formatting, and keyword optimization with precision.
                </CardDescription>
              </Card>

              <Card className="text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm group">
                <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="mb-4 text-xl font-bold text-gray-900">Instant Feedback</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Get detailed scores and actionable recommendations in seconds, 
                  not days. Fast, accurate, and comprehensive analysis.
                </CardDescription>
              </Card>

              <Card className="text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm group">
                <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="mb-4 text-xl font-bold text-gray-900">Comprehensive Report</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Receive detailed analysis covering content, formatting, 
                  keywords, and industry-specific recommendations.
                </CardDescription>
              </Card>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmNewUpload}
          title="Upload New Resume"
          message="Are you sure you want to upload a new resume? Your current analysis will be lost."
          confirmText="Yes, Upload New"
          cancelText="Cancel"
          type="warning"
        />
      </div>
    </div>
  );
}
