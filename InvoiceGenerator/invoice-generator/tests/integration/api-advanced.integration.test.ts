import request from 'supertest';
import { Invoice, InvoiceRequest } from '../../src/types/invoice';

// Mock API server for integration testing
const mockInvoices: Invoice[] = [];
let nextId = 1;

const mockServer = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Mock Express app
const app = {
  get: mockServer.get,
  post: mockServer.post,
  put: mockServer.put,
  delete: mockServer.delete,
};

describe('Advanced API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoices.length = 0;
    nextId = 1;
  });

  describe('Invoice Numbering Integration', () => {
    it('should generate sequential invoice numbers', async () => {
      const invoiceRequest: InvoiceRequest = {
        client: {
          name: 'Test Client',
          email: 'test@example.com',
          address: '123 Test St',
          phone: '123-456-7890',
        },
        items: [
          {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 100,
          },
        ],
        taxRate: 10,
      };

      // Mock POST /api/v1/invoices
      mockServer.post.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const invoice: Invoice = {
          id: `INV-${nextId++}`,
          invoiceNumber: `INV-${Date.now()}-${nextId}`,
          client: invoiceRequest.client,
          items: invoiceRequest.items.map((item, index) => ({
            id: `item-${index}`,
            ...item,
            lineTotal: item.quantity * item.unitPrice,
          })),
          subtotal: 100,
          taxAmount: 10,
          total: 110,
          taxRate: invoiceRequest.taxRate || 0,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
        };
        
        mockInvoices.push(invoice);
        res.status(201).json(invoice);
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .send(invoiceRequest)
        .expect(201);

      expect(response.body.invoiceNumber).toMatch(/^INV-\d+-\d+$/);
      expect(mockInvoices).toHaveLength(1);
    });
  });

  describe('Due Date Tracking Integration', () => {
    it('should handle overdue invoice detection', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const overdueInvoice: Invoice = {
        id: '1',
        invoiceNumber: 'INV-001',
        client: {
          name: 'Overdue Client',
          email: 'overdue@example.com',
          address: '123 Overdue St',
          phone: '123-456-7890',
        },
        items: [
          {
            id: '1',
            description: 'Overdue Item',
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
          },
        ],
        subtotal: 100,
        taxAmount: 10,
        total: 110,
        taxRate: 10,
        date: '2024-01-01',
        dueDate: pastDate.toISOString().split('T')[0],
        status: 'sent',
      };

      mockInvoices.push(overdueInvoice);

      // Mock GET /api/v1/invoices with overdue filter
      mockServer.get.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const { status } = req.query;
        let filteredInvoices = mockInvoices;

        if (status === 'overdue') {
          const today = new Date();
          filteredInvoices = mockInvoices.filter(invoice => {
            if (!invoice.dueDate || invoice.status === 'paid' || invoice.status === 'draft') {
              return false;
            }
            const dueDate = new Date(invoice.dueDate);
            return dueDate < today;
          });
        }

        res.json({
          invoices: filteredInvoices,
          total: filteredInvoices.length,
          page: 1,
          totalPages: 1,
        });
      };

      const response = await request(app)
        .get('/api/v1/invoices?status=overdue')
        .expect(200);

      expect(response.body.invoices).toHaveLength(1);
      expect(response.body.invoices[0].invoiceNumber).toBe('INV-001');
    });
  });

  describe('Status Management Integration', () => {
    it('should update invoice status', async () => {
      const invoice: Invoice = {
        id: '1',
        invoiceNumber: 'INV-001',
        client: {
          name: 'Test Client',
          email: 'test@example.com',
          address: '123 Test St',
          phone: '123-456-7890',
        },
        items: [
          {
            id: '1',
            description: 'Test Item',
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
          },
        ],
        subtotal: 100,
        taxAmount: 10,
        total: 110,
        taxRate: 10,
        date: '2024-01-01',
        dueDate: '2024-01-31',
        status: 'draft',
      };

      mockInvoices.push(invoice);

      // Mock PUT /api/v1/invoices/:id
      mockServer.put.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices/:id') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const { id } = req.params;
        const { status } = req.body;
        
        const invoiceIndex = mockInvoices.findIndex(inv => inv.id === id);
        if (invoiceIndex === -1) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        mockInvoices[invoiceIndex] = { ...mockInvoices[invoiceIndex], status };
        res.json(mockInvoices[invoiceIndex]);
      };

      const response = await request(app)
        .put('/api/v1/invoices/1')
        .send({ status: 'sent' })
        .expect(200);

      expect(response.body.status).toBe('sent');
      expect(mockInvoices[0].status).toBe('sent');
    });
  });

  describe('Bulk Operations Integration', () => {
    beforeEach(() => {
      // Add multiple invoices for bulk operations
      for (let i = 1; i <= 3; i++) {
        mockInvoices.push({
          id: i.toString(),
          invoiceNumber: `INV-00${i}`,
          client: {
            name: `Client ${i}`,
            email: `client${i}@example.com`,
            address: `${i}23 Test St`,
            phone: '123-456-7890',
          },
          items: [
            {
              id: i.toString(),
              description: `Item ${i}`,
              quantity: 1,
              unitPrice: 100 * i,
              lineTotal: 100 * i,
            },
          ],
          subtotal: 100 * i,
          taxAmount: 10 * i,
          total: 110 * i,
          taxRate: 10,
          date: '2024-01-01',
          dueDate: '2024-01-31',
          status: 'sent',
        });
      }
    });

    it('should handle bulk delete operations', async () => {
      // Mock POST /api/v1/invoices/bulk-delete
      mockServer.post.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices/bulk-delete') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const { invoiceIds } = req.body;
        const deletedCount = invoiceIds.length;
        
        // Remove invoices from mock array
        invoiceIds.forEach((id: string) => {
          const index = mockInvoices.findIndex(inv => inv.id === id);
          if (index !== -1) {
            mockInvoices.splice(index, 1);
          }
        });

        res.json({
          deleted: deletedCount,
          failed: 0,
        });
      };

      const response = await request(app)
        .post('/api/v1/invoices/bulk-delete')
        .send({ invoiceIds: ['1', '2'] })
        .expect(200);

      expect(response.body.deleted).toBe(2);
      expect(mockInvoices).toHaveLength(1);
    });

    it('should handle bulk status update operations', async () => {
      // Mock POST /api/v1/invoices/bulk-update
      mockServer.post.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices/bulk-update') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const { invoiceIds, updates } = req.body;
        let updatedCount = 0;
        
        invoiceIds.forEach((id: string) => {
          const index = mockInvoices.findIndex(inv => inv.id === id);
          if (index !== -1) {
            mockInvoices[index] = { ...mockInvoices[index], ...updates };
            updatedCount++;
          }
        });

        res.json({
          updated: updatedCount,
          failed: invoiceIds.length - updatedCount,
        });
      };

      const response = await request(app)
        .post('/api/v1/invoices/bulk-update')
        .send({ 
          invoiceIds: ['1', '2'], 
          updates: { status: 'paid' } 
        })
        .expect(200);

      expect(response.body.updated).toBe(2);
      expect(mockInvoices[0].status).toBe('paid');
      expect(mockInvoices[1].status).toBe('paid');
    });
  });

  describe('Export Operations Integration', () => {
    beforeEach(() => {
      // Add test invoices
      mockInvoices.push(
        {
          id: '1',
          invoiceNumber: 'INV-001',
          client: {
            name: 'Client 1',
            email: 'client1@example.com',
            address: '123 Test St',
            phone: '123-456-7890',
          },
          items: [
            {
              id: '1',
              description: 'Item 1',
              quantity: 1,
              unitPrice: 100,
              lineTotal: 100,
            },
          ],
          subtotal: 100,
          taxAmount: 10,
          total: 110,
          taxRate: 10,
          date: '2024-01-01',
          dueDate: '2024-01-31',
          status: 'sent',
        }
      );
    });

    it('should handle CSV export', async () => {
      // Mock GET /api/v1/invoices/export/csv
      mockServer.get.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices/export/csv') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const csvContent = 'Invoice Number,Client Name,Total,Status\nINV-001,Client 1,110,sent\n';
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
        res.send(csvContent);
      };

      const response = await request(app)
        .get('/api/v1/invoices/export/csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('INV-001,Client 1,110,sent');
    });

    it('should handle JSON export', async () => {
      // Mock GET /api/v1/invoices/export/json
      mockServer.get.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices/export/json') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices.json"');
        res.json(mockInvoices);
      };

      const response = await request(app)
        .get('/api/v1/invoices/export/json')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toHaveLength(1);
      expect(response.body[0].invoiceNumber).toBe('INV-001');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid invoice data', async () => {
      // Mock POST /api/v1/invoices with validation
      mockServer.post.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const { client, items } = req.body;
        
        if (!client?.name || !client?.email) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'Client name and email are required',
            field: 'client',
            code: 'VALIDATION_ERROR',
          });
        }

        if (!items || items.length === 0) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'At least one item is required',
            field: 'items',
            code: 'VALIDATION_ERROR',
          });
        }

        res.status(201).json({ id: '1', ...req.body });
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .send({
          client: { name: 'Test Client' }, // Missing email
          items: [],
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.field).toBe('client');
    });

    it('should handle not found errors', async () => {
      // Mock GET /api/v1/invoices/:id
      mockServer.get.mockImplementation((path, handler) => {
        if (path === '/api/v1/invoices/:id') {
          return handler;
        }
      });

      const handler = (req: any, res: any) => {
        const { id } = req.params;
        const invoice = mockInvoices.find(inv => inv.id === id);
        
        if (!invoice) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Invoice not found',
            code: 'NOT_FOUND',
          });
        }

        res.json(invoice);
      };

      const response = await request(app)
        .get('/api/v1/invoices/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });
});
