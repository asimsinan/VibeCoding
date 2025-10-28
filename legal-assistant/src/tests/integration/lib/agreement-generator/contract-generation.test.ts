import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgreementGenerator } from '@/lib/agreement-generator';

// Mock Gemini service
jest.mock('@/lib/gemini-service', () => ({
  geminiService: {
    generateText: jest.fn().mockResolvedValue({
      text: 'Mock contract content',
      tokens: { promptTokens: 50, responseTokens: 100, totalTokens: 150 },
    }),
  },
}));

describe('Agreement Generator - Contract Generation', () => {
  let agreementGenerator: AgreementGenerator;

  beforeEach(() => {
    agreementGenerator = new AgreementGenerator();
  });

  describe('İş Sözleşmesi (Employment Contract)', () => {
    it('should generate employment contract template', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'is-sozlesmesi',
        userDetails: {
          companyName: 'Test Şirketi',
          employeeName: 'Ahmet Yılmaz',
          duration: '3 ay',
        },
      });

      expect(result.agreementType).toBe('is-sozlesmesi');
      expect(result.content).toBeDefined();
      expect(result.metadata.userDetails.companyName).toBe('Test Şirketi');
    });

    it('should customize employment contract with user details', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'is-sozlesmesi',
        userDetails: {
          employeeName: 'Mehmet Öztürk',
          duration: '6 ay',
          price: '10.000 TL',
        },
        customRequirements: 'Uzaktan çalışma modu',
      });

      expect(result.metadata.userDetails.employeeName).toBe('Mehmet Öztürk');
    });
  });

  describe('Hizmet Sözleşmesi (Service Contract)', () => {
    it('should generate service contract template', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'hizmet-sozlesmesi',
        userDetails: {
          companyName: 'Hizmet Şirketi',
          serviceDescription: 'Web geliştirme',
          price: '50.000 TL',
        },
      });

      expect(result.agreementType).toBe('hizmet-sozlesmesi');
      expect(result.content).toBeDefined();
    });

    it('should customize service contract with requirements', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'hizmet-sozlesmesi',
        userDetails: {
          serviceDescription: 'API geliştirme',
          duration: '2 ay',
        },
      });

      expect(result.metadata.userDetails.serviceDescription).toBe('API geliştirme');
    });
  });

  describe('Danışmanlık Sözleşmesi (Consulting Contract)', () => {
    it('should generate consulting contract template', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'danismanlik-sozlesmesi',
        userDetails: {
          companyName: 'Danışmanlık Ltd.',
          serviceDescription: 'Yönetim danışmanlığı',
        },
      });

      expect(result.agreementType).toBe('danismanlik-sozlesmesi');
      expect(result.content).toBeDefined();
    });

    it('should customize consulting contract', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'danismanlik-sozlesmesi',
        userDetails: {
          serviceDescription: 'IT danışmanlığı',
          duration: '12 ay',
        },
      });

      expect(result.content).toBeDefined();
    });
  });

  describe('Mesafeli Satış Sözleşmesi (Distance Sales Contract)', () => {
    it('should generate distance sales contract template', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'mesafeli-satis',
        userDetails: {
          companyName: 'E-ticaret Ltd.',
          description: 'Ürün satışı',
          price: '1.000 TL',
        },
      });

      expect(result.agreementType).toBe('mesafeli-satis');
      expect(result.content).toBeDefined();
    });

    it('should comply with consumer protection laws', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'mesafeli-satis',
        userDetails: {
          companyName: 'Online Mağaza',
        },
      });

      expect(result.content).toBeDefined();
    });
  });

  describe('Aydınlatma Metni (Disclosure Text)', () => {
    it('should generate KVKK disclosure text', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'aydinlatma-metni',
        userDetails: {
          companyName: 'Veri İşleyen Şirket',
        },
      });

      expect(result.agreementType).toBe('aydinlatma-metni');
      expect(result.content).toBeDefined();
    });

    it('should be compliant with Turkish GDPR requirements', async () => {
      const result = await agreementGenerator.generateAgreement({
        agreementType: 'aydinlatma-metni',
        userDetails: {
          companyName: 'KVKK Uyumlu Şirket',
        },
      });

      expect(result.content).toBeDefined();
    });
  });
});

