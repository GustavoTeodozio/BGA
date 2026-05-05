import { Router } from 'express';

import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import adminRoutes from './admin.routes';
import vendedorRoutes from './vendedor.routes';
import projetistaRoutes from './projetista.routes';
import crmRoutes from './crm.routes';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/client', clientRoutes);
routes.use('/admin', adminRoutes);
routes.use('/vendedor', vendedorRoutes);
routes.use('/projetista', projetistaRoutes);
routes.use('/crm', crmRoutes);

export default routes;
