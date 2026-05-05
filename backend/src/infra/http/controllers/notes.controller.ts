import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(''),
  color: z.string().default('#ffffff'),
  tags: z.string().optional(),
  isPinned: z.boolean().default(false),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  tags: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
});

export const listNotes = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { search } = req.query;

  const where: any = {};

  // Admin vê todas as do tenant, outros veem apenas as próprias
  if (role === 'ADMIN') {
    if (tenantId) where.tenantId = tenantId;
  } else {
    where.createdById = userId;
    if (tenantId) where.tenantId = tenantId;
  }

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { content: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.json(notes);
};

export const getNote = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { noteId } = req.params;

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  if (!note) throw new AppError('Anotação não encontrada', 404);
  if (role !== 'ADMIN' && note.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  return res.json(note);
};

export const createNote = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const body = createSchema.parse(req.body);

  const note = await prisma.note.create({
    data: {
      ...body,
      tenantId,
      createdById: userId,
    },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.status(201).json(note);
};

export const updateNote = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { noteId } = req.params;

  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing) throw new AppError('Anotação não encontrada', 404);
  if (role !== 'ADMIN' && existing.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  const body = updateSchema.parse(req.body);

  const note = await prisma.note.update({
    where: { id: noteId },
    data: body,
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.json(note);
};

export const deleteNote = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { noteId } = req.params;

  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing) throw new AppError('Anotação não encontrada', 404);
  if (role !== 'ADMIN' && existing.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  await prisma.note.delete({ where: { id: noteId } });
  return res.json({ message: 'Anotação excluída' });
};

export const togglePin = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { noteId } = req.params;

  const existing = await prisma.note.findUnique({ where: { id: noteId } });
  if (!existing) throw new AppError('Anotação não encontrada', 404);
  if (role !== 'ADMIN' && existing.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: { isPinned: !existing.isPinned },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.json(note);
};
