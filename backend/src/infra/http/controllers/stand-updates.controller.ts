import type { Request, Response } from 'express';
import prisma from '../../../config/prisma';
import storage from '../../storage/local-storage.provider';

const STAGES = [
  { key: 'pre_montagem',  label: 'Pré-montagem' },
  { key: 'estrutura',     label: 'Estrutura' },
  { key: 'montagem',      label: 'Montagem' },
  { key: 'acabamento',    label: 'Acabamentos' },
  { key: 'finalizacao',   label: 'Finalização' },
  { key: 'entrega',       label: 'Stand Pronto' },
];

export { STAGES };

export async function listStages(_req: Request, res: Response) {
  return res.json(STAGES);
}

// ── Admin: list all updates for a client ─────────────────────────────────

export async function listStandUpdates(req: Request, res: Response) {
  const tenantId = req.params.clientId as string;
  const { role, userId } = req.auth!;
  const profile = await prisma.clientProfile.findFirst({ where: { tenantId } });
  if (!profile) return res.json([]);

  if (role === 'VENDEDOR' && profile.createdById !== userId) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  const updates = await prisma.standUpdate.findMany({
    where: { clientId: profile.id },
    include: {
      photos: { orderBy: { order: 'asc' } },
      comments: { orderBy: { createdAt: 'asc' } },
      author: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return res.json(updates);
}

// ── Admin: create update ──────────────────────────────────────────────────

export async function createStandUpdate(req: Request, res: Response) {
  const tenantId = req.params.clientId as string;
  const { role, userId } = req.auth!;
  const { stage, title, description } = req.body as {
    stage: string; title: string; description?: string;
  };

  const client = await prisma.clientProfile.findFirst({ where: { tenantId } });
  if (!client) return res.status(404).json({ message: 'Cliente não encontrado.' });

  if (role === 'VENDEDOR' && client.createdById !== userId) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  const update = await prisma.standUpdate.create({
    data: {
      tenantId: client.tenantId,
      clientId: client.id,
      stage,
      title,
      description: description || null,
      createdBy: req.auth!.userId,
    },
    include: { photos: true, comments: true, author: { select: { id: true, name: true, avatar: true } } },
  });
  return res.status(201).json(update);
}

// ── Admin: edit update ────────────────────────────────────────────────────

export async function updateStandUpdate(req: Request, res: Response) {
  const id = req.params.id as string;
  const { stage, title, description, published } = req.body as {
    stage?: string; title?: string; description?: string; published?: boolean;
  };

  console.log('[updateStandUpdate] id:', id, '| body:', req.body);

  const data: Record<string, unknown> = {};
  if (stage       !== undefined) data.stage       = stage;
  if (title       !== undefined) data.title       = title;
  if (description !== undefined) data.description = description;
  if (published   !== undefined) {
    data.published   = published;
    data.publishedAt = published ? new Date() : null;
  }

  console.log('[updateStandUpdate] data a salvar:', data);

  const update = await prisma.standUpdate.update({
    where: { id },
    data,
    include: { photos: true, comments: true, author: { select: { id: true, name: true, avatar: true } } },
  });
  console.log('[updateStandUpdate] resultado published:', update.published);
  return res.json(update);
}

// ── Admin: delete update ──────────────────────────────────────────────────

export async function deleteStandUpdate(req: Request, res: Response) {
  const id = req.params.id as string;
  const update = await prisma.standUpdate.findFirst({
    where: { id },
    include: { photos: true },
  });
  if (!update) return res.status(404).json({ message: 'Atualização não encontrada.' });

  for (const photo of update.photos) {
    await storage.delete(photo.storageKey).catch(() => null);
  }
  await prisma.standUpdate.delete({ where: { id } });
  return res.json({ message: 'Atualização removida.' });
}

// ── Admin: upload photos ──────────────────────────────────────────────────

export async function uploadStandUpdatePhotos(req: Request, res: Response) {
  const id = req.params.id as string;
  const files = (req.files as Express.Multer.File[]) ?? [];

  if (!files.length) return res.status(400).json({ message: 'Nenhuma foto enviada.' });

  const existing = await prisma.standUpdatePhoto.count({ where: { updateId: id } });

  const photos = await Promise.all(
    files.map(async (file, i) => {
      const { fileUrl, storageKey } = await storage.save(file);
      return prisma.standUpdatePhoto.create({
        data: { updateId: id, url: fileUrl, storageKey, order: existing + i },
      });
    }),
  );

  return res.status(201).json(photos);
}

// ── Admin: delete photo ───────────────────────────────────────────────────

export async function deleteStandUpdatePhoto(req: Request, res: Response) {
  const photoId = req.params.photoId as string;
  const photo = await prisma.standUpdatePhoto.findFirst({ where: { id: photoId } });
  if (!photo) return res.status(404).json({ message: 'Foto não encontrada.' });

  await storage.delete(photo.storageKey).catch(() => null);
  await prisma.standUpdatePhoto.delete({ where: { id: photoId } });
  return res.json({ message: 'Foto removida.' });
}

// ── Admin: add comment ────────────────────────────────────────────────────

export async function addStandUpdateComment(req: Request, res: Response) {
  const id = req.params.id as string;
  const { content, isApproval } = req.body as { content: string; isApproval?: boolean };
  const { userId, role } = req.auth!;
  const authorUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  const comment = await prisma.standUpdateComment.create({
    data: {
      updateId: id,
      authorName: authorUser?.name ?? 'Admin',
      authorRole: role.toLowerCase(),
      content,
      isApproval: isApproval ?? false,
    },
  });
  return res.status(201).json(comment);
}

export async function deleteStandUpdateComment(req: Request, res: Response) {
  const commentId = req.params.commentId as string;
  await prisma.standUpdateComment.delete({ where: { id: commentId } });
  return res.json({ message: 'Comentário removido.' });
}

// ── Client: get own stand updates (published only) ────────────────────────

export async function getClientStandUpdates(req: Request, res: Response) {
  const { tenantId } = req.auth!;
  const clientProfile = await prisma.clientProfile.findFirst({
    where: { tenantId: tenantId ?? undefined },
  });

  if (!clientProfile) {
    console.warn('[StandUpdates] clientProfile não encontrado para tenantId:', tenantId);
    return res.json([]);
  }

  const allUpdates = await prisma.standUpdate.findMany({
    where: { clientId: clientProfile.id },
    select: { id: true, published: true, title: true },
  });
  console.log('[StandUpdates] updates do cliente (todos):', allUpdates);

  const updates = await prisma.standUpdate.findMany({
    where: { clientId: clientProfile.id, published: true },
    include: {
      photos: { orderBy: { order: 'asc' } },
      comments: { orderBy: { createdAt: 'asc' } },
      author: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  console.log('[StandUpdates] updates publicados:', updates.length);
  return res.json(updates);
}

// ── Client: add comment ───────────────────────────────────────────────────

export async function addClientStandComment(req: Request, res: Response) {
  const id = req.params.id as string;
  const { content, isApproval } = req.body as { content: string; isApproval?: boolean };
  const { userId, tenantId } = req.auth!;
  const clientUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  const update = await prisma.standUpdate.findFirst({
    where: { id, tenantId: tenantId ?? undefined, published: true },
  });
  if (!update) return res.status(404).json({ message: 'Atualização não encontrada.' });

  const comment = await prisma.standUpdateComment.create({
    data: {
      updateId: id,
      authorName: clientUser?.name ?? 'Cliente',
      authorRole: 'cliente',
      content,
      isApproval: isApproval ?? false,
    },
  });
  return res.status(201).json(comment);
}
