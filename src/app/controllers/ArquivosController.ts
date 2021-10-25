import ArquivosService from '@services/ArquivosService';
import { Request, Response } from 'express';

class ArquivoContoller {
  async download(req: Request, res: Response) {
    try {
      const arquivo = req.params.arquivo;

      return res.status(200).download(`./uploads/${arquivo}`);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new ArquivoContoller();
