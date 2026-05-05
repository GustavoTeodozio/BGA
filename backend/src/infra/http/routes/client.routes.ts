import { Router } from 'express';

import { ensureAuthenticated } from '../middlewares/auth';
import ensureTenant from '../middlewares/tenant';
import asyncHandler from '../middlewares/async-handler';
import { getSummary } from '../controllers/dashboard.controller';
import {
  createDownloadToken,
  listMedia,
  approveMedia,
  rejectMedia,
} from '../controllers/media.controller';
import { listTrainingTracks, saveProgress } from '../controllers/training.controller';
import { listResults, registerResult } from '../controllers/results.controller';
import { getReport, listReports } from '../controllers/reports.controller';
import { createLead, listLeads } from '../controllers/leads.controller';
import { listLinkedOpportunities } from '../controllers/crm.controller';
import {
  listNotifications,
  markNotificationAsRead,
} from '../controllers/notifications.controller';
import {
  listTasks,
  getTask,
  addComment,
  updateChecklistItem,
} from '../controllers/task.controller';
import { listUsers, updateProfile } from '../controllers/users.controller';
import { syncCampaigns } from '../controllers/facebook-ads.controller';
import { ceniqChat } from '../controllers/ceniq.controller';
import { getClientStandUpdates, addClientStandComment } from '../controllers/stand-updates.controller';

const clientRoutes = Router();

clientRoutes.use(ensureAuthenticated, ensureTenant);

clientRoutes.patch('/profile', asyncHandler(updateProfile));
clientRoutes.get('/dashboard/summary', asyncHandler(getSummary));

clientRoutes.get('/media', asyncHandler(listMedia));
clientRoutes.post('/media/:mediaId/token', asyncHandler(createDownloadToken));
clientRoutes.post('/media/:mediaId/approve', asyncHandler(approveMedia));
clientRoutes.post('/media/:mediaId/reject', asyncHandler(rejectMedia));

clientRoutes.get('/training/tracks', asyncHandler(listTrainingTracks));
clientRoutes.post('/training/progress', asyncHandler(saveProgress));

clientRoutes.get('/results', asyncHandler(listResults));
clientRoutes.post('/results', asyncHandler(registerResult));

clientRoutes.get('/reports', asyncHandler(listReports));
clientRoutes.get('/reports/:reportId', asyncHandler(getReport));

clientRoutes.get('/leads', asyncHandler(listLeads));
clientRoutes.post('/leads', asyncHandler(createLead));

clientRoutes.get('/notifications', asyncHandler(listNotifications));
clientRoutes.post('/notifications/:notificationId/read', asyncHandler(markNotificationAsRead));

// Users list
clientRoutes.get('/users', asyncHandler(listUsers));

// Task routes (view only for clients, except comments)
clientRoutes.get('/tasks', asyncHandler(listTasks));
clientRoutes.get('/tasks/:taskId', asyncHandler(getTask));
clientRoutes.post('/tasks/:taskId/comments', asyncHandler(addComment));
clientRoutes.patch('/tasks/checklist/:itemId', asyncHandler(updateChecklistItem));

// Facebook Ads integration
clientRoutes.post('/facebook/sync', asyncHandler(syncCampaigns));

// Ceniq AI stand design
clientRoutes.post('/ceniq', asyncHandler(ceniqChat));

// Linked CRM opportunities (directed to this client by admin)
clientRoutes.get('/linked-opportunities', asyncHandler(listLinkedOpportunities));

// Stand Progress Tracker
clientRoutes.get('/stand-updates', asyncHandler(getClientStandUpdates));
clientRoutes.post('/stand-updates/:id/comments', asyncHandler(addClientStandComment));

export default clientRoutes;

