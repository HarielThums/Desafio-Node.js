import ClienteContoller from '@controllers/ClienteContoller';
import Router from 'express';

const router = Router();

router.post('/', ClienteContoller.create);
router.get('/:id/gerar-vendas', ClienteContoller.findById);
router.get('/:id/validar-vendas', ClienteContoller.sellerValidate);
router.get('/todas-vendas-pdf', ClienteContoller.generatePdf);
router.put('/:id', ClienteContoller.update);

export default router;
