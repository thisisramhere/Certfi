export type Page = 
  | 'home' | 'docs' | 'pricing' | 'contact' | 'features'
  | 'login' | 'register' | 'forgot-password' | 'profile' | 'notifications'
  | 'dashboard' | 'templates' 
  | 'participants' | 'generate' | 'certificates' 
  | 'verification' | 'analytics' | 'organization' | 'users' | 'settings';

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  file_type: string;
  filename: string;
  file_path: string;
  file_size: number;
  width: number;
  height: number;
  is_active: boolean;
  is_default: boolean;
  owner_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  elements: CanvasElement[];
  placeholders: TemplatePlaceholder[];
  category?: string;
  tags?: string[];
  backdropUrl?: string;
  certificateCount?: number;
  lastModified?: string;
  uploadedAt?: string;
}

export interface TemplatePlaceholder {
  id: string;
  type: string;
  custom_key?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font_family: string;
  font_size: number;
  font_weight: string;
  font_color: string;
  font_file_url?: string;
  font_file_path?: string;
  alignment: string;
  rotation: number;
  opacity: number;
  is_required: boolean;
  default_value?: string;
  created_at: string;
  updated_at: string;
  template_id: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  event?: string;
  position?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  phone?: string;
  date?: string;
  status?: string;
}

export interface GeneratedCertificate {
  id: string;
  certificate_id: string;
  qr_token: string;
  tamper_hash: string;
  status: 'pending' | 'generated' | 'sent' | 'failed' | 'active' | 'expired' | 'revoked';
  pdf_path?: string;
  png_path?: string;
  issued_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  template_id: string;
  participant_id: string;
  creator_id: string;
  organization_id: string;
  participantName?: string;
  participantEmail?: string;
  event?: string;
  generatedDate?: string;
  verificationStatus?: string;
  qrCodeData?: string;
  hash?: string;
  templateName?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'certificate' | 'security' | 'system' | 'verification';
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  organization_id?: string;
  last_login?: string;
  name?: string;
  status?: string;
}

export interface OrgConfig {
  name: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  fonts?: string[];
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'qr' | 'image' | 'shape' | 'signature' | 'watermark';
  name: string;
  placeholderVariable: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fontSize?: number;
  fontWeight: string;
  fontFamily: string;
  color: string;
  align: string;
  shapeType?: string;
  isLocked?: boolean;
}

export interface AnalysisResult {
  id: string;
  templateId: string;
  placeholders: TemplatePlaceholder[];
  confidence: number;
  analysis: any;
  status: 'pending' | 'success' | 'error';
}
