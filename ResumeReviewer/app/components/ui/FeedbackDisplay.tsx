'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface FeedbackData {
  overallScore: number;
  contentScore: number;
  formattingScore: number;
  keywordScore: number;
  impact?: number;
  readability?: number;
  atsCompatibility?: number;
  recruiterAppeal?: number;
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
    analysisVersion?: string;
    analysisDepth?: string;
    industryContext?: string;
  };
}

interface FeedbackDisplayProps {
  feedback: FeedbackData;
  isLoading?: boolean;
  className?: string;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  isLoading = false,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [animatedScores, setAnimatedScores] = useState({
    overall: 0,
    content: 0,
    formatting: 0,
    keyword: 0,
  });

  // Animate scores on mount
  useEffect(() => {
    const animateScore = (target: number, key: keyof typeof animatedScores) => {
      let current = 0;
      const increment = target / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedScores(prev => ({ ...prev, [key]: Math.round(current) }));
      }, 50);
    };

    animateScore(feedback.overallScore, 'overall');
    animateScore(feedback.contentScore, 'content');
    animateScore(feedback.formattingScore, 'formatting');
    animateScore(feedback.keywordScore, 'keyword');
  }, [feedback]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    if (score >= 60) return <BarChart3 className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const ScoreCard: React.FC<{ 
    title: string; 
    score: number; 
    animatedScore: number;
    icon: React.ReactNode;
    description: string;
  }> = ({ title, score, animatedScore, icon, description }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 ${getScoreColor(score)}`}>
          {getScoreIcon(score)}
          <span>{animatedScore}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  const FeedbackList: React.FC<{ 
    title: string; 
    items: string[]; 
    icon: React.ReactNode;
    color: string;
  }> = ({ title, items, icon, color }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analysis Complete</h2>
        <p className="text-gray-600">Here's your detailed feedback and recommendations</p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Score</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {animatedScores.overall}
          </div>
          <p className="text-gray-600">
            {feedback.overallScore >= 80 
              ? 'Excellent resume! You\'re well-positioned for your target roles.'
              : feedback.overallScore >= 60 
              ? 'Good foundation with room for improvement.'
              : 'Significant improvements needed to be competitive.'
            }
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard
            title="Content"
            score={feedback.contentScore}
            animatedScore={animatedScores.content}
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            description="Relevance and quality of content"
          />
          <ScoreCard
            title="Formatting"
            score={feedback.formattingScore}
            animatedScore={animatedScores.formatting}
            icon={<Target className="w-5 h-5 text-green-500" />}
            description="Structure and visual presentation"
          />
          <ScoreCard
            title="Keywords"
            score={feedback.keywordScore}
            animatedScore={animatedScores.keyword}
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
            description="Industry-relevant terminology"
          />
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Strengths */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('strengths')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Strengths</h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {feedback.strengths.length}
              </span>
            </div>
            {expandedSections.has('strengths') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('strengths') && (
            <div className="px-6 pb-4">
              <div className="space-y-3">
                {feedback.strengths.map((strength, index) => (
                  <div key={strength.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm font-medium">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm leading-relaxed font-medium mb-2">{strength.text}</p>
                        <div className="bg-green-100 rounded p-3 mb-2">
                          <p className="text-gray-700 text-xs font-medium mb-1">Evidence from Resume:</p>
                          <p className="text-gray-600 text-xs italic">"{strength.evidence}"</p>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            strength.category === 'leadership' ? 'bg-blue-100 text-blue-800' :
                            strength.category === 'technical' ? 'bg-purple-100 text-purple-800' :
                            strength.category === 'communication' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {strength.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('suggestions')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Suggestions</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                {feedback.suggestions.length}
              </span>
            </div>
            {expandedSections.has('suggestions') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('suggestions') && (
            <div className="px-6 pb-4">
              <div className="space-y-3">
                {feedback.suggestions.map((suggestion, index) => (
                  <div key={suggestion.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-sm font-medium">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm leading-relaxed font-medium mb-2">{suggestion.text}</p>
                        <div className="bg-yellow-100 rounded p-3 mb-2">
                          <p className="text-gray-700 text-xs font-medium mb-1">Current Text:</p>
                          <p className="text-gray-600 text-xs italic">"{suggestion.evidence}"</p>
                        </div>
                        <div className="bg-green-100 rounded p-3">
                          <p className="text-gray-700 text-xs font-medium mb-1">Suggested Implementation:</p>
                          <p className="text-gray-600 text-xs">{suggestion.example}</p>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {suggestion.impact} impact
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Improvements */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('improvements')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Areas for Improvement</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                {feedback.improvements.length}
              </span>
            </div>
            {expandedSections.has('improvements') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.has('improvements') && (
            <div className="px-6 pb-4">
              <div className="space-y-3">
                {feedback.improvements.map((improvement, index) => (
                  <div key={improvement.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-sm font-medium">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm leading-relaxed font-medium mb-2">{improvement.text}</p>
                        <div className="bg-orange-100 rounded p-3 mb-2">
                          <p className="text-gray-700 text-xs font-medium mb-1">Problematic Text:</p>
                          <p className="text-gray-600 text-xs italic">"{improvement.evidence}"</p>
                        </div>
                        <div className="bg-green-100 rounded p-3">
                          <p className="text-gray-700 text-xs font-medium mb-1">Improved Version:</p>
                          <p className="text-gray-600 text-xs">{improvement.example}</p>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            improvement.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            improvement.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            improvement.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {improvement.severity} severity
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analysis with Exact Quotes */}
      {feedback.analysis?.sections && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis with Exact Quotes</h3>
          <div className="space-y-6">
            {feedback.analysis.sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{section.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(section.score)}`}>
                    {section.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{section.details}</p>
                
                {/* Issues with Exact Quotes */}
                {section.issues && section.issues.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-red-700 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Issues Found:
                    </h5>
                    <div className="space-y-3">
                      {section.issues.map((issue) => (
                        <div key={issue.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-800">{issue.text}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              issue.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              issue.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              issue.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <div className="bg-white border border-red-300 rounded p-2">
                            <p className="text-xs text-gray-600 mb-1">Exact quote from resume:</p>
                            <p className="text-sm font-mono text-red-700 italic">"{issue.evidence}"</p>
                            {issue.impact && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">Impact on ATS/Recruiter:</p>
                                <p className="text-sm text-red-600">{issue.impact}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fixes with Examples */}
                {section.fixes && section.fixes.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Suggested Improvements:
                    </h5>
                    <div className="space-y-3">
                      {section.fixes.map((fix) => (
                        <div key={fix.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800 mb-2">{fix.action}</p>
                          <div className="bg-white border border-green-300 rounded p-2">
                            <p className="text-xs text-gray-600 mb-1">Improved version:</p>
                            <p className="text-sm font-mono text-green-700 italic">"{fix.example}"</p>
                            {fix.reasoning && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">Why this improves the resume:</p>
                                <p className="text-sm text-green-600">{fix.reasoning}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATS Analysis */}
      {feedback.analysis?.ats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            ATS Compatibility Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Compatibility Score</h4>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {feedback.analysis.ats.compatibilityScore}/100
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${feedback.analysis.ats.compatibilityScore}%` }}
                ></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Keyword Matches</h4>
              <div className="flex flex-wrap gap-2">
                {feedback.analysis.ats.keywordMatches.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {feedback.analysis.ats.missingKeywords.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-orange-700 mb-2">Missing Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {feedback.analysis.ats.missingKeywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {feedback.analysis.ats.parsingIssues.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-700 mb-2">Parsing Issues</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.analysis.ats.parsingIssues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.analysis.ats.optimizationTips.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-blue-700 mb-2">ATS Optimization Tips</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.analysis.ats.optimizationTips.map((tip, index) => (
                  <li key={index} className="text-sm text-blue-600">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recruiter View */}
      {feedback.analysis?.recruiterView && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Recruiter Perspective
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">6-Second Scan</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {feedback.analysis.recruiterView.sixSecondScan}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">First Impression</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                feedback.analysis.recruiterView.firstImpression === 'excellent' ? 'bg-green-100 text-green-800' :
                feedback.analysis.recruiterView.firstImpression === 'good' ? 'bg-blue-100 text-blue-800' :
                feedback.analysis.recruiterView.firstImpression === 'average' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {feedback.analysis.recruiterView.firstImpression}
              </span>
            </div>
          </div>

          {feedback.analysis.recruiterView.highlights.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-green-700 mb-2">Key Highlights</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.analysis.recruiterView.highlights.map((highlight, index) => (
                  <li key={index} className="text-sm text-green-600">{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.analysis.recruiterView.redFlags.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-700 mb-2">Red Flags</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.analysis.recruiterView.redFlags.map((flag, index) => (
                  <li key={index} className="text-sm text-red-600">{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.analysis.recruiterView.attentionGrabbers.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-blue-700 mb-2">Attention Grabbers</h4>
              <ul className="list-disc list-inside space-y-1">
                {feedback.analysis.recruiterView.attentionGrabbers.map((grabber, index) => (
                  <li key={index} className="text-sm text-blue-600">{grabber}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Priority Fixes */}
      {feedback.analysis?.summary?.priorityFixes && feedback.analysis.summary.priorityFixes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            Priority Fixes
          </h3>
          <div className="space-y-4">
            {feedback.analysis.summary.priorityFixes.map((fix) => (
              <div key={fix.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{fix.description}</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      fix.impact === 'high' ? 'bg-red-100 text-red-800' :
                      fix.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {fix.impact} impact
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      fix.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      fix.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {fix.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{fix.example}</p>
                <div className="text-xs text-gray-500">
                  <strong>Time to implement:</strong> {fix.timeToImplement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {feedback.analysis?.summary && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-purple-600" />
            Executive Summary
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Elevator Pitch</h4>
              <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                {feedback.analysis.summary.elevatorPitch}
              </p>
            </div>
            
            {feedback.analysis.summary.industryFit && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Industry Fit</h4>
                <p className="text-sm text-gray-600">{feedback.analysis.summary.industryFit}</p>
              </div>
            )}
            
            {feedback.analysis.summary.seniorityLevel && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Assessed Seniority Level</h4>
                <p className="text-sm text-gray-600">{feedback.analysis.summary.seniorityLevel}</p>
              </div>
            )}
            
            {feedback.analysis.summary.versioningRecommendation && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Resume Format Recommendation</h4>
                <p className="text-sm text-gray-600">{feedback.analysis.summary.versioningRecommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
