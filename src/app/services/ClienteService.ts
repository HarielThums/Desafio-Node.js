import prisma from '@database/prisma';
import cpfValidator from '@src/utils/cpfValidator';
import excel from 'excel4node';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import axios from 'axios';

class ClienteService {
  async sellerValidate(id: string) {
    try {
      let response = [];
      const res = await axios.get(`http://localhost:7081/cliente/${id}/gerar-vendas`);

      if (res?.data?.dados) {
        res.data.dados.map((venda, index) => {
          let itensTotalValue = 0;
          venda.itens.map((item) => {
            itensTotalValue += item.valor * item.quantidade;
          });

          if (itensTotalValue === venda.valor_total) {
            response.push({
              id: ++index,
              erro: 0,
              resultado: 'Validado valores iguais',
              valorPago: venda.valor_total,
              valorTotalItens: itensTotalValue,
            });
          } else {
            response.push({
              id: ++index,
              erro: 1,
              resultado: 'Valores divergentes',
              valorPago: venda.valor_total,
              valorTotalItens: itensTotalValue,
            });
          }
        });
      }

      return response.length
        ? { msg: 'Validação de compras ', erro: 0, response }
        : {
            msg: 'Cliente não encontrado',
            erro: 1,
            dados: [
              {
                mensagem: 'Cliente id não encontrado id: ' + id,
              },
            ],
          };
    } catch (error) {
      throw new Error('error on ClienteService: ' + error);
    }
  }

  async findById(id: number) {
    try {
      const cliente = await prisma.clientes.findFirst({ where: { id } });

      if (!cliente) return { mensagem: 'Cliente não encontrado', erro: 1, dados: null };

      const vendasCliente = await prisma.vendas.findMany({ where: { cliente_id: cliente.id } });

      const vendasClienteIds = vendasCliente.map((v) => v.id);

      const vendasItens = await prisma.vendas_itens.findMany({
        where: { venda_id: { in: [...vendasClienteIds] } },
      });

      const dados = vendasCliente.map((venda) => {
        const itens = vendasItens
          .filter((v) => v.venda_id === venda.id)
          .map((v) => ({ nome: v.nome, valor: Number(v.valor), quantidade: v.quantidade }));

        const valor = itens.reduce(
          (acc, elem) => {
            return { y: (acc.y += elem.valor * elem.quantidade) };
          },
          { y: 0 }
        );

        return {
          AtributoJSON: 'Local Mysql',
          cliente_nome: cliente.nome,
          cliente_telefone: cliente.telefone,
          data_compra: venda.data_cadastro.toLocaleDateString('pt-BR'),
          codigo_nota_fiscal: venda.codigo_nota_fiscal,
          valor_total: valor.y,
          itens: itens,
        };
      });

      return { mensagem: 'Vendas carregadas do cliente', erro: 0, dados: dados };
    } catch (error) {
      throw new Error('error on ClienteService: ' + error);
    }
  }

  async create(nome: string, telefone: string, cpf: string) {
    try {
      if (!cpfValidator(cpf)) return { msg: 'CPF não enviado corretamente', erro: 1, dados: [{ mensagem: 'CPF não enviado corretamente' }] };

      const cliente = await prisma.clientes.create({ data: { nome, telefone, cpf, data_cadastro: new Date() } });

      return { msg: 'Cliente inserido com sucesso', erro: 0, dados: { id: cliente.id, nome: cliente.nome } };
    } catch (error) {
      throw new Error('error on ClienteService: ' + error);
    }
  }

  async update(id: number, cpf?: string, nome?: string, telefone?: string) {
    try {
      if (cpf && !cpfValidator(cpf)) {
        return {
          msg: 'CPF não enviado corretamente',
          erro: 1,
          dados: [
            {
              mensagem: 'CPF não enviado corretamente ' + cpf,
            },
          ],
        };
      }

      const user = await prisma.clientes.findFirst({ where: { id } });

      if (!user) {
        return {
          msg: 'Cliente não encontrado ',
          erro: 1,
          dados: [
            {
              mensagem: 'Cliente não encontrado id: ' + id,
            },
          ],
        };
      }

      await prisma.clientes.update({ where: { id: id }, data: { nome, telefone, cpf } });

      return {
        msg: 'Cliente atualizado com sucesso',
        erro: 0,
        dados: {
          id: id,
          nome: nome || user.nome,
        },
      };
    } catch (error) {
      throw new Error('error on ClienteService: ' + error);
    }
  }

  async generateExcel(id: number) {
    try {
      const cliente = await prisma.clientes.findFirst({ where: { id }, select: { nome: true, id: true } });

      if (!cliente) return { mensagem: 'Cliente não encontrado', erro: 1, dados: null };

      const vendasCliente = await prisma.vendas.findMany({
        where: { cliente_id: cliente.id },
        select: { codigo_nota_fiscal: true, data_cadastro: true, valor_pago: true },
      });

      const wb = new excel.Workbook();

      const ws = wb.addWorksheet('Vendas carregadas do cliente');

      const columnsName = ['Cliente Nome', 'Codigo Nota fiscal', 'Data Venda', 'Valor Total'];

      columnsName.map((v, index) => ws.cell(1, ++index).string(v));

      let rowIndex = 2;
      vendasCliente.map((record) => {
        let columnControll = 1;
        ws.cell(rowIndex, columnControll++).string(cliente.nome);
        ws.cell(rowIndex, columnControll++).string(record.codigo_nota_fiscal);
        ws.cell(rowIndex, columnControll++).string(record.data_cadastro.toLocaleDateString('pt-BR'));
        ws.cell(rowIndex, columnControll++).string(Number(record.valor_pago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

        rowIndex++;
      });

      const fileName = Math.random().toString(36).slice(2, 12);

      wb.write(`./uploads/${fileName}.xlsx`);

      return { msg: 'Ok excel gerado ', erro: 0, dados: { url: `./uploads/${fileName}.xlsx` } };
    } catch (error) {
      throw new Error('error on ClienteService: ' + error);
    }
  }

  async generatePdf() {
    try {
      const clientes = await prisma.clientes.findMany({ select: { nome: true, id: true } });

      const vendasClientes = await prisma.vendas.findMany();

      const doc = new PDFDocument();

      const fileName = Math.random().toString(36).slice(2, 12);

      doc.pipe(fs.createWriteStream(`./uploads/${fileName}.pdf`));

      doc
        .fontSize(22)
        .text(`Teste Node - ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' })
        .moveDown();

      let colTop = 120;

      //cabeçalho;
      doc
        .fontSize(14)
        .text('Nome cliente ', 0, colTop, { align: 'center', width: 150 })
        .text('Codigo nota fiscal', 150, colTop, { align: 'center', width: 150 })
        .text('Data venda', 300, colTop, { align: 'center', width: 150 })
        .text('Valor pago', 450, colTop, { align: 'center', width: 150 });

      colTop += 20;

      clientes.map((cliente) => {
        const vendas = vendasClientes.filter((venda) => venda.cliente_id === cliente.id);

        if (vendas.length) {
          vendas.map((venda) => {
            doc
              .fontSize(12)
              .text(cliente.nome.substr(0, 20), 0, colTop, { align: 'center', width: 150 })
              .text(venda.codigo_nota_fiscal, 150, colTop, { align: 'center', width: 150 })
              .text(venda.data_cadastro.toLocaleDateString('pt-BR'), 300, colTop, { align: 'center', width: 150 })
              .text(Number(venda.valor_pago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 450, colTop, {
                align: 'center',
                width: 150,
              });

            colTop += 20;
            vendasClientes.push(venda);
          });
        } else {
          doc
            .fontSize(12)
            .text(cliente.nome.substr(0, 20), 0, colTop, { align: 'center', width: 150 })
            .text(' - ', 150, colTop, { align: 'center', width: 150 })
            .text(' - ', 300, colTop, { align: 'center', width: 150 })
            .text(' - ', 450, colTop, { align: 'center', width: 150 });

          colTop += 20;
        }
      });

      doc.end();

      return { msg: 'Ok pdf gerado ', erro: 0, dados: { url: `./uploads/${fileName}.pdf` } };
    } catch (error) {
      throw new Error('error on ClienteService: ' + error);
    }
  }
}

export default new ClienteService();
