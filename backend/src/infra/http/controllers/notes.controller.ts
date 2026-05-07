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
  sharedWithIds: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  color: z.string().optional(),
  tags: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  sharedWithIds: z.array(z.string()).optional(),
});

export const listNotes = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { search } = req.query;

  const where: any = {};

  if (role === 'ADMIN') {
    if (tenantId) where.tenantId = tenantId;
  } else {
    // Vendedor vê apenas as próprias + compartilhadas com ele
    if (tenantId) where.tenantId = tenantId;
    where.OR = [
      { createdById: userId },
      { sharedWithIds: { has: userId } },
    ];
  }

  if (search) {
    // Combina filtro de ownership com busca usando AND
    const searchFilter = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { content: { contains: String(search), mode: 'insensitive' } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchFilter }];
      delete where.OR;
    } else {
      where.OR = searchFilter;
    }
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
  const isSharedWith = note.sharedWithIds?.includes(userId);
  if (role !== 'ADMIN' && note.createdById !== userId && !isSharedWith) {
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
      title: body.title,
      content: body.content,
      color: body.color,
      tags: body.tags,
      isPinned: body.isPinned,
      sharedWithIds: body.sharedWithIds,
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
