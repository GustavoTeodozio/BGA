import { Router } from 'express';

import { authorizeRoles, ensureAuthenticated } from '../middlewares/auth';
import upload from '../middlewares/upload';
import asyncHandler from '../middlewares/async-handler';
import { uploadMedia, listAllMedia, deleteMedia, listPendingApprovals, listApprovedMedia, listRejectedMedia } from '../controllers/media.controller';
import {
  createCampaign,
  decideApproval,
  listCampaigns,
  listAllCampaigns,
  requestApproval,
  updateCampaignStatus,
} from '../controllers/campaigns.controller';
import { createReport } from '../controllers/reports.controller';
import { listClients, updateClientStatus, updateClientProfileStatus, updateClientProfile, updateClientApiKey, deleteClient } from '../controllers/clients.controller';
import { getAdminStats } from '../controllers/admin.controller';
import { listUsers, listAdmins, createAdmin, deleteAdmin, updateProfile, listTeamMembers } from '../controllers/users.controller';
import {
  listAllTracks,
  createTrack,
  updateTrack,
  deleteTrack,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/admin-training.controller';
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
import { syncCampaigns } from '../controllers/facebook-ads.controller';
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
} from '../controllers/sales.controller';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  uploadFile,
  deleteFile,
} from '../controllers/projects.controller';
import {
  getClientAISettings,
  updateClientAISettings,
  deleteClientAIKey,
  getGlobalAISettings,
  updateGlobalAISettings,
} from '../controllers/settings.controller';
import { ceniqChat } from '../controllers/ceniq.controller';
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

const adminRoutes = Router();

adminRoutes.use(ensureAuthenticated, authorizeRoles('ADMIN'));

adminRoutes.patch('/profile', asyncHandler(updateProfile));
adminRoutes.get('/stats', asyncHandler(getAdminStats));
adminRoutes.get('/users', asyncHandler(listUsers));
adminRoutes.get('/team-members', asyncHandler(listTeamMembers));
adminRoutes.get('/admins', asyncHandler(listAdmins));
adminRoutes.post('/admins', asyncHandler(createAdmin));
adminRoutes.delete('/admins/:adminId', asyncHandler(deleteAdmin));
adminRoutes.get('/clients', asyncHandler(listClients));
adminRoutes.patch('/clients/:clientId/status', asyncHandler(updateClientStatus));
adminRoutes.patch('/clients/:clientId/client-status', asyncHandler(updateClientProfileStatus));
adminRoutes.patch('/clients/:clientId/profile', asyncHandler(updateClientProfile));
adminRoutes.patch('/clients/:clientId/api-key', asyncHandler(updateClientApiKey));
adminRoutes.delete('/clients/:clientId', asyncHandler(deleteClient));
adminRoutes.get('/media', asyncHandler(listAllMedia));
adminRoutes.post('/media', upload.single('file'), asyncHandler(uploadMedia));
adminRoutes.delete('/media/:mediaId', asyncHandler(deleteMedia));
adminRoutes.get('/media/approvals/pending', asyncHandler(listPendingApprovals));
adminRoutes.get('/media/approvals/approved', asyncHandler(listApprovedMedia));
adminRoutes.get('/media/approvals/rejected', asyncHandler(listRejectedMedia));

adminRoutes.get('/campaigns', asyncHandler(listAllCampaigns));
adminRoutes.post('/campaigns', asyncHandler(createCampaign));
adminRoutes.patch('/campaigns/:campaignId/status', asyncHandler(updateCampaignStatus));
adminRoutes.post('/campaigns/:campaignId/approval', asyncHandler(requestApproval));
adminRoutes.post('/approvals/:approvalId/decision', asyncHandler(decideApproval));

adminRoutes.post('/reports', asyncHandler(createReport));

// Training routes
adminRoutes.get('/training/tracks', asyncHandler(listAllTracks));
adminRoutes.post('/training/tracks', upload.single('cover'), asyncHandler(createTrack));
adminRoutes.patch('/training/tracks/:trackId', upload.single('cover'), asyncHandler(updateTrack));
adminRoutes.delete('/training/tracks/:trackId', asyncHandler(deleteTrack));
adminRoutes.post('/training/modules', asyncHandler(createModule));
adminRoutes.patch('/training/modules/:moduleId', asyncHandler(updateModule));
adminRoutes.delete('/training/modules/:moduleId', asyncHandler(deleteModule));
adminRoutes.post('/training/lessons', upload.single('thumbnail'), asyncHandler(createLesson));
adminRoutes.patch('/training/lessons/:lessonId', upload.single('thumbnail'), asyncHandler(updateLesson));
adminRoutes.delete('/training/lessons/:lessonId', asyncHandler(deleteLesson));

// Task/Kanban routes
adminRoutes.get('/tasks', asyncHandler(listTasks));
adminRoutes.get('/tasks/:taskId', asyncHandler(getTask));
adminRoutes.post('/tasks', asyncHandler(createTask));
adminRoutes.patch('/tasks/:taskId', asyncHandler(updateTask));
adminRoutes.delete('/tasks/:taskId', asyncHandler(deleteTask));
adminRoutes.post('/tasks/:taskId/comments', asyncHandler(addComment));
adminRoutes.delete('/tasks/comments/:commentId', asyncHandler(deleteComment));
adminRoutes.post('/tasks/:taskId/checklist', asyncHandler(addChecklistItem));
adminRoutes.patch('/tasks/checklist/:itemId', asyncHandler(updateChecklistItem));
adminRoutes.delete('/tasks/checklist/:itemId', asyncHandler(deleteChecklistItem));
adminRoutes.post('/tasks/:taskId/attachments', asyncHandler(addAttachment));
adminRoutes.delete('/tasks/attachments/:attachmentId', asyncHandler(deleteAttachment));
adminRoutes.patch('/tasks/:taskId/metrics', asyncHandler(updateMetrics));
adminRoutes.post('/tasks/positions', asyncHandler(updatePositions));

// Facebook Ads integration (admin pode sincronizar para qualquer cliente)
adminRoutes.post('/facebook/sync/:clientId', asyncHandler(syncCampaigns));

// Notes (admin vê todas)
adminRoutes.get('/notes', asyncHandler(listNotes));
adminRoutes.get('/notes/:noteId', asyncHandler(getNote));
adminRoutes.post('/notes', asyncHandler(createNote));
adminRoutes.patch('/notes/:noteId', asyncHandler(updateNote));
adminRoutes.delete('/notes/:noteId', asyncHandler(deleteNote));
adminRoutes.patch('/notes/:noteId/pin', asyncHandler(togglePin));

// Budgets (admin vê todos)
adminRoutes.get('/budgets', asyncHandler(listBudgets));
adminRoutes.get('/budgets/:budgetId', asyncHandler(getBudget));
adminRoutes.post('/budgets', asyncHandler(createBudget));
adminRoutes.patch('/budgets/:budgetId', asyncHandler(updateBudget));
adminRoutes.delete('/budgets/:budgetId', asyncHandler(deleteBudget));

// Sales (admin vê todas com nome do vendedor)
adminRoutes.get('/sales', asyncHandler(listSales));
adminRoutes.get('/sales/:saleId', asyncHandler(getSale));
adminRoutes.post('/sales', asyncHandler(createSale));
adminRoutes.patch('/sales/:saleId', asyncHandler(updateSale));
adminRoutes.delete('/sales/:saleId', asyncHandler(deleteSale));

// Projects (admin vê todos)
adminRoutes.get('/projects', asyncHandler(listProjects));
adminRoutes.get('/projects/:projectId', asyncHandler(getProject));
adminRoutes.post('/projects', asyncHandler(createProject));
adminRoutes.patch('/projects/:projectId', asyncHandler(updateProject));
adminRoutes.delete('/projects/:projectId', asyncHandler(deleteProject));
adminRoutes.post('/projects/:projectId/files', upload.single('file'), asyncHandler(uploadFile));
adminRoutes.delete('/projects/files/:fileId', asyncHandler(deleteFile));

// Per-client AI settings
adminRoutes.get('/settings/clients/:tenantId', asyncHandler(getClientAISettings));
adminRoutes.patch('/settings/clients/:tenantId', asyncHandler(updateClientAISettings));
adminRoutes.delete('/settings/clients/:tenantId/api-key', asyncHandler(deleteClientAIKey));

// Global AI settings (used by admin/projetista Ceniq)
adminRoutes.get('/settings/global', asyncHandler(getGlobalAISettings));
adminRoutes.patch('/settings/global', asyncHandler(updateGlobalAISettings));

// Ceniq AI stand design (admin)
adminRoutes.post('/ceniq', asyncHandler(ceniqChat));

// Stand Progress Tracker
adminRoutes.get('/stand-updates/stages', asyncHandler(listStages));
adminRoutes.get('/clients/:clientId/stand-updates', asyncHandler(listStandUpdates));
adminRoutes.post('/clients/:clientId/stand-updates', asyncHandler(createStandUpdate));
adminRoutes.patch('/stand-updates/:id', asyncHandler(updateStandUpdate));
adminRoutes.delete('/stand-updates/:id', asyncHandler(deleteStandUpdate));
adminRoutes.post('/stand-updates/:id/photos', upload.array('photos', 10), asyncHandler(uploadStandUpdatePhotos));
adminRoutes.delete('/stand-updates/photos/:photoId', asyncHandler(deleteStandUpdatePhoto));
adminRoutes.post('/stand-updates/:id/comments', asyncHandler(addStandUpdateComment));
adminRoutes.delete('/stand-updates/comments/:commentId', asyncHandler(deleteStandUpdateComment));

export default adminRoutes;

