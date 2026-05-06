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

// Membros da equipe (para compartilhamento de notas)
projetistaRoutes.get('/team-members', asyncHandler(listTeamMembers));

// Ceniq AI stand design
projetistaRoutes.post('/ceniq', asyncHandler(ceniqChat));

export default projetistaRoutes;
