import type { KVKKComplianceRule, KVKKFinding, KVKKAnalysisResult, KVKKAnalysisOptions } from './types';
import { geminiService } from '@/lib/gemini-service';

export class KVKKAnalyzer {
  private complianceRules: KVKKComplianceRule[] = [
    {
      id: 'data-collection-basis',
      name: 'Veri Toplama Hukuki Dayanağı',
      description: 'Veri toplama işleminin açık bir hukuki dayanağı olmalıdır',
      severity: 'high',
    },
    {
      id: 'consent-requirement',
      name: 'Açık Rıza Gerekliliği',
      description: 'Açık rıza gerektiren veri işleme durumlarında rıza alınmalıdır',
      severity: 'high',
    },
    {
      id: 'data-minimization',
      name: 'Veri Minimizasyonu',
      description: 'Sadece gerekli olan veriler toplanmalıdır',
      severity: 'medium',
    },
    {
      id: 'storage-security',
      name: 'Depolama Güvenliği',
      description: 'Toplanan veriler güvenli bir şekilde saklanmalıdır',
      severity: 'high',
    },
    {
      id: 'disclosure-requirement',
      name: 'Aydınlatma Gerekliliği',
      description: 'Veri sahipleri veri işleme hakkında bilgilendirilmelidir',
      severity: 'high',
    },
  ];

  /**
   * Analyze document for KVKK compliance
   */
  async analyzeDocument(options: KVKKAnalysisOptions): Promise<KVKKAnalysisResult> {
    const findings = await this.evaluateComplianceRules(options);
    
    const riskScore = this.calculateRiskScore(findings);
    const overallStatus = this.determineOverallStatus(riskScore);
    const recommendations = await this.generateRecommendations(findings, options.documentText);

    return {
      documentId: options.documentId,
      overallStatus,
      riskScore,
      findings,
      recommendations,
    };
  }

  /**
   * Evaluate compliance against KVKK rules using AI semantic analysis
   */
  private async evaluateComplianceRules(options: KVKKAnalysisOptions): Promise<KVKKFinding[]> {
    const findings: KVKKFinding[] = [];
    
    // Build rules summary for Gemini
    const rulesSummary = this.complianceRules.map(r => `- ${r.name}: ${r.description} (${r.severity} risk)`).join('\n');
    
    const prompt = `Belgeyi KVKK uyumluluk açısından ANALİZ ET. Her bir kuralı mutlaka kontrol et.

KVKK Kuralları:
${rulesSummary}

Belge İçeriği:
${options.documentText}

GÖREV: Her bir KVKK kuralını tek tek kontrol ederek, belgede bu kurala uygunluk olup olmadığını değerlendir.

Her kural için şunu kontrol et:
1. Bu kural belgede uygulanıyor mu?
2. Eğer HAYIR ise, neden uygulanmadığı ve hangi eksiklik var
3. Eğer EVET ise atla

Format: SADECE JSON array yanıtla (başka açıklama yapma):
[
  {"ruleId": "data-collection-basis", "severity": "high", "finding": "...", "recommendation": "...", "evidence": "..."},
  {"ruleId": "consent-requirement", "severity": "high", "finding": "...", "recommendation": "...", "evidence": "..."}
]

ÖNEMLİ: Tüm 5 kuralı kontrol et. Sadece ihlal olanları listele. Tüm kuralları kontrol ederek sonuç döndür.`;

    try {
      // Try AI analysis with retry
      const response = await geminiService.generateTextWithRetry(prompt, {
        maxTokens: 4096,
        language: 'Türkçe',
        temperature: 0.3,
        maxRetries: 2,
      });
      
      // Try to parse JSON response
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.length > 0) {
          return parsed;
        }
      }
      
      console.log('AI response not parseable or empty, falling back to keyword check');
      return this.keywordBasedCheck(options);
    } catch (error) {
      console.error('AI-based rule checking failed, falling back to keyword check:', error);
      return this.keywordBasedCheck(options);
    }
  }

  /**
   * Fallback keyword-based check
   */
  private keywordBasedCheck(options: KVKKAnalysisOptions): KVKKFinding[] {
    const findings: KVKKFinding[] = [];
    const text = options.documentText.toLowerCase();

    for (const rule of this.complianceRules) {
      const finding = this.checkRule(rule, text, options.documentText);
      if (finding) {
        findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Check specific KVKK rule
   */
  private checkRule(
    rule: KVKKComplianceRule,
    normalizedText: string,
    originalText: string
  ): KVKKFinding | null {
    // Simplified rule checking - in production, use Gemini for actual analysis
    let finding: KVKKFinding | null = null;

    switch (rule.id) {
      case 'data-collection-basis':
        if (!normalizedText.includes('hukuki dayanak')) {
          finding = {
            ruleId: rule.id,
            severity: rule.severity,
            finding: 'Belgede veri toplama için hukuki dayanak açıkça belirtilmemiş',
            recommendation: 'Veri toplama hukuki dayanağını (sözleşme, yasal yükümlülük, meşru menfaat, vb.) açıkça belirtiniz',
            evidence: this.findEvidence(originalText, 'veri', 'toplama'),
          };
        }
        break;

      case 'consent-requirement':
        if (!normalizedText.includes('açık rıza') && !normalizedText.includes('onay')) {
          finding = {
            ruleId: rule.id,
            severity: rule.severity,
            finding: 'Belgede açık rıza mekanizması net değil',
            recommendation: 'Açık rıza alınması gereken durumlar için kullanıcıya onay mekanizması sağlayınız',
          };
        }
        break;

      case 'data-minimization':
        if (normalizedText.includes('gerekli olmayan veri') || normalizedText.includes('aşırı veri')) {
          finding = {
            ruleId: rule.id,
            severity: rule.severity,
            finding: 'Veri minimizasyonu prensibi ihlal edilmiş olabilir',
            recommendation: 'Sadece amaç için gerekli olan verileri toplayınız ve işleyiniz',
          };
        }
        break;

      case 'storage-security':
        if (!normalizedText.includes('güvenli') && !normalizedText.includes('şifreleme')) {
          finding = {
            ruleId: rule.id,
            severity: rule.severity,
            finding: 'Veri güvenliği önlemleri yetersiz görünüyor',
            recommendation: 'Veri saklama için teknik ve idari güvenlik önlemleri alınız (şifreleme, erişim kontrolü, vb.)',
          };
        }
        break;

      case 'disclosure-requirement':
        if (!normalizedText.includes('aydınlatma') && !normalizedText.includes('bilgilendirme')) {
          finding = {
            ruleId: rule.id,
            severity: rule.severity,
            finding: 'Aydınlatma metni eksik olabilir',
            recommendation: 'Veri sahiplerini veri işleme hakkında aydınlatma metni ile bilgilendiriniz',
          };
        }
        break;
    }

    return finding;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(findings: KVKKFinding[]): number {
    let score = 0;
    
    for (const finding of findings) {
      switch (finding.severity) {
        case 'high':
          score += 30;
          break;
        case 'medium':
          score += 15;
          break;
        case 'low':
          score += 5;
          break;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallStatus(riskScore: number): 'compliant' | 'non-compliant' | 'needs-review' {
    if (riskScore === 0) {
      return 'compliant';
    } else if (riskScore >= 60) {
      return 'non-compliant';
    } else {
      return 'needs-review';
    }
  }

  /**
   * Generate recommendations using Gemini
   */
  private async generateRecommendations(
    findings: KVKKFinding[],
    documentText: string
  ): Promise<string[]> {
    if (findings.length === 0) {
      return ['Belgeniz KVKK uyumludur'];
    }

    try {
      const findingsSummary = findings.map(f => `${f.finding}: ${f.recommendation}`).join('\n');
      const prompt = `KVKK uyum kontrolü sonuçları:\n${findingsSummary}\n\nBelge özeti:\n${documentText.substring(0, 500)}...\n\nYukarıdaki bulgulara dayanarak ek öneriler sun. Önemli: Her cümleyi TAMAMLA ve sonlandır. Asla "..." veya eksik bırakma. Tek paragraf halinde, tamamlanmış cümlelerle yaz.`;
      
      const response = await geminiService.generateText(prompt, {
        maxTokens: 4096,
        language: 'Türkçe',
      });
      
      // Split by multiple newlines to get paragraphs, but keep single newlines within
      return response.text.split(/\n\n+/).filter(line => line.trim().length > 0).map(p => p.trim());
    } catch (error) {
      // Fallback to static recommendations
      return findings.map(f => f.recommendation);
    }
  }

  /**
   * Find evidence in text
   */
  private findEvidence(text: string, ...keywords: string[]): string {
    const sentences = text.split(/[.!?]/);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (keywords.some(keyword => {
        const keywordStr = typeof keyword === 'string' ? keyword : String(keyword);
        return lowerSentence.includes(keywordStr.toLowerCase());
      })) {
        return sentence.trim();
      }
    }

    return '';
  }
}

export const kvkkAnalyzer = new KVKKAnalyzer();

