export type UserRole = 'ADMIN' | 'VENDEDOR' | 'PROJETISTA' | 'CLIENT';

export interface AuthContext {
  userId: string;
  tenantId?: string;
  role: UserRole;
}

