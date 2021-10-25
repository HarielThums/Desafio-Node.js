import ArquivosController from '@controllers/ArquivosController';
import Router from 'express';

const router = Router();

router.get('/:arquivo', ArquivosController.download);

export default router;
