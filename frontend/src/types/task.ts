export type TaskStatus = 'BACKLOG' | 'IN_PRODUCTION' | 'FOR_APPROVAL' | 'SCHEDULED' | 'PUBLISHED';

export type TaskCategory =
  | 'FACEBOOK_ADS'
  | 'INSTAGRAM_ADS'
  | 'GOOGLE_ADS'
  | 'CONTENT'
  | 'LANDING_PAGE'
  | 'EMAIL_MARKETING'
  | 'TRAFFIC'
  | 'SEO'
  | 'SOCIAL_MEDIA'
  | 'COPYWRITING'
  | 'DESIGN'
  | 'VIDEO'
  | 'OTHER'
  | 'BRIEFING'
  | 'PROJETO_3D'
  | 'PRODUCAO'
  | 'MONTAGEM'
  | 'EVENTO'
  | 'DESMONTAGEM'
  | 'ORCAMENTO'
  | 'LOGISTICA'
  | 'APROVACAO_CLIENTE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  mediaId?: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  createdAt: string;
  media?: any;
}

export interface TaskMetrics {
  id: string;
  taskId: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  cpm?: number;
  cpc?: number;
  ctr?: number;
  conversions?: number;
  conversionRate?: number;
  leadGoal?: number;
  salesGoal?: number;
  leadsActual?: number;
  salesActual?: number;
  revenue?: number;
  roas?: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  createdById?: string;
  campaignId?: string;
  dueDate?: string;
  scheduledAt?: string;
  publishedAt?: string;
  position: number;
  tags?: string;
  clientTenantId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  campaign?: {
    id: string;
    name: string;
  };
  comments?: TaskComment[];
  checklists?: TaskChecklistItem[];
  attachments?: TaskAttachment[];
  metrics?: TaskMetrics;
}

