import Router from 'express';
import ClienteRouter from './cliente.routes'
import ArquivosRouter from './arquivos.routes'

const router = Router();

router.use('/cliente', ClienteRouter)
router.use('/arquivos', ArquivosRouter)

export default router;
