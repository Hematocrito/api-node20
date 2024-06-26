export interface IMailData {
  source: string;
  verificationLink: string;
  siteName: string;
}

export interface IMail {
  template?: string;
  layout?: string;
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  data?: any | IMailData;
}
