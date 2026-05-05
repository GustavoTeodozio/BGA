import { Router } from 'express';

import { ensureAuthenticated, authorizeRoles } from '../middlewares/auth';
import asyncHandler from '../middlewares/async-handler';
import upload from '../middlewares/upload';
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
} from '../controllers/notes.controller';
import {
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgets.controller';
import {
  listSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  getVendedorStats,
} from '../controllers/sales.controller';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addAttachment,
  deleteAttachment,
  updateMetrics,
  updatePositions,
} from '../controllers/task.controller';
import { listClients } from '../controllers/clients.controller';
import { updateProfile } from '../controllers/users.controller';
import { registerClient } from '../controllers/auth.controller';
import {
  listStages,
  listStandUpdates,
  createStandUpdate,
  updateStandUpdate,
  deleteStandUpdate,
  uploadStandUpdatePhotos,
  deleteStandUpdatePhoto,
  addStandUpdateComment,
  deleteStandUpdateComment,
} from '../controllers/stand-updates.controller';

const vendedorRoutes = Router();

vendedorRoutes.use(ensureAuthenticated, authorizeRoles('VENDEDOR'));

vendedorRoutes.patch('/profile', asyncHandler(updateProfile));

// Dashboard
vendedorRoutes.get('/dashboard', asyncHandler(getVendedorStats));

// Notes
vendedorRoutes.get('/notes', asyncHandler(listNotes));
vendedorRoutes.get('/notes/:noteId', asyncHandler(getNote));
vendedorRoutes.post('/notes', asyncHandler(createNote));
vendedorRoutes.patch('/notes/:noteId', asyncHandler(updateNote));
vendedorRoutes.delete('/notes/:noteId', asyncHandler(deleteNote));
vendedorRoutes.patch('/notes/:noteId/pin', asyncHandler(togglePin));

// Budgets
vendedorRoutes.get('/budgets', asyncHandler(listBudgets));
vendedorRoutes.get('/budgets/:budgetId', asyncHandler(getBudget));
vendedorRoutes.post('/budgets', asyncHandler(createBudget));
vendedorRoutes.patch('/budgets/:budgetId', asyncHandler(updateBudget));
vendedorRoutes.delete('/budgets/:budgetId', asyncHandler(deleteBudget));

// Sales
vendedorRoutes.get('/sales', asyncHandler(listSales));
vendedorRoutes.get('/sales/:saleId', asyncHandler(getSale));
vendedorRoutes.post('/sales', asyncHandler(createSale));
vendedorRoutes.patch('/sales/:saleId', asyncHandler(updateSale));
vendedorRoutes.delete('/sales/:saleId', asyncHandler(deleteSale));

// Tasks/Kanban
vendedorRoutes.get('/tasks', asyncHandler(listTasks));
vendedorRoutes.get('/tasks/:taskId', asyncHandler(getTask));
vendedorRoutes.post('/tasks', asyncHandler(createTask));
vendedorRoutes.patch('/tasks/:taskId', asyncHandler(updateTask));
vendedorRoutes.delete('/tasks/:taskId', asyncHandler(deleteTask));
vendedorRoutes.post('/tasks/:taskId/comments', asyncHandler(addComment));
vendedorRoutes.delete('/tasks/comments/:commentId', asyncHandler(deleteComment));
vendedorRoutes.post('/tasks/:taskId/checklist', asyncHandler(addChecklistItem));
vendedorRoutes.patch('/tasks/checklist/:itemId', asyncHandler(updateChecklistItem));
vendedorRoutes.delete('/tasks/checklist/:itemId', asyncHandler(deleteChecklistItem));
vendedorRoutes.post('/tasks/:taskId/attachments', asyncHandler(addAttachment));
vendedorRoutes.delete('/tasks/attachments/:attachmentId', asyncHandler(deleteAttachment));
vendedorRoutes.patch('/tasks/:taskId/metrics', asyncHandler(updateMetrics));
vendedorRoutes.post('/tasks/positions', asyncHandler(updatePositions));

// Clients (listar e criar — vendedor pode cadastrar clientes)
vendedorRoutes.get('/clients', asyncHandler(listClients));
vendedorRoutes.post('/clients', upload.array('logos', 10), asyncHandler(registerClient));

// Stand Progress Tracker
vendedorRoutes.get('/stand-updates/stages', asyncHandler(listStages));
vendedorRoutes.get('/clients/:clientId/stand-updates', asyncHandler(listStandUpdates));
vendedorRoutes.post('/clients/:clientId/stand-updates', asyncHandler(createStandUpdate));
vendedorRoutes.patch('/stand-updates/:id', asyncHandler(updateStandUpdate));
vendedorRoutes.delete('/stand-updates/:id', asyncHandler(deleteStandUpdate));
vendedorRoutes.post('/stand-updates/:id/photos', upload.array('photos', 10), asyncHandler(uploadStandUpdatePhotos));
vendedorRoutes.delete('/stand-updates/photos/:photoId', asyncHandler(deleteStandUpdatePhoto));
vendedorRoutes.post('/stand-updates/:id/comments', asyncHandler(addStandUpdateComment));
vendedorRoutes.delete('/stand-updates/comments/:commentId', asyncHandler(deleteStandUpdateComment));

export default vendedorRoutes;
