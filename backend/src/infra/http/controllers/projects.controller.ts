import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';
import storageProvider from '../../storage/local-storage.provider';

const createSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['BRIEFING', 'EM_PRODUCAO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'FINALIZADO']).default('BRIEFING'),
  deadline: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
  designerId: z.string().optional(), // vendedor pode direcionar a um projetista
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  clientName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['BRIEFING', 'EM_PRODUCAO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'FINALIZADO']).optional(),
  deadline: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
  designerId: z.string().optional(), // admin/vendedor pode redirecionar
});

const INCLUDE_FULL = {
  designer: { select: { id: true, name: true, role: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  files: { orderBy: { createdAt: 'desc' as const }, take: 4 },
  _count: { select: { files: true } },
};

export const listProjects = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { status, search } = req.query;

  const where: any = {};

  if (role === 'ADMIN') {
    // Admin vê todos do tenant
    if (tenantId) where.tenantId = tenantId;
  } else if (role === 'VENDEDOR') {
    // Vendedor vê apenas os que criou
    where.createdById = userId;
    if (tenantId) where.tenantId = tenantId;
  } else {
    // Projetista vê apenas os que está como designer
    where.designerId = userId;
    if (tenantId) where.tenantId = tenantId;
  }

  if (status) where.status = String(status);
  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { clientName: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: INCLUDE_FULL,
  });

  return res.json(projects);
};

export const getProject = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      designer: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      files: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!project) throw new AppError('Projeto não encontrado', 404);
  if (role === 'VENDEDOR' && project.createdById !== userId) throw new AppError('Acesso negado', 403);
  if (role === 'PROJETISTA' && project.designerId !== userId) throw new AppError('Acesso negado', 403);

  return res.json(project);
};

export const createProject = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const body = createSchema.parse(req.body);

  // Projetista sempre é o designer de seus próprios projetos
  // Vendedor pode direcionar a um projetista, senão ele mesmo é o designer
  let designerId = body.designerId || userId;

  // Se vendedor informou um projetista, valida que ele é do mesmo tenant
  if (body.designerId && body.designerId !== userId) {
    const designer = await prisma.user.findFirst({
      where: { id: body.designerId, tenantId },
    });
    if (!designer) throw new AppError('Projetista não encontrado', 404);
  }

  const project = await prisma.project.create({
    data: {
      title: body.title,
      clientName: body.clientName,
      description: body.description,
      status: body.status,
      deadline: body.deadline,
      tenantId,
      designerId,
      createdById: userId,
    },
    include: {
      designer: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      files: true,
    },
  });

  return res.status(201).json(project);
};

export const updateProject = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { projectId } = req.params;

  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) throw new AppError('Projeto não encontrado', 404);
  if (role === 'VENDEDOR' && existing.createdById !== userId) throw new AppError('Acesso negado', 403);
  if (role === 'PROJETISTA' && existing.designerId !== userId) throw new AppError('Acesso negado', 403);

  const body = updateSchema.parse(req.body);

  // Valida novo projetista se informado
  if (body.designerId && body.designerId !== existing.designerId) {
    const designer = await prisma.user.findFirst({
      where: { id: body.designerId, tenantId: tenantId ?? undefined },
    });
    if (!designer) throw new AppError('Projetista não encontrado', 404);
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: body,
    include: {
      designer: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      files: { orderBy: { createdAt: 'desc' } },
    },
  });

  return res.json(project);
};

export const deleteProject = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { projectId } = req.params;

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    include: { files: true },
  });
  if (!existing) throw new AppError('Projeto não encontrado', 404);
  if (role === 'VENDEDOR' && existing.createdById !== userId) throw new AppError('Acesso negado', 403);
  if (role === 'PROJETISTA' && existing.designerId !== userId) throw new AppError('Acesso negado', 403);

  for (const file of existing.files) {
    await storageProvider.delete(file.storageKey);
  }

  await prisma.project.delete({ where: { id: projectId } });
  return res.json({ message: 'Projeto excluído' });
};

export const uploadFile = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Projeto não encontrado', 404);
  if (role === 'VENDEDOR' && project.createdById !== userId) throw new AppError('Acesso negado', 403);
  if (role === 'PROJETISTA' && project.designerId !== userId) throw new AppError('Acesso negado', 403);

  const file = req.file;
  if (!file) throw new AppError('Arquivo não enviado', 400);

  const stored = await storageProvider.save(file);

  const projectFile = await prisma.projectFile.create({
    data: {
      projectId: projectId as string,
      fileName: file.originalname,
      fileUrl: stored.fileUrl,
      storageKey: stored.storageKey,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
  });

  return res.status(201).json(projectFile);
};

export const deleteFile = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { fileId } = req.params;

  const file = await prisma.projectFile.findUnique({
    where: { id: fileId },
    include: { project: true },
  });

  if (!file) throw new AppError('Arquivo não encontrado', 404);
  if (role === 'VENDEDOR' && file.project.createdById !== userId) throw new AppError('Acesso negado', 403);
  if (role === 'PROJETISTA' && file.project.designerId !== userId) throw new AppError('Acesso negado', 403);

  await storageProvider.delete(file.storageKey);
  await prisma.projectFile.delete({ where: { id: fileId } });

  return res.json({ message: 'Arquivo excluído' });
};

// Stats para projetista
export const getProjetistaStats = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const [total, briefing, emProducao, aguardando, aprovados, finalizados] = await Promise.all([
    prisma.project.count({ where: { designerId: userId, tenantId } }),
    prisma.project.count({ where: { designerId: userId, tenantId, status: 'BRIEFING' } }),
    prisma.project.count({ where: { designerId: userId, tenantId, status: 'EM_PRODUCAO' } }),
    prisma.project.count({ where: { designerId: userId, tenantId, status: 'AGUARDANDO_APROVACAO' } }),
    prisma.project.count({ where: { designerId: userId, tenantId, status: 'APROVADO' } }),
    prisma.project.count({ where: { designerId: userId, tenantId, status: 'FINALIZADO' } }),
  ]);

  return res.json({ total, briefing, emProducao, aguardando, aprovados, finalizados });
};

// Stats para vendedor
export const getVendedorProjectStats = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const [total, briefing, emProducao, aguardando, aprovados, finalizados] = await Promise.all([
    prisma.project.count({ where: { createdById: userId, tenantId } }),
    prisma.project.count({ where: { createdById: userId, tenantId, status: 'BRIEFING' } }),
    prisma.project.count({ where: { createdById: userId, tenantId, status: 'EM_PRODUCAO' } }),
    prisma.project.count({ where: { createdById: userId, tenantId, status: 'AGUARDANDO_APROVACAO' } }),
    prisma.project.count({ where: { createdById: userId, tenantId, status: 'APROVADO' } }),
    prisma.project.count({ where: { createdById: userId, tenantId, status: 'FINALIZADO' } }),
  ]);

  return res.json({ total, briefing, emProducao, aguardando, aprovados, finalizados });
};
