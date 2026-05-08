import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import storage from '../../storage/local-storage.provider';

// ── Validation schemas ────────────────────────────────────────────────────

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().default(''),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  dailyRate: z.coerce.number().default(0),
  notes: z.string().optional().nullable(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const attendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  present: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

const advanceSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  notes: z.string().optional().nullable(),
});

// ── Helpers ───────────────────────────────────────────────────────────────

function getTenantId(req: Request): string {
  return req.auth!.tenantId as string;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listEmployees(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      attendances: true,
      advances: true,
    },
  });
  return res.json(employees);
}

export async function getEmployee(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    include: {
      attendances: { orderBy: { date: 'desc' } },
      advances: { orderBy: { date: 'desc' } },
    },
  });

  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  return res.json(employee);
}

export async function createEmployee(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const parsed = createEmployeeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
  }

  const { birthDate, email, dailyRate, ...rest } = parsed.data;

  const employee = await prisma.employee.create({
    data: {
      ...rest,
      tenantId,
      email: email || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      dailyRate: dailyRate,
    },
  });

  return res.status(201).json(employee);
}

export async function updateEmployee(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;

  const existing = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!existing) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
  }

  const { birthDate, email, dailyRate, ...rest } = parsed.data;

  const data: Record<string, unknown> = { ...rest };
  if (email !== undefined) data.email = email || null;
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
  if (dailyRate !== undefined) data.dailyRate = dailyRate;

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data,
  });

  return res.json(employee);
}

export async function deleteEmployee(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  // Clean up stored files
  if (employee.photoKey) await storage.delete(employee.photoKey).catch(() => null);
  if (employee.docFrontKey) await storage.delete(employee.docFrontKey).catch(() => null);
  if (employee.docBackKey) await storage.delete(employee.docBackKey).catch(() => null);

  await prisma.employee.delete({ where: { id: employeeId } });
  return res.json({ message: 'Funcionário removido.' });
}

// ── File uploads ──────────────────────────────────────────────────────────

export async function uploadEmployeePhoto(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ message: 'Nenhuma foto enviada.' });
  }

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  // Delete old photo if exists
  if (employee.photoKey) await storage.delete(employee.photoKey).catch(() => null);

  const { fileUrl, storageKey } = await storage.save(file);

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { photoUrl: fileUrl, photoKey: storageKey },
  });

  return res.json({ photoUrl: updated.photoUrl, photoKey: updated.photoKey });
}

export async function uploadEmployeeDoc(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;
  const side = (req.query.side as string) || 'front';
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ message: 'Nenhum documento enviado.' });
  }

  if (side !== 'front' && side !== 'back') {
    return res.status(400).json({ message: 'Parâmetro side deve ser "front" ou "back".' });
  }

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  // Delete old doc if exists
  if (side === 'front' && employee.docFrontKey) {
    await storage.delete(employee.docFrontKey).catch(() => null);
  }
  if (side === 'back' && employee.docBackKey) {
    await storage.delete(employee.docBackKey).catch(() => null);
  }

  const { fileUrl, storageKey } = await storage.save(file);

  const data = side === 'front'
    ? { docFrontUrl: fileUrl, docFrontKey: storageKey }
    : { docBackUrl: fileUrl, docBackKey: storageKey };

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data,
  });

  return res.json({
    docFrontUrl: updated.docFrontUrl,
    docFrontKey: updated.docFrontKey,
    docBackUrl: updated.docBackUrl,
    docBackKey: updated.docBackKey,
  });
}

// ── Attendance ────────────────────────────────────────────────────────────

export async function markAttendance(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
  }

  const { date, present, notes } = parsed.data;
  const dateObj = new Date(date + 'T00:00:00.000Z');
  const empId = employeeId as string;

  const attendance = await prisma.employeeAttendance.upsert({
    where: { employeeId_date: { employeeId: empId, date: dateObj } },
    create: { employeeId: empId, date: dateObj, present, notes: notes || null },
    update: { present, notes: notes || null },
  });

  return res.json(attendance);
}

export async function listAttendance(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const attendances = await prisma.employeeAttendance.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  return res.json(attendances);
}

// ── Advances ──────────────────────────────────────────────────────────────

export async function addAdvance(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { employeeId } = req.params;

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!employee) {
    return res.status(404).json({ message: 'Funcionário não encontrado.' });
  }

  const parsed = advanceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
  }

  const { amount, date, notes } = parsed.data;
  const dateObj = new Date(date + 'T00:00:00.000Z');

  const advance = await prisma.employeeAdvance.create({
    data: { employeeId: employeeId as string, amount, date: dateObj, notes: notes || null },
  });

  return res.status(201).json(advance);
}

export async function deleteAdvance(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  const { advanceId } = req.params;

  const advance = await prisma.employeeAdvance.findFirst({
    where: { id: advanceId },
    include: { employee: true },
  });

  if (!advance || advance.employee.tenantId !== tenantId) {
    return res.status(404).json({ message: 'Vale não encontrado.' });
  }

  await prisma.employeeAdvance.delete({ where: { id: advanceId } });
  return res.json({ message: 'Vale removido.' });
}
