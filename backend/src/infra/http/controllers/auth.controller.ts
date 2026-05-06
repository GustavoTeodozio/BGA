import type { Request, Response } from 'express';
import type { Express } from 'express';
import { z } from 'zod';

import authService from '../../../application/modules/auth/auth.service';
import AppError from '../../../shared/errors/AppError';
import storageProvider from '../../storage/local-storage.provider';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  tenantName: z.string().min(3),
  businessName: z.string().min(3),
  cpfCnpj: z.string().optional(),
  segment: z.string().optional(),
  contactName: z.string().min(3),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(['START', 'MASTER', 'PREMIUM', 'CUSTOM']).optional(),
  customPlanDescription: z.string().optional(),
  monthlyValue: z.preprocess((v) => (v !== '' && v !== undefined ? Number(v) : undefined), z.number().positive().optional()),
  contractMonths: z.preprocess((v) => (v !== '' && v !== undefined ? Number(v) : undefined), z.number().int().positive().optional()),
  dueDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const registerClient = async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const files = req.files as Express.Multer.File[] | undefined;
    const logoUrls: string[] = [];
    let logoUrl: string | undefined;

    if (files && files.length > 0) {
      for (const file of files) {
        const stored = await storageProvider.save(file);
        logoUrls.push(stored.fileUrl);
      }
      logoUrl = logoUrls[0];
    }

    const createdById = (req as any).auth?.userId ?? undefined;

    const result = await authService.registerClient({
      ...body,
      logoUrl,
      logoUrls,
      createdById,
    });
    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro no registro:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const body = refreshSchema.parse(req.body);
    const result = await authService.refresh(body);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.issues });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Erro no refresh token:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

