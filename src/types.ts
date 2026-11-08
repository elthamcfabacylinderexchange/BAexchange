export interface Brigade {
  id: string;
  name: string;
  district: string;
  region: string;
  frequent?: boolean;
}

export interface CylinderExchangeRecord {
  id: string;
  timestamp: string;
  brigadeName: string;
  brigadeDistrict?: string;
  firefighterName?: string;
  firefighterMemberId?: string;
  vehicleCallSign?: string;
  droppedOffCount: number;
  collectedCount: number;
  cylinderType: string;
  serialNumbers?: string[];
  defectReported?: boolean;
  defectNotes?: string;
  generalNotes?: string;
  recipientEmail: string;
  emailStatus: 'sent' | 'queued' | 'simulated' | 'failed';
  emailDeliveryDetail?: string;
}

export interface AppSettings {
  recipientEmail: string;
  senderEmail?: string;
  depotStationName: string;
  soundEnabled: boolean;
  autoResetSeconds: number;
  requireMemberDetails: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  googleScriptWebhookUrl?: string;
}

export interface ExchangeSubmissionPayload {
  brigadeName: string;
  brigadeDistrict?: string;
  firefighterName?: string;
  firefighterMemberId?: string;
  vehicleCallSign?: string;
  droppedOffCount: number;
  collectedCount: number;
  cylinderType?: string;
  serialNumbers?: string[];
  defectReported?: boolean;
  defectNotes?: string;
  generalNotes?: string;
  recipientEmail?: string;
}
