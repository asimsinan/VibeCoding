export type AgreementType = 
  | 'is-sozlesmesi' // İş Sözleşmesi (Employment)
  | 'hizmet-sozlesmesi' // Hizmet Sözleşmesi (Service)
  | 'danismanlik-sozlesmesi' // Danışmanlık Sözleşmesi (Consulting)
  | 'mesafeli-satis' // Mesafeli Satış Sözleşmesi (Distance Sales)
  | 'aydinlatma-metni'; // Aydınlatma Metni (Disclosure)

export interface AgreementUserDetails {
  companyName?: string;
  employeeName?: string;
  serviceDescription?: string;
  duration?: string;
  price?: string;
  startDate?: string;
  [key: string]: any;
}

export interface AgreementGenerationOptions {
  agreementType: AgreementType;
  userDetails: AgreementUserDetails;
  customRequirements?: string;
}

export interface AgreementResult {
  content: string;
  agreementType: AgreementType;
  metadata: {
    generatedAt: string;
    userDetails: AgreementUserDetails;
  };
}

