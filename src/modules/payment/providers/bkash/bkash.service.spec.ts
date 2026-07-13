import { Test, TestingModule } from '@nestjs/testing';
import { BkashService } from './bkash.service';
import { BKASH_OPTIONS } from './bkash.constant';
import { InternalServerErrorException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('BkashService', () => {
  let service: BkashService;
  let cacheManager: any;

  const mockOptions = {
    username: 'user',
    password: 'password',
    appKey: 'appKey',
    appSecret: 'appSecret',
    baseUrl: 'http://bkash.com',
    callbackUrl: 'http://callback',
  };

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BkashService,
        { provide: BKASH_OPTIONS, useValue: mockOptions },
        { provide: CACHE_MANAGER, useValue: cacheManager },
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
    it('should successfully grant a token and cache it if not in cache', async () => {
      cacheManager.get.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: 'id_token_123', refresh_token: 'refresh_token_123', statusCode: '0000', expires_in: 3600 }),
      });

      await service.grantToken();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://bkash.com/tokenized/checkout/token/grant',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      expect(cacheManager.set).toHaveBeenCalledWith('bkash:id_token', 'id_token_123', 3600000);
      expect(cacheManager.set).toHaveBeenCalledWith('bkash:refresh_token', 'refresh_token_123', 3600000);
    });

    it('should use cached token if available', async () => {
      cacheManager.get.mockImplementation((key: string) => {
        if (key === 'bkash:id_token') return Promise.resolve('cached_id_token');
        if (key === 'bkash:refresh_token') return Promise.resolve('cached_refresh_token');
        return Promise.resolve(null);
      });

      await service.grantToken();

      expect(global.fetch).not.toHaveBeenCalled();
      expect((service as any).idToken).toBe('cached_id_token');
      expect((service as any).refreshToken).toBe('cached_refresh_token');
    });

    it('should throw error if API fails', async () => {
      cacheManager.get.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error',
      });

      await expect(service.grantToken()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('request token invalidation', () => {
    it('should invalidate cache and retry if API returns 2062 token invalid error', async () => {
      // Mock initial valid state
      (service as any).idToken = 'invalid_token';
      
      // 1st request fails with 2062, 2nd auth request succeeds, 3rd retry request succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ statusCode: '2062', statusMessage: 'Token Expired' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id_token: 'new_token', refresh_token: 'new_refresh', statusCode: '0000', expires_in: 3600 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bkashURL: 'http://pay-retry', statusCode: '0000' }),
        });

      const result = await service.createPayment({ payerReference: '1', amount: '100', currency: 'BDT', intent: 'sale', merchantInvoiceNumber: 'INV123' });

      expect(cacheManager.del).toHaveBeenCalledWith('bkash:id_token');
      expect(cacheManager.del).toHaveBeenCalledWith('bkash:refresh_token');
      expect(result.bkashURL).toBe('http://pay-retry');
    });
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      cacheManager.get.mockResolvedValue(null);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id_token: 'id_token_123', statusCode: '0000', expires_in: 3600 }),
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
