import { Router } from 'express';
import { ensureAuthenticated, authorizeRoles } from '../middlewares/auth';
import asyncHandler from '../middlewares/async-handler';
import {
  listOpportunities,
  createOpportunity,
  getOpportunity,
  updateOpportunity,
  deleteOpportunity,
  createActivity,
  updateActivity,
  deleteActivity,
  completeActivity,
  getAgenda,
  getActivityHistory,
  getCRMStats,
} from '../controllers/crm.controller';
import { getCrmConfig, updateCrmConfig } from '../controllers/crm-config.controller';

const crmRoutes = Router();

crmRoutes.use(ensureAuthenticated, authorizeRoles('ADMIN', 'VENDEDOR'));

// Config (stages & activity types)
crmRoutes.get('/config', asyncHandler(getCrmConfig));
crmRoutes.patch('/config', asyncHandler(updateCrmConfig));

// Stats, Agenda & History
crmRoutes.get('/stats', asyncHandler(getCRMStats));
crmRoutes.get('/agenda', asyncHandler(getAgenda));
crmRoutes.get('/history', asyncHandler(getActivityHistory));

// Opportunities
crmRoutes.get('/opportunities', asyncHandler(listOpportunities));
crmRoutes.post('/opportunities', asyncHandler(createOpportunity));
crmRoutes.get('/opportunities/:id', asyncHandler(getOpportunity));
crmRoutes.patch('/opportunities/:id', asyncHandler(updateOpportunity));
crmRoutes.delete('/opportunities/:id', asyncHandler(deleteOpportunity));

// Activities (nested under opportunity)
crmRoutes.post('/opportunities/:opportunityId/activities', asyncHandler(createActivity));
crmRoutes.patch('/opportunities/:opportunityId/activities/:activityId', asyncHandler(updateActivity));
crmRoutes.delete('/opportunities/:opportunityId/activities/:activityId', asyncHandler(deleteActivity));
crmRoutes.post('/opportunities/:opportunityId/activities/:activityId/complete', asyncHandler(completeActivity));

export default crmRoutes;
