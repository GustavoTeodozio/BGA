import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';
import { buildPagination, type PaginationParams } from '../../../shared/utils/pagination';

export interface ListTasksParams extends PaginationParams {
  status?: string;
  category?: string;
  assigneeId?: string;
  priority?: string;
  includeLinked?: boolean;
}

export interface CreateTaskInput {
  tenantId: string;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  priority?: string;
  assigneeName?: string;
  createdById?: string;
  campaignId?: string;
  dueDate?: Date;
  scheduledAt?: Date;
  tags?: string;
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  category?: string;
  priority?: string;
  assigneeName?: string;
  campaignId?: string;
  dueDate?: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  tags?: string;
  position?: number;
  clientTenantId?: string | null;
}

export class TaskService {
  async listTasks(tenantId: string, params: ListTasksParams) {
    const { take, skip } = buildPagination(params);

    const baseWhere: any = params.includeLinked
      ? { OR: [{ tenantId }, { clientTenantId: tenantId }] }
      : { tenantId };
    const where: any = { ...baseWhere };
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.assigneeId) where.assigneeId = params.assigneeId;
    if (params.priority) where.priority = params.priority;

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          checklists: {
            orderBy: { position: 'asc' },
          },
          attachments: {
            include: {
              media: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          metrics: true,
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        take,
        skip,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items: data,
      total,
      page: params.page ?? 1,
      perPage: take,
    };
  }

  async getTask(taskId: string, tenantId?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        checklists: {
          orderBy: { position: 'asc' },
        },
        attachments: {
          include: {
            media: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        metrics: true,
      },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (tenantId && task.tenantId !== tenantId) {
      throw new AppError('Você não tem permissão para acessar esta tarefa', 403);
    }

    return task;
  }

  async createTask(input: CreateTaskInput) {
    // Filtrar campos undefined para evitar problemas com Prisma
    const data: any = {
      tenantId: input.tenantId,
      title: input.title,
      position: input.position ?? 0,
    };

    // Adicionar campos opcionais apenas se não forem undefined
    if (input.description !== undefined) data.description = input.description;
    if (input.status !== undefined) data.status = input.status as any;
    if (input.category !== undefined) data.category = input.category as any;
    if (input.priority !== undefined) data.priority = input.priority as any;
    if (input.assigneeName !== undefined) data.assigneeName = input.assigneeName;
    if (input.createdById !== undefined) data.createdById = input.createdById;
    if (input.campaignId !== undefined) data.campaignId = input.campaignId;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt;
    if (input.tags !== undefined) data.tags = input.tags;

    return prisma.task.create({
      data,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateTask(taskId: string, input: UpdateTaskInput, tenantId?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (tenantId && task.tenantId !== tenantId) {
      throw new AppError('Você não tem permissão para atualizar esta tarefa', 403);
    }

    return prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status as any,
        category: input.category as any,
        priority: input.priority as any,
        assigneeName: input.assigneeName,
        campaignId: input.campaignId,
        dueDate: input.dueDate,
        scheduledAt: input.scheduledAt,
        publishedAt: input.publishedAt,
        tags: input.tags,
        position: input.position,
        ...(input.clientTenantId !== undefined && { clientTenantId: input.clientTenantId }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteTask(taskId: string, tenantId?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (tenantId && task.tenantId !== tenantId) {
      throw new AppError('Você não tem permissão para deletar esta tarefa', 403);
    }

    return prisma.task.delete({
      where: { id: taskId },
    });
  }

  // Comments
  async addComment(taskId: string, userId: string, tenantId: string, content: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (task.tenantId !== tenantId) {
      throw new AppError('Você não tem permissão para comentar nesta tarefa', 403);
    }

    return prisma.taskComment.create({
      data: {
        taskId,
        tenantId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteComment(commentId: string, userId: string, tenantId: string) {
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comentário não encontrado', 404);
    }

    if (comment.tenantId !== tenantId) {
      throw new AppError('Você não tem permissão para deletar este comentário', 403);
    }

    // Apenas o autor ou admin pode deletar
    if (comment.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        throw new AppError('Você não tem permissão para deletar este comentário', 403);
      }
    }

    return prisma.taskComment.delete({
      where: { id: commentId },
    });
  }

  // Checklist
  async addChecklistItem(taskId: string, title: string, position?: number) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    const maxPosition = await prisma.taskChecklistItem.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return prisma.taskChecklistItem.create({
      data: {
        taskId,
        title,
        position: position ?? (maxPosition?.position ?? 0) + 1,
      },
    });
  }

  async updateChecklistItem(itemId: string, data: { title?: string; isCompleted?: boolean }) {
    const item = await prisma.taskChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new AppError('Item não encontrado', 404);
    }

    return prisma.taskChecklistItem.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteChecklistItem(itemId: string) {
    return prisma.taskChecklistItem.delete({
      where: { id: itemId },
    });
  }

  // Attachments
  async addAttachment(taskId: string, data: {
    mediaId?: string;
    name: string;
    url: string;
    type: string;
    size?: number;
  }) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    return prisma.taskAttachment.create({
      data: {
        taskId,
        mediaId: data.mediaId,
        name: data.name,
        url: data.url,
        type: data.type as any,
        size: data.size,
      },
      include: {
        media: true,
      },
    });
  }

  async deleteAttachment(attachmentId: string) {
    return prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });
  }

  // Metrics
  async updateMetrics(taskId: string, data: any) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    const existing = await prisma.taskMetrics.findUnique({
      where: { taskId },
    });

    if (existing) {
      return prisma.taskMetrics.update({
        where: { taskId },
        data: {
          ...data,
          lastSyncAt: new Date(),
        },
      });
    } else {
      return prisma.taskMetrics.create({
        data: {
          taskId,
          ...data,
          lastSyncAt: new Date(),
        },
      });
    }
  }

  // Bulk update positions for drag and drop
  async updatePositions(updates: { id: string; position: number; status?: string }[]) {
    const promises = updates.map((update) =>
      prisma.task.update({
        where: { id: update.id },
        data: {
          position: update.position,
          status: update.status as any,
        },
      })
    );

    return Promise.all(promises);
  }
}

export default new TaskService();

