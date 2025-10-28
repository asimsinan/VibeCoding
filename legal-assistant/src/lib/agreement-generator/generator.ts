import { geminiService } from '@/lib/gemini-service';
import type { 
  AgreementType, 
  AgreementUserDetails, 
  AgreementGenerationOptions, 
  AgreementResult 
} from './types';

export class AgreementGenerator {
  /**
   * Generate Turkish legal agreement
   */
  async generateAgreement(options: AgreementGenerationOptions): Promise<AgreementResult> {
    const template = this.getTemplate(options.agreementType);
    const prompt = this.buildPrompt(template, options);

    const response = await geminiService.generateText(prompt, {
      temperature: 0.5,
      maxTokens: 4096,
    });

    return {
      content: response.text,
      agreementType: options.agreementType,
      metadata: {
        generatedAt: new Date().toISOString(),
        userDetails: options.userDetails,
      },
    };
  }

  /**
   * Get template for agreement type
   */
  private getTemplate(type: AgreementType): string {
    const templates: Record<AgreementType, string> = {
      'is-sozlesmesi': `
İş Sözleşmesi
Taraflar: İşveren ve İşçi
Süre: {{duration}}
Görev: {{description}}

Bu sözleşme, işveren ile işçi arasında yapılan iş ilişkisini düzenler.
      `,
      'hizmet-sozlesmesi': `
Hizmet Sözleşmesi
Taraflar: Hizmet Alıcı ve Hizmet Sağlayıcı
Hizmet: {{serviceDescription}}
Ücret: {{price}}

Bu sözleşme, hizmet alım-satım işlemini düzenler.
      `,
      'danismanlik-sozlesmesi': `
Danışmanlık Sözleşmesi
Taraflar: Danışan ve Danışman
Hizmet: {{serviceDescription}}
Süre: {{duration}}

Bu sözleşme, danışmanlık hizmetinin koşullarını belirler.
      `,
      'mesafeli-satis': `
Mesafeli Satış Sözleşmesi
Satıcı: {{companyName}}
Ürün: {{description}}
Fiyat: {{price}}

Bu sözleşme, uzaktan satış işlemini Tüketicinin Korunması Hakkındaki Kanun kapsamında düzenler.
      `,
      'aydinlatma-metni': `
Aydınlatma Metni (KVKK)
Veri Sorumlusu: {{companyName}}

Bu metin, 6698 sayılı KVKK Kanunu kapsamında veri işleme faaliyetleri hakkında bilgilendirme içermektedir.
      `,
    };

    return templates[type];
  }

  /**
   * Build generation prompt
   */
  private buildPrompt(template: string, options: AgreementGenerationOptions): string {
    const userDetailsStr = JSON.stringify(options.userDetails, null, 2);
    
    let prompt = `Aşağıdaki bilgilere göre Türkçe bir ${this.getAgreementTypeName(options.agreementType)} oluştur:\n\n`;
    prompt += `Şablon:\n${template}\n\n`;
    prompt += `Kullanıcı Bilgileri:\n${userDetailsStr}\n\n`;
    
    if (options.customRequirements) {
      prompt += `Ek İstekler:\n${options.customRequirements}\n\n`;
    }
    
    prompt += `Türk hukukuna uygun, detaylı ve profesyonel bir sözleşme oluştur.`;

    return prompt;
  }

  /**
   * Get Turkish name for agreement type
   */
  private getAgreementTypeName(type: AgreementType): string {
    const names: Record<AgreementType, string> = {
      'is-sozlesmesi': 'İş Sözleşmesi',
      'hizmet-sozlesmesi': 'Hizmet Sözleşmesi',
      'danismanlik-sozlesmesi': 'Danışmanlık Sözleşmesi',
      'mesafeli-satis': 'Mesafeli Satış Sözleşmesi',
      'aydinlatma-metni': 'Aydınlatma Metni',
    };

    return names[type];
  }
}

export const agreementGenerator = new AgreementGenerator();

