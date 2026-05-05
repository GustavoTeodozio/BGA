import type { Request, Response } from 'express';
import { z } from 'zod';

import taskService from '../../../application/modules/tasks/task.service';
import AppError from '../../../shared/errors/AppError';
import prisma from '../../../config/prisma';
import logger from '../../../config/logger';

// Helper para buscar o tenant do admin (cria automaticamente se não existir)
async function getAdminTenantId(): Promise<string> {
  try {
    logger.info('Buscando tenant do admin...');
    
    // Primeiro tenta encontrar pelo nome "Sistema" (tenant padrão do admin)
    let adminTenant = await prisma.tenant.findFirst({
      where: {
        name: 'Sistema',
        clients: null, // Tenant sem ClientProfile
      },
      select: { id: true },
    });

    if (adminTenant) {
      logger.info('Tenant "Sistema" encontrado', { tenantId: adminTenant.id });
      return adminTenant.id;
    }

    logger.info('Tenant "Sistema" não encontrado, buscando qualquer tenant sem ClientProfile...');

    // Se não encontrar, busca qualquer tenant sem ClientProfile
    adminTenant = await prisma.tenant.findFirst({
      where: {
        clients: null, // Tenant sem ClientProfile
      },
      select: { id: true },
    });

    if (adminTenant) {
      logger.info('Tenant sem ClientProfile encontrado', { tenantId: adminTenant.id });
      return adminTenant.id;
    }

    logger.info('Nenhum tenant sem ClientProfile encontrado, buscando tenant do usuário ADMIN...');

    // Última tentativa: buscar tenant que tenha usuário ADMIN
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
      select: { tenantId: true },
    });

    if (adminUser?.tenantId) {
      logger.info('Usuário ADMIN encontrado', { tenantId: adminUser.tenantId });
      
      // Verificar se o tenant do admin não tem ClientProfile
      const tenant = await prisma.tenant.findUnique({
        where: { id: adminUser.tenantId },
        include: {
          clients: {
            select: { id: true },
          },
        },
      });

      if (tenant && !tenant.clients) {
        logger.info('Tenant do usuário ADMIN é válido (sem ClientProfile)', { tenantId: tenant.id });
        return tenant.id;
      } else {
        logger.warn('Tenant do usuário ADMIN tem ClientProfile', { tenantId: adminUser.tenantId });
      }
    } else {
      logger.warn('Nenhum usuário ADMIN encontrado');
    }

    // Se não encontrou nenhum tenant válido, criar automaticamente o tenant "Sistema"
    logger.info('Nenhum tenant válido encontrado, criando tenant "Sistema" automaticamente...');
    
    try {
      // Verificar se já existe um tenant "Sistema" (mesmo que tenha ClientProfile)
      let sistemaTenant = await prisma.tenant.findFirst({
        where: { name: 'Sistema' },
        select: { id: true },
      });

      if (!sistemaTenant) {
        // Criar novo tenant "Sistema"
        sistemaTenant = await prisma.tenant.create({
          data: {
            name: 'Sistema',
            slug: 'sistema',
            isActive: true,
          },
          select: { id: true },
        });
        logger.info('Tenant "Sistema" criado automaticamente', { tenantId: sistemaTenant.id });
      } else {
        logger.info('Tenant "Sistema" já existe (mas pode ter ClientProfile)', { tenantId: sistemaTenant.id });
      }

      return sistemaTenant.id;
    } catch (createError: any) {
      logger.error('Erro ao criar tenant "Sistema"', {
        error: createError?.message,
        code: createError?.code,
        stack: createError?.stack,
      });
      throw new AppError('Não foi possível criar o tenant do sistema. Verifique as permissões do banco de dados.', 500);
    }
  } catch (error: any) {
    logger.error('Erro na função getAdminTenantId', {
      error: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
}

const listSchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.string().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().transform(val => val && val.trim() !== '' ? val : undefined),
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  assigneeName: z.string().optional().transform(val => val && val.trim() !== '' ? val : undefined),
  campaignId: z.string().optional().transform(val => val && val.trim() !== '' ? val : undefined),
  tenantId: z.string().optional(), // Para admins especificarem o tenant
  dueDate: z.string().optional().transform(val => val && val.trim() !== '' ? new Date(val) : undefined),
  scheduledAt: z.string().optional().transform(val => val && val.trim() !== '' ? new Date(val) : undefined),
  tags: z.string().optional().transform(val => val && val.trim() !== '' ? val : undefined),
  position: z.number().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  assigneeName: z.string().optional(),
  campaignId: z.string().optional(),
  dueDate: z.string().optional().transform(val => val && val.trim() !== '' ? new Date(val) : undefined),
  scheduledAt: z.string().optional().transform(val => val && val.trim() !== '' ? new Date(val) : undefined),
  publishedAt: z.string().optional().transform(val => val && val.trim() !== '' ? new Date(val) : undefined),
  tags: z.string().optional(),
  position: z.number().optional(),
  clientTenantId: z.string().nullable().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1),
});

const checklistSchema = z.object({
  title: z.string().min(1),
  position: z.number().optional(),
});

const updateChecklistSchema = z.object({
  title: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
});

const attachmentSchema = z.object({
  mediaId: z.string().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  type: z.string(),
  size: z.number().optional(),
});

const metricsSchema = z.object({
  budget: z.number().optional(),
  spent: z.number().optional(),
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  cpm: z.number().optional(),
  cpc: z.number().optional(),
  ctr: z.number().optional(),
  conversions: z.number().optional(),
  conversionRate: z.number().optional(),
  leadGoal: z.number().optional(),
  salesGoal: z.number().optional(),
  leadsActual: z.number().optional(),
  salesActual: z.number().optional(),
  revenue: z.number().optional(),
  roas: z.number().optional(),
});

const updatePositionsSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    position: z.number(),
    status: z.string().optional(),
  })),
});

export const listTasks = async (req: Request, res: Response) => {
  const tenantId = req.auth?.tenantId;
  if (!tenantId) throw new AppError('Tenant não encontrado', 400);

  const filters = listSchema.parse(req.query);
  const includeLinked = req.auth?.role === 'CLIENT';
  const result = await taskService.listTasks(tenantId, { ...filters, includeLinked });

  return res.json(result);
};

export const getTask = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const tenantId = req.auth?.tenantId;

  const task = await taskService.getTask(taskId, tenantId);

  return res.json(task);
};

export const createTask = async (req: Request, res: Response) => {
  try {
    let tenantId = req.auth?.tenantId;
    const userId = req.auth?.userId;
    
    logger.info('=== INÍCIO: Criando task ===', {
      userId,
      tenantId,
      role: req.auth?.role,
      body: JSON.stringify(req.body),
      auth: JSON.stringify(req.auth),
    });
    
    // Validar que userId existe
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }
    
    // Para admin, pode especificar tenantId no body ou usar o tenant padrão do admin
    if (!tenantId && req.auth?.role === 'ADMIN') {
      tenantId = (req.body as any).tenantId;
      // Se não especificou no body, busca o tenant padrão do admin
      if (!tenantId) {
        try {
          tenantId = await getAdminTenantId();
          logger.info('Tenant do admin encontrado', { tenantId });
          
          // Validar que o tenantId retornado é válido
          if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
            throw new AppError('Tenant do admin inválido', 500);
          }
        } catch (error: any) {
          logger.error('Erro ao buscar tenant do admin', { error: error.message, stack: error.stack });
          if (error instanceof AppError) {
            throw error;
          }
          throw new AppError('Não foi possível determinar o tenant. Verifique se existe um tenant do sistema configurado.', 500);
        }
      }
    } else if (!tenantId) {
      throw new AppError('Tenant não encontrado', 400);
    }
    
    // Validar formato do tenantId
    if (typeof tenantId !== 'string' || tenantId.trim() === '') {
      logger.error('TenantId inválido', { tenantId, type: typeof tenantId });
      throw new AppError('TenantId inválido', 400);
    }

    // Validar body com Zod
    let body;
    try {
      body = createTaskSchema.parse(req.body);
      
      // Validar que as datas são válidas se existirem
      if (body.dueDate && isNaN(body.dueDate.getTime())) {
        throw new AppError('Data limite inválida', 400);
      }
      if (body.scheduledAt && isNaN(body.scheduledAt.getTime())) {
        throw new AppError('Data de agendamento inválida', 400);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.error('Erro de validação Zod', { issues: error.issues, body: req.body });
        throw new AppError('Dados inválidos: ' + error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`).join(', '), 400);
      }
      throw error;
    }

    // Verificar se tenant existe antes de criar
    const tenantExists = await prisma.tenant.findUnique({
      where: { id: tenantId! },
      select: { id: true },
    });

    if (!tenantExists) {
      logger.error('Tenant não encontrado no banco', { tenantId });
      throw new AppError('Tenant não encontrado', 404);
    }

    // Verificar se usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      logger.error('Usuário não encontrado no banco', { userId });
      throw new AppError('Usuário não encontrado', 404);
    }

    try {
      // Preparar dados para criação, garantindo valores padrão
      const taskData = {
        tenantId: tenantId!,
        title: body.title,
        description: body.description,
        status: body.status || 'BACKLOG',
        category: body.category || 'OTHER',
        priority: body.priority || 'MEDIUM',
        assigneeName: body.assigneeName,
        createdById: userId,
        campaignId: body.campaignId,
        dueDate: body.dueDate,
        scheduledAt: body.scheduledAt,
        tags: body.tags,
        position: body.position ?? 0,
      };

      logger.info('Dados preparados para criar task', { taskData });

      const task = await taskService.createTask(taskData);

      logger.info('Task criada com sucesso', { taskId: task.id });
      return res.status(201).json(task);
    } catch (prismaError: any) {
      logger.error('Erro do Prisma ao criar task', {
        error: prismaError.message,
        code: prismaError.code,
        meta: prismaError.meta,
        stack: prismaError.stack,
      });
      
      // Tratar erros específicos do Prisma
      if (prismaError.code === 'P2003') {
        // Foreign key constraint violation
        const field = prismaError.meta?.field_name || 'campo desconhecido';
        const model = prismaError.meta?.model_name || 'registro';
        throw new AppError(
          `Referência inválida: ${model} (${field}) não encontrado. Verifique se tenant, usuário ou campanha existem.`, 
          400,
          { code: prismaError.code, field, model: prismaError.meta }
        );
      }
      if (prismaError.code === 'P2002') {
        // Unique constraint violation
        const target = prismaError.meta?.target || 'campo';
        throw new AppError(
          `Violação de constraint única: ${target}`, 
          400,
          { code: prismaError.code, target: prismaError.meta }
        );
      }
      
      // Para outros erros do Prisma, incluir código e mensagem
      throw new AppError(
        `Erro ao criar task no banco de dados: ${prismaError.message || 'Erro desconhecido'}`,
        500,
        { 
          code: prismaError.code || 'UNKNOWN',
          originalError: prismaError.message,
          meta: prismaError.meta 
        }
      );
    }
  } catch (error: any) {
    logger.error('=== ERRO AO CRIAR TASK ===', {
      error: error?.message || 'Erro desconhecido',
      errorName: error?.name,
      errorCode: error?.code,
      errorMeta: error?.meta,
      stack: error?.stack,
      body: JSON.stringify(req.body),
      auth: JSON.stringify(req.auth),
      errorType: error?.constructor?.name,
      isAppError: error instanceof AppError,
      isZodError: error instanceof z.ZodError,
    });
    
    // Se já é um AppError, apenas relançar
    if (error instanceof AppError) {
      throw error;
    }
    
    // Se é um erro do Zod, converter para AppError
    if (error instanceof z.ZodError) {
      throw new AppError('Dados inválidos: ' + error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`).join(', '), 400);
    }
    
    // Para qualquer outro erro, converter para AppError com mensagem genérica
    throw new AppError(
      error?.message || 'Erro interno ao criar task',
      500,
      process.env.NODE_ENV === 'development' ? { originalError: error?.message, stack: error?.stack } : undefined
    );
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const tenantId = req.auth?.tenantId;
  const body = updateTaskSchema.parse(req.body);

  const task = await taskService.updateTask(taskId, body, tenantId);

  return res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const tenantId = req.auth?.tenantId;

  await taskService.deleteTask(taskId, tenantId);

  return res.json({ message: 'Tarefa excluída com sucesso' });
};

// Comments
export const addComment = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const tenantId = req.auth?.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new AppError('Autenticação necessária', 401);

  const { content } = commentSchema.parse(req.body);

  const comment = await taskService.addComment(taskId, userId, tenantId, content);

  return res.status(201).json(comment);
};

export const deleteComment = async (req: Request, res: Response) => {
  const { commentId } = z.object({ commentId: z.string().uuid() }).parse(req.params);
  const tenantId = req.auth?.tenantId;
  const userId = req.auth?.userId;
  if (!tenantId || !userId) throw new AppError('Autenticação necessária', 401);

  await taskService.deleteComment(commentId, userId, tenantId);

  return res.json({ message: 'Comentário excluído com sucesso' });
};

// Checklist
export const addChecklistItem = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const { title, position } = checklistSchema.parse(req.body);

  const item = await taskService.addChecklistItem(taskId, title, position);

  return res.status(201).json(item);
};

export const updateChecklistItem = async (req: Request, res: Response) => {
  const { itemId } = z.object({ itemId: z.string().uuid() }).parse(req.params);
  const data = updateChecklistSchema.parse(req.body);

  const item = await taskService.updateChecklistItem(itemId, data);

  return res.json(item);
};

export const deleteChecklistItem = async (req: Request, res: Response) => {
  const { itemId } = z.object({ itemId: z.string().uuid() }).parse(req.params);

  await taskService.deleteChecklistItem(itemId);

  return res.json({ message: 'Item excluído com sucesso' });
};

// Attachments
export const addAttachment = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const data = attachmentSchema.parse(req.body);

  const attachment = await taskService.addAttachment(taskId, data);

  return res.status(201).json(attachment);
};

export const deleteAttachment = async (req: Request, res: Response) => {
  const { attachmentId } = z.object({ attachmentId: z.string().uuid() }).parse(req.params);

  await taskService.deleteAttachment(attachmentId);

  return res.json({ message: 'Anexo excluído com sucesso' });
};

// Metrics
export const updateMetrics = async (req: Request, res: Response) => {
  const { taskId } = z.object({ taskId: z.string().uuid() }).parse(req.params);
  const data = metricsSchema.parse(req.body);

  const metrics = await taskService.updateMetrics(taskId, data);

  return res.json(metrics);
};

// Drag and drop
export const updatePositions = async (req: Request, res: Response) => {
  try {
    logger.info('Atualizando posições das tasks', {
      userId: req.auth?.userId,
      tenantId: req.auth?.tenantId,
      updatesCount: req.body?.updates?.length,
    });

    const { updates } = updatePositionsSchema.parse(req.body);

    await taskService.updatePositions(updates);

    logger.info('Posições atualizadas com sucesso');
    return res.json({ message: 'Posições atualizadas com sucesso' });
  } catch (error: any) {
    logger.error('Erro ao atualizar posições', {
      error: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw error;
  }
};

