export type Role = 'student' | 'admin';

export type ProjectStatus =
  | 'Request Submitted'
  | 'Payment Verified'
  | 'Requirement Analysis'
  | 'Development Started'
  | 'Testing Phase'
  | 'Documentation Ready'
  | 'Project Completed'
  | 'Delivered';

export type PaymentStatus = 'Pending' | 'Verification Pending' | 'Approved' | 'Rejected';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type FileType =
  | 'Source Code'
  | 'Documentation'
  | 'Presentation'
  | 'Report'
  | 'Database'
  | 'Other';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export const PROJECT_CATEGORIES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Web Development',
  'Mobile Applications',
  'Cybersecurity',
  'IoT Projects',
  'Cloud Computing',
  'Blockchain',
  'Final Year Projects',
  'Mini Projects',
  'IEEE Projects',
] as const;

export const PROJECT_STAGES: ProjectStatus[] = [
  'Request Submitted',
  'Payment Verified',
  'Requirement Analysis',
  'Development Started',
  'Testing Phase',
  'Documentation Ready',
  'Project Completed',
  'Delivered',
];

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  department: string;
  college: string;
  year: string;
  resume_url: string;
  avatar_url: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technology: string;
  category: string;
  duration_weeks: number;
  price: number;
  difficulty: Difficulty;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  student_id: string;
  project_id: string | null;
  requirements: string;
  deadline: string | null;
  status: ProjectStatus;
  order_date: string;
  amount: number;
  assigned_developer?: string;
  project?: Project | null;
  student?: Profile | null;
  payments?: Payment[];
  deliverable_files?: DeliverableFile[];
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  screenshot_url: string;
  status: PaymentStatus;
  created_at: string;
  verified_at: string | null;
  refund_status?: string | null;
  refunded_at?: string | null;
  order?: Order | null;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface DeliverableFile {
  id: string;
  order_id: string;
  file_name: string;
  file_url: string;
  file_type: FileType;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  student_id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_reply: string;
  created_at: string;
  student?: Profile | null;
}

export interface QrCode {
  id: string;
  label: string;
  image_url: string;
  upi_id: string;
  is_active: boolean;
  created_at: string;
}
