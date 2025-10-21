// Client-side PDF generation using jsPDF with Turkish character support
// Ensure this runs only in the browser

// Color scheme
const COLORS = {
  primary: '#2563eb',      // Blue
  secondary: '#64748b',    // Slate
  success: '#059669',      // Green
  warning: '#d97706',      // Orange
  danger: '#dc2626',      // Red
  light: '#f8fafc',       // Light gray
  dark: '#1e293b',        // Dark slate
  accent: '#7c3aed',      // Purple
};

// Helper function to convert Turkish characters to ASCII equivalents for PDF
function convertTurkishChars(text: string): string {
  const turkishMap: { [key: string]: string } = {
    'ş': 's', 'Ş': 'S',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U',
    'ç': 'c', 'Ç': 'C'
  };
  
  return text.replace(/[şŞğĞıİöÖüÜçÇ]/g, (char) => turkishMap[char] || char);
}

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
};

// Helper function to get severity color
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return COLORS.danger;
    case 'high': return COLORS.warning;
    case 'medium': return COLORS.secondary;
    case 'low': return COLORS.success;
    default: return COLORS.secondary;
  }
};

// Helper function to get impact color
const getImpactColor = (impact: string): string => {
  switch (impact) {
    case 'high': return COLORS.danger;
    case 'medium': return COLORS.warning;
    case 'low': return COLORS.success;
    default: return COLORS.secondary;
  }
};

export interface FeedbackData {
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
  };
  metadata?: {
    candidateName?: string;
  };
}

export async function generatePdfReport(feedback: FeedbackData) {
  if (typeof window === 'undefined') return;
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ 
    unit: 'pt', 
    format: 'a4',
    compress: true,
    orientation: 'portrait'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // Helper functions with proper page break management
  const checkPageBreak = (neededSpace: number = 20): boolean => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addHeading = (text: string, size = 20, color: string = COLORS.primary) => {
    checkPageBreak(size + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(convertTurkishChars(text), margin, y);
    y += size + 10;
  };

  const addSubHeading = (text: string, size = 16) => {
    checkPageBreak(size + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(COLORS.dark);
    doc.text(convertTurkishChars(text), margin, y);
    y += size + 6;
  };

  const addParagraph = (text: string, size = 11, color: string = COLORS.dark) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(convertTurkishChars(text), pageWidth - margin * 2);
    
    lines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 6;
  };

  const addBulletPoint = (text: string, size = 11) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(COLORS.dark);
    const bullet = `• ${convertTurkishChars(text)}`;
    const lines = doc.splitTextToSize(bullet, pageWidth - margin * 2);
    
    lines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 4;
  };

  const addScoreBox = (label: string, score: number, x: number, y: number, width: number, height: number) => {
    // Background
    doc.setFillColor(COLORS.light);
    doc.roundedRect(x, y, width, height, 5, 5, 'F');
    
    // Border
    doc.setDrawColor(getScoreColor(score));
    doc.setLineWidth(2);
    doc.roundedRect(x, y, width, height, 5, 5, 'S');
    
    // Score circle
    const circleRadius = 18;
    const circleX = x + width - circleRadius - 8;
    const circleY = y + height / 2;
    
    doc.setFillColor(getScoreColor(score));
    doc.circle(circleX, circleY, circleRadius, 'F');
    
    // Score text
    doc.setFontSize(14);
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.text(score.toString(), circleX, circleY + 2, { align: 'center' });
    
    // Label
    doc.setFontSize(11);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(convertTurkishChars(label), x + 8, y + height - 8);
  };

  const addSectionDivider = () => {
    y += 8;
    doc.setDrawColor(COLORS.secondary);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
  };

  // Header with gradient background
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Title
  const reportTitle = feedback.metadata?.candidateName 
    ? `AI Resume Review Report - ${feedback.metadata.candidateName}`
    : 'AI Resume Review Report';
  
  doc.setFontSize(24);
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.text(convertTurkishChars(reportTitle), margin, 35);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor('#e0e7ff');
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Analysis & Recommendations', margin, 55);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor('#cbd5e1');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 100, 35);
  
  y = 100;
  doc.setDrawColor(60, 90, 170);
  doc.setLineWidth(2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Scores Overview with Visual Boxes
  addSubHeading('Overall Scores', 18);
  
  const boxWidth = 120;
  const boxHeight = 60;
  const boxSpacing = 20;
  const startX = margin;
  
  // Overall Score (larger)
  addScoreBox('Overall Score', feedback.overallScore, startX, y, boxWidth + 20, boxHeight + 10);
  
  // Other scores in a row
  const scores = [
    { label: 'Content', score: feedback.contentScore },
    { label: 'Formatting', score: feedback.formattingScore },
    { label: 'Keywords', score: feedback.keywordScore }
  ];
  
  y += boxHeight + 20;
  
  scores.forEach((scoreData, index) => {
    const x = startX + index * (boxWidth + boxSpacing);
    addScoreBox(scoreData.label, scoreData.score, x, y, boxWidth, boxHeight);
  });
  
  y += boxHeight + 30;

  // Suggestions with enhanced styling
  addSubHeading('Suggestions', 16);
  feedback.suggestions?.forEach((suggestion, index) => {
    // Check if we need a page break before starting a new suggestion
    checkPageBreak(100); // Reserve space for the entire suggestion
    
    // Suggestion header with impact indicator
    doc.setFontSize(12);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'bold');
    
    // Calculate available width for text (accounting for badge)
    const badgeWidth = 50;
    const availableWidth = pageWidth - 2 * margin - badgeWidth - 10;
    
    // Split text to fit available width
    const textLines = doc.splitTextToSize(`${index + 1}. ${convertTurkishChars(suggestion.text)}`, availableWidth);
    
    // Draw text lines
    textLines.forEach((line: string, lineIndex: number) => {
      checkPageBreak(16);
      doc.text(line, margin, y + (lineIndex * 14));
    });
    
    // Impact badge - position it after the text
    const impactColor = getImpactColor(suggestion.impact);
    doc.setFillColor(impactColor);
    doc.roundedRect(pageWidth - margin - badgeWidth, y - 8, badgeWidth, 16, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.text(suggestion.impact.toUpperCase(), pageWidth - margin - badgeWidth/2, y + 2, { align: 'center' });
    
    y += textLines.length * 14 + 8;
    
    // Current text
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.secondary);
    doc.setFont('helvetica', 'normal');
    doc.text('Current Text:', margin, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'italic');
    const evidenceLines = doc.splitTextToSize(`"${convertTurkishChars(suggestion.evidence)}"`, pageWidth - 2 * margin);
    evidenceLines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin + 10, y);
      y += 12;
    });
    y += 8;
    
    // Suggested implementation
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.success);
    doc.setFont('helvetica', 'normal');
    doc.text('Suggested Implementation:', margin, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'normal');
    const exampleLines = doc.splitTextToSize(convertTurkishChars(suggestion.example), pageWidth - 2 * margin);
    exampleLines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin + 10, y);
      y += 12;
    });
    y += 15;
  });
  
  addSectionDivider();

  // Strengths with enhanced styling
  addSubHeading('Strengths', 16);
  feedback.strengths?.forEach((strength, index) => {
    // Check if we need a page break before starting a new strength
    checkPageBreak(80); // Reserve space for the entire strength
    
    // Strength header with category indicator
    doc.setFontSize(12);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'bold');
    
    // Calculate available width for text (accounting for badge)
    const badgeWidth = 70;
    const availableWidth = pageWidth - 2 * margin - badgeWidth - 10;
    
    // Split text to fit available width
    const textLines = doc.splitTextToSize(`${index + 1}. ${convertTurkishChars(strength.text)}`, availableWidth);
    
    // Draw text lines
    textLines.forEach((line: string, lineIndex: number) => {
      checkPageBreak(16);
      doc.text(line, margin, y + (lineIndex * 14));
    });
    
    // Category badge - position it after the text
    const categoryColors = {
      leadership: COLORS.accent,
      technical: COLORS.primary,
      communication: COLORS.success,
      achievement: COLORS.warning
    };
    const categoryColor = categoryColors[strength.category] || COLORS.secondary;
    doc.setFillColor(categoryColor);
    doc.roundedRect(pageWidth - margin - badgeWidth, y - 8, badgeWidth, 16, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.text(strength.category.toUpperCase(), pageWidth - margin - badgeWidth/2, y + 2, { align: 'center' });
    
    y += textLines.length * 14 + 8;
    
    // Evidence
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.secondary);
    doc.setFont('helvetica', 'normal');
    doc.text('Evidence from Resume:', margin, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'italic');
    const evidenceLines = doc.splitTextToSize(`"${convertTurkishChars(strength.evidence)}"`, pageWidth - 2 * margin);
    evidenceLines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin + 10, y);
      y += 12;
    });
    y += 15;
  });
  
  addSectionDivider();

  // Improvements with enhanced styling
  addSubHeading('Areas for Improvement', 16);
  feedback.improvements?.forEach((improvement, index) => {
    // Check if we need a page break before starting a new improvement
    checkPageBreak(100); // Reserve space for the entire improvement
    
    // Improvement header with severity indicator
    doc.setFontSize(12);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'bold');
    
    // Calculate available width for text (accounting for badge)
    const badgeWidth = 60;
    const availableWidth = pageWidth - 2 * margin - badgeWidth - 10;
    
    // Split text to fit available width
    const textLines = doc.splitTextToSize(`${index + 1}. ${convertTurkishChars(improvement.text)}`, availableWidth);
    
    // Draw text lines
    textLines.forEach((line: string, lineIndex: number) => {
      checkPageBreak(16);
      doc.text(line, margin, y + (lineIndex * 14));
    });
    
    // Severity badge - position it after the text
    const severityColor = getSeverityColor(improvement.severity);
    doc.setFillColor(severityColor);
    doc.roundedRect(pageWidth - margin - badgeWidth, y - 8, badgeWidth, 16, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.text(improvement.severity.toUpperCase(), pageWidth - margin - badgeWidth/2, y + 2, { align: 'center' });
    
    y += textLines.length * 14 + 8;
    
    // Problematic text
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.danger);
    doc.setFont('helvetica', 'normal');
    doc.text('Problematic Text:', margin, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'italic');
    const evidenceLines = doc.splitTextToSize(`"${convertTurkishChars(improvement.evidence)}"`, pageWidth - 2 * margin);
    evidenceLines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin + 10, y);
      y += 12;
    });
    y += 8;
    
    // Improved version
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setTextColor(COLORS.success);
    doc.setFont('helvetica', 'normal');
    doc.text('Improved Version:', margin, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    doc.setFont('helvetica', 'normal');
    const exampleLines = doc.splitTextToSize(convertTurkishChars(improvement.example), pageWidth - 2 * margin);
    exampleLines.forEach((line: string) => {
      checkPageBreak(16);
      doc.text(line, margin + 10, y);
      y += 12;
    });
    y += 15;
  });
  
  addSectionDivider();

  // Analysis
  if (feedback.analysis?.sections?.length) {
    addSubHeading('Detailed Analysis', 16);
    feedback.analysis.sections.forEach((section) => {
      checkPageBreak(50);
      addParagraph(`${section.name} (Score: ${section.score})`, 12, COLORS.primary);
      addParagraph(section.details);
      
      if (section.issues?.length) {
        checkPageBreak(30);
        addParagraph('Issues Found:', 11, COLORS.danger);
        section.issues.forEach((issue) => {
          addBulletPoint(`${issue.text} (${issue.severity})`);
        });
      }
      
      if (section.fixes?.length) {
        checkPageBreak(30);
        addParagraph('Recommended Fixes:', 11, COLORS.success);
        section.fixes.forEach((fix) => {
          addBulletPoint(`${fix.action}: ${fix.example}`);
        });
      }
    });
  }

  // Footer - ensure it's on the last page
  const footerY = pageHeight - 40;
  
  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(COLORS.light);
    doc.rect(0, footerY, pageWidth, 40, 'F');
    
    // Footer text
    doc.setFontSize(10);
    doc.setTextColor(COLORS.secondary);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by AI Resume Reviewer', margin, footerY + 15);
    doc.text('For professional use only', pageWidth - margin - 80, footerY + 15);
    
    // Page numbers
    doc.setFontSize(8);
    doc.setTextColor(COLORS.secondary);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 10);
  }

  doc.save('resume-feedback-report.pdf');
}