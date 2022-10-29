import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TokenPackageModule } from '../src/modules/wallet-packages/wallet-package.module';

import { dropDatabase, getAuthToken } from './utils';

require('dotenv').config();

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let authToken;
  // let userId;

  beforeAll(async () => {
    await dropDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TokenPackageModule
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await dropDatabase();
  });

  it('Should get user details', async () => {
    const response = await request(app.getHttpServer())
      .get('/wallet-package')
      .set('authorization', authToken)
      .expect(200);

    const { body } = response;
    expect(body).toHaveProperty('data');
    // expect(body.data).toHaveLength(1);
  });
});
