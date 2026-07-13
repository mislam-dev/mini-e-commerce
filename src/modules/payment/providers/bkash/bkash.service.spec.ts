import { Test, TestingModule } from '@nestjs/testing';
import { BkashService } from './bkash.service';
import { BKASH_OPTIONS } from './bkash.constant';
import { InternalServerErrorException } from '@nestjs/common';

describe('BkashService', () => {
  let service: BkashService;

  const mockOptions = {
    username: 'user',
    password: 'password',
    appKey: 'appKey',
    appSecret: 'appSecret',
    baseUrl: 'http://bkash.com',
    callbackUrl: 'http://callback',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BkashService,
        { provide: BKASH_OPTIONS, useValue: mockOptions },
      ],
    }).compile();

    service = module.get<BkashService>(BkashService);

    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('grantToken', () => {
    it('should successfully grant a token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: 'id_token_123', refresh_token: 'refresh_token_123', statusCode: '0000' }),
      });

      await service.grantToken();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://bkash.com/tokenized/checkout/token/grant',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            app_key: 'appKey',
            app_secret: 'appSecret',
          }),
        }),
      );
    });

    it('should throw error if API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error',
      });

      await expect(service.grantToken()).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw error if statusCode is not 0000', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ statusCode: '9999', statusMessage: 'Custom Error' }),
      });

      await expect(service.grantToken()).rejects.toThrow('Custom Error');
    });
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id_token: 'id_token_123', statusCode: '0000' }),
        }) // Auth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bkashURL: 'http://pay', statusCode: '0000' }),
        }); // Create payment

      const result = await service.createPayment({ payerReference: '1', amount: '100', currency: 'BDT', intent: 'sale', merchantInvoiceNumber: 'INV123' });
      
      expect(result.bkashURL).toBe('http://pay');
    });
  });

  describe('executePayment', () => {
    it('should execute a payment', async () => {
      // Mock auth to avoid error
      (service as any).idToken = 'valid_token';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ paymentID: 'PID', trxID: 'TRX', statusCode: '0000' }),
      });

      const result = await service.executePayment('PID');
      expect(result.trxID).toBe('TRX');
    });
  });

  describe('queryPayment', () => {
    it('should query a payment', async () => {
      (service as any).idToken = 'valid_token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ paymentID: 'PID', statusCode: '0000' }),
      });

      const result = await service.queryPayment('PID');
      expect(result.paymentID).toBe('PID');
    });
  });
});
