import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';
import { hashPassword } from '../../../shared/utils/password';

export const listUsers = async (req: Request, res: Response) => {
  const tenantId = req.auth?.tenantId;
  
  // Todos veem apenas usuários do seu tenant
  const where: any = { isActive: true };
  
  if (tenantId) {
    where.tenantId = tenantId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });

  return res.json(users);
};

export const listTeamMembers = async (req: Request, res: Response) => {
  const { userId } = req.auth!;

  const members = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ['VENDEDOR', 'PROJETISTA', 'ADMIN'] },
      id: { not: userId },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  return res.json(members);
};

export const listAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(admins);
  } catch (error: any) {
    console.error('Erro ao listar admins:', error);
    return res.status(500).json({ message: 'Erro ao carregar administradores' });
  }
};

const createAdminSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role: z.enum(['ADMIN', 'VENDEDOR', 'PROJETISTA']).default('ADMIN'),
});

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = createAdminSchema.parse(req.body);

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Buscar ou criar tenant "Sistema"
    let systemTenant = await prisma.tenant.findFirst({
      where: { name: 'Sistema' },
    });

    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'Sistema',
          slug: 'sistema',
          isActive: true,
        },
      });
    }

    // Criar usuário — usa o tenant do admin que está criando
    const hashedPassword = await hashPassword(password);
    
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        tenantId: req.auth?.tenantId || systemTenant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json(admin);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro ao criar admin:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

const deleteAdminSchema = z.object({
  confirmationCode: z.string().refine((val) => val === '2112', {
    message: 'Código de confirmação inválido',
  }),
});

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { name, avatar } = req.body as { name?: string; avatar?: string };

  const data: { name?: string; avatar?: string | null } = {};
  if (name !== undefined) data.name = name;
  if (avatar !== undefined) data.avatar = avatar || null;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, tenantId: true, avatar: true },
  });

  return res.json(user);
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    const { confirmationCode } = deleteAdminSchema.parse(req.body);

    // Verificar se o admin existe
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({ message: 'Administrador não encontrado' });
    }

    if (admin.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Usuário não é um administrador' });
    }

    // Não permitir excluir a si mesmo
    if (admin.id === req.auth?.userId) {
      return res.status(400).json({ message: 'Você não pode excluir sua própria conta' });
    }

    // Verificar código de confirmação
    if (confirmationCode !== '2112') {
      return res.status(400).json({ message: 'Código de confirmação inválido' });
    }

    // Excluir admin (soft delete - desativar)
    await prisma.user.update({
      where: { id: adminId },
      data: { isActive: false },
    });

    return res.json({ message: 'Administrador excluído com sucesso' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    console.error('Erro ao excluir admin:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

