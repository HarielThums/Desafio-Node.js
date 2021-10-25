import ClienteService from '@services/ClienteService';
import { Request, Response } from 'express';

class ClienteContoller {
  async findById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const formato = req.query.formato;

      const service = ClienteService;

      let result;

      if (formato === 'excel') {
        result = await service.generateExcel(Number(id));
      } else {
        result = await service.findById(Number(id));
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { nome, telefone, cpf } = req.body;

      const service = ClienteService;

      const result = await service.create(nome, telefone, cpf);

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { nome, telefone, cpf } = req.body;
      const id = req.params.id;

      const service = ClienteService;

      const result = await service.update(Number(id), cpf, nome, telefone);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async generatePdf(req: Request, res: Response) {
    try {
      const service = ClienteService;

      const result = await service.generatePdf();

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async sellerValidate(req: Request, res: Response) {
    try {
      const service = ClienteService;

      const result = await service.sellerValidate(req.params.id);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new ClienteContoller();
