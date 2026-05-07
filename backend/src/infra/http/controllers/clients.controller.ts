import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';

export const listClients = async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.auth!;

    const allTenants = await prisma.tenant.findMany({
      include: {
        clients: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let clients = allTenants.filter((tenant) => tenant.clients !== null);

    // Vendedor vê apenas os clientes que ele cadastrou
    if (role === 'VENDEDOR') {
      clients = clients.filter((tenant) => tenant.clients?.createdById === userId);
    }

    return res.json(clients);
  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    return res.status(500).json({
      message: 'Erro ao buscar clientes',
      error: error.message,
    });
  }
};

export const updateClientStatus = async (req: Request, res: Response) => {
  try {
    const params = z.object({ clientId: z.string().uuid() }).parse(req.params);
    const body = z.object({ isActive: z.boolean() }).parse(req.body);

    const client = await prisma.tenant.update({
      where: { id: params.clientId },
      data: { isActive: body.isActive },
      include: {
        clients: true,
      },
    });

    return res.json(client);
  } catch (error: any) {
    console.error('Erro ao atualizar status do cliente:', error);
    throw new AppError('Erro ao atualizar status do cliente', 500);
  }
};

export const updateClientProfileStatus = async (req: Request, res: Response) => {
  try {
    const params = z.object({ clientId: z.string().uuid() }).parse(req.params);
    const body = z.object({
      clientStatus: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
      statusReason: z.string().optional(),
    }).parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.clientId },
      include: { clients: true },
    });

    if (!tenant || !tenant.clients) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const deactivatedAt =
      body.clientStatus !== 'ACTIVE' && tenant.clients.clientStatus === 'ACTIVE'
        ? new Date()
        : body.clientStatus === 'ACTIVE'
        ? null
        : tenant.clients.deactivatedAt;

    const activeSince =
      body.clientStatus === 'ACTIVE' && tenant.clients.clientStatus !== 'ACTIVE'
        ? new Date()
        : tenant.clients.activeSince;

    const updated = await prisma.clientProfile.update({
      where: { tenantId: params.clientId },
      data: {
        clientStatus: body.clientStatus,
        statusReason: body.clientStatus === 'ACTIVE' ? null : (body.statusReason ?? null),
        deactivatedAt,
        activeSince,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar status do perfil do cliente:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Erro ao atualizar status do cliente', 500);
  }
};

export const updateClientProfile = async (req: Request, res: Response) => {
  try {
    const params = z.object({ clientId: z.string().uuid() }).parse(req.params);
    const body = z.object({
      businessName: z.string().min(1).optional(),
      cpfCnpj: z.string().optional(),
      segment: z.string().optional(),
      mainContact: z.string().min(1).optional(),
      mainEmail: z.string().email().optional(),
      mainPhone: z.string().optional(),
      address: z.string().optional(),
      plan: z.enum(['START', 'MASTER', 'PREMIUM', 'CUSTOM']).optional(),
      customPlanDescription: z.string().optional(),
      monthlyValue: z.preprocess((v) => (v !== '' && v !== undefined && v !== null ? Number(v) : undefined), z.number().positive().optional()),
      contractMonths: z.string().optional(),
      dueDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
      goals: z.string().optional(),
      website: z.string().optional(),
    }).parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.clientId },
      include: { clients: true },
    });

    if (!tenant || !tenant.clients) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const updated = await prisma.clientProfile.update({
      where: { tenantId: params.clientId },
      data: {
        ...(body.businessName !== undefined && { businessName: body.businessName }),
        ...(body.cpfCnpj !== undefined && { cpfCnpj: body.cpfCnpj || null }),
        ...(body.segment !== undefined && { segment: body.segment || null }),
        ...(body.mainContact !== undefined && { mainContact: body.mainContact }),
        ...(body.mainEmail !== undefined && { mainEmail: body.mainEmail }),
        ...(body.mainPhone !== undefined && { mainPhone: body.mainPhone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.plan !== undefined && { plan: body.plan }),
        ...(body.customPlanDescription !== undefined && { customPlanDescription: body.customPlanDescription || null }),
        ...(body.monthlyValue !== undefined && { monthlyValue: body.monthlyValue }),
        ...(body.contractMonths !== undefined && { contractMonths: body.contractMonths }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
        ...(body.goals !== undefined && { goals: body.goals || null }),
        ...(body.website !== undefined && { website: body.website || null }),
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar perfil do cliente:', error);
    if (error instanceof AppError) throw error;
    if (error instanceof z.ZodError) throw new AppError('Dados inválidos', 400);
    throw new AppError('Erro ao atualizar perfil do cliente', 500);
  }
};

export const updateClientApiKey = async (req: Request, res: Response) => {
  try {
    const params = z.object({ clientId: z.string().uuid() }).parse(req.params);
    const body = z.object({ metaApiKey: z.string().optional() }).parse(req.body);

    // Verificar se o tenant existe e tem ClientProfile
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.clientId },
      include: { clients: true },
    });

    if (!tenant || !tenant.clients) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Atualizar a API key no ClientProfile
    const updatedClient = await prisma.clientProfile.update({
      where: { tenantId: params.clientId },
      data: { metaApiKey: body.metaApiKey || null },
      include: { tenant: true },
    });

    return res.json(updatedClient);
  } catch (error: any) {
    console.error('Erro ao atualizar API key do cliente:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erro ao atualizar API key do cliente', 500);
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const params = z.object({ clientId: z.string().uuid() }).parse(req.params);

    // Verificar se o tenant existe e tem ClientProfile (é um cliente real)
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.clientId },
      include: {
        clients: true,
      },
    });

    if (!tenant) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (!tenant.clients) {
      throw new AppError('Não é possível excluir este tenant', 400);
    }

    // Deletar em cascata todos os dados relacionados
    await prisma.$transaction(async (tx) => {
      // Deletar em ordem para respeitar as constraints
      
      // 1. Deletar lessonProgress primeiro (tem relação com tenant)
      await tx.lessonProgress.deleteMany({ where: { tenantId: params.clientId } });
      
      // 2. Deletar logs e tokens
      await tx.mediaDownloadLog.deleteMany({ where: { tenantId: params.clientId } });
      await tx.downloadToken.deleteMany({ where: { tenantId: params.clientId } });
      
      // 3. Deletar outros dados relacionados ao tenant
      await tx.auditLog.deleteMany({ where: { tenantId: params.clientId } });
      await tx.integrationAsset.deleteMany({ where: { tenantId: params.clientId } });
      await tx.notification.deleteMany({ where: { tenantId: params.clientId } });
      await tx.report.deleteMany({ where: { tenantId: params.clientId } });
      await tx.manualResult.deleteMany({ where: { tenantId: params.clientId } });
      await tx.lead.deleteMany({ where: { tenantId: params.clientId } });
      await tx.campaignApproval.deleteMany({ where: { tenantId: params.clientId } });
      await tx.campaign.deleteMany({ where: { tenantId: params.clientId } });
      await tx.mediaAsset.deleteMany({ where: { tenantId: params.clientId } });
      
      // 4. Deletar training tracks e seus módulos/lições
      const tracks = await tx.trainingTrack.findMany({ where: { tenantId: params.clientId } });
      for (const track of tracks) {
        const modules = await tx.trainingModule.findMany({ where: { trackId: track.id } });
        for (const module of modules) {
          // Buscar todas as lições do módulo
          const lessons = await tx.lesson.findMany({ where: { moduleId: module.id } });
          const lessonIds = lessons.map((l) => l.id);
          
          // Deletar lessonProgress das lições primeiro
          if (lessonIds.length > 0) {
            await tx.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
          }
          
          // Depois deletar as lições
          await tx.lesson.deleteMany({ where: { moduleId: module.id } });
        }
        await tx.trainingModule.deleteMany({ where: { trackId: track.id } });
      }
      await tx.trainingTrack.deleteMany({ where: { tenantId: params.clientId } });

      // 5. Deletar sessões
      await tx.session.deleteMany({ where: { tenantId: params.clientId } });

      // 6. Deletar usuários (que não são admin)
      await tx.user.deleteMany({
        where: {
          tenantId: params.clientId,
          role: 'CLIENT',
        },
      });

      // 7. Deletar ClientProfile
      await tx.clientProfile.delete({ where: { tenantId: params.clientId } });

      // 8. Por último, deletar o Tenant
      await tx.tenant.delete({ where: { id: params.clientId } });
    });

    return res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir cliente:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erro ao excluir cliente', 500);
  }
};

