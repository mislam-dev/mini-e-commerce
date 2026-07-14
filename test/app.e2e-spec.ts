import { Test, TestingModule } from '@nestjs/testing';
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'ORDER_1234',
}));
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserService } from './../src/core/user/user.service';
import { User, UserRole } from './../src/core/user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('App Flow (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let customerToken: string;
  let categoryId: string;
  let productId: string;
  let orderId: string;

  const adminEmail = `admin${Date.now()}@gmail.com`;
  const customerEmail = `customer${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    process.env.BKASH_BASE_URL = 'http://localhost';
    process.env.BKASH_USERNAME = 'user';
    process.env.BKASH_PASSWORD = 'password';
    process.env.BKASH_APP_KEY = 'appkey';
    process.env.BKASH_APP_SECRET = 'appsecret';

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id_token: 'fake_id_token',
        bkashURL: 'http://fake-bkash-url',
        paymentID: 'fake_payment_id',
      }),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. should register a new admin user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Admin Test',
        email: adminEmail,
        password: testPassword,
        role: 'admin',
      });
      
    if (res.status !== 201) console.log(res.body);
    expect(res.status).toBe(201);
  });

  it('2. should make the user admin and login to get JWT token', async () => {
    // Make the user an admin
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    await userRepo.update({ email: adminEmail }, { role: UserRole.ADMIN });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: testPassword,
      });

    if (res.status !== 200) console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    adminToken = res.body.access_token;
  });

  it('2.5 should register and login a customer', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Customer Test',
        email: customerEmail,
        password: testPassword,
      });
    expect(regRes.status).toBe(201);

    const logRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: customerEmail,
        password: testPassword,
      });
    expect(logRes.status).toBe(200);
    customerToken = logRes.body.access_token;
  });

  it('3. should create a category', async () => {
    const res = await request(app.getHttpServer())
      .post('/category')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Category',
      });
      
    if (res.status !== 201) console.log(res.body);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    categoryId = res.body.id;
  });

  it('4. should create a product', async () => {
    const res = await request(app.getHttpServer())
      .post('/product')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Product',
        description: 'Test product',
        price: 1500,
        stockQuantity: 10,
        sku: `SKU-${Date.now()}`,
        categoryId: categoryId,
        status: 'active',
      });
      
    if (res.status !== 201) console.log(res.body);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    productId = res.body.id;
  });

  it('5. should add product to cart', async () => {
    const res = await request(app.getHttpServer())
      .post('/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: productId,
        quantity: 2,
      });
      
    if (res.status !== 201) console.log(res.body);
    expect(res.status).toBe(201);
  });

  it('6. should create an order from cart', async () => {
    const res = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
      
    if (res.status !== 201) console.log(res.body);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.totalAmount).toEqual(3000);
    orderId = res.body.id;
  });

  it('7. should initiate payment for the order', async () => {
    const res = await request(app.getHttpServer())
      .post('/payment/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: orderId,
        provider: 'bkash', // Assuming we are using bkash
      });

    if (res.status !== 201) console.log(res.body);
    expect(res.status).toBe(201);
    expect(res.body.url).toBeDefined();
    expect(res.body.tran_id).toBeDefined();
  });
});
