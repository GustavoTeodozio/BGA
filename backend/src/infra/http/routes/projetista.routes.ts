import { Router } from 'express';

import { ensureAuthenticated, authorizeRoles } from '../middlewares/auth';
import asyncHandler from '../middlewares/async-handler';
import upload from '../middlewares/upload';
import { ceniqChat } from '../controllers/ceniq.controller';
import { updateProfile, listTeamMembers } from '../controllers/users.controller';
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
} from '../controllers/notes.controller';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  uploadFile,
  deleteFile,
  getProjetistaStats,
} from '../controllers/projects.controller';
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

const projetistaRoutes = Router();

projetistaRoutes.use(ensureAuthenticated, authorizeRoles('PROJETISTA'));

projetistaRoutes.patch('/profile', asyncHandler(updateProfile));

// Dashboard
projetistaRoutes.get('/dashboard', asyncHandler(getProjetistaStats));

// Notes
projetistaRoutes.get('/notes', asyncHandler(listNotes));
projetistaRoutes.get('/notes/:noteId', asyncHandler(getNote));
projetistaRoutes.post('/notes', asyncHandler(createNote));
projetistaRoutes.patch('/notes/:noteId', asyncHandler(updateNote));
projetistaRoutes.delete('/notes/:noteId', asyncHandler(deleteNote));
projetistaRoutes.patch('/notes/:noteId/pin', asyncHandler(togglePin));

// Projects
projetistaRoutes.get('/projects', asyncHandler(listProjects));
projetistaRoutes.get('/projects/:projectId', asyncHandler(getProject));
projetistaRoutes.post('/projects', asyncHandler(createProject));
projetistaRoutes.patch('/projects/:projectId', asyncHandler(updateProject));
projetistaRoutes.delete('/projects/:projectId', asyncHandler(deleteProject));
projetistaRoutes.post('/projects/:projectId/files', upload.single('file'), asyncHandler(uploadFile));
projetistaRoutes.delete('/projects/files/:fileId', asyncHandler(deleteFile));

// Tasks/Kanban
projetistaRoutes.get('/tasks', asyncHandler(listTasks));
projetistaRoutes.get('/tasks/:taskId', asyncHandler(getTask));
projetistaRoutes.post('/tasks', asyncHandler(createTask));
projetistaRoutes.patch('/tasks/:taskId', asyncHandler(updateTask));
projetistaRoutes.delete('/tasks/:taskId', asyncHandler(deleteTask));
projetistaRoutes.post('/tasks/:taskId/comments', asyncHandler(addComment));
projetistaRoutes.delete('/tasks/comments/:commentId', asyncHandler(deleteComment));
projetistaRoutes.post('/tasks/:taskId/checklist', asyncHandler(addChecklistItem));
projetistaRoutes.patch('/tasks/checklist/:itemId', asyncHandler(updateChecklistItem));
projetistaRoutes.delete('/tasks/checklist/:itemId', asyncHandler(deleteChecklistItem));
projetistaRoutes.post('/tasks/:taskId/attachments', asyncHandler(addAttachment));
projetistaRoutes.delete('/tasks/attachments/:attachmentId', asyncHandler(deleteAttachment));
projetistaRoutes.patch('/tasks/:taskId/metrics', asyncHandler(updateMetrics));
projetistaRoutes.post('/tasks/positions', asyncHandler(updatePositions));

// Membros da equipe (para compartilhamento de notas)
projetistaRoutes.get('/team-members', asyncHandler(listTeamMembers));

// Ceniq AI stand design
projetistaRoutes.post('/ceniq', asyncHandler(ceniqChat));

export default projetistaRoutes;
