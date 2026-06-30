import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { FinancialInputsController } from '../src/financial-inputs/financial-inputs.controller';
import { FinancialInputsService } from '../src/financial-inputs/financial-inputs.service';
import { LedgerEntriesController } from '../src/ledger-entries/ledger-entries.controller';
import { LedgerEntriesService } from '../src/ledger-entries/ledger-entries.service';
import { RecommendationsController } from '../src/recommendations/recommendations.controller';
import { SavedPlansController } from '../src/saved-plans/saved-plans.controller';
import { SavedPlansService } from '../src/saved-plans/saved-plans.service';

describe('API contract (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const authServiceMock = {
    signup: jest.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Tester',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    }),
    login: jest.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Tester',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    }),
    refresh: jest.fn().mockResolvedValue({
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    getMe: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Tester',
    }),
  };

  const recommendationPayload = {
    inputId: 1,
    recommendationId: 1,
    targetMonth: '2026-06',
    summary: {
      monthlyIncome: 2500000,
      fixedExpense: 900000,
      variableExpense: 1100000,
      surplusAmount: 500000,
      emergencyFundStatus: 'INSUFFICIENT',
    },
    savingAmounts: {
      safe: 250000,
      recommended: 350000,
      challenge: 450000,
    },
    recommendation: {
      type: 'BALANCED_SAVING',
      parkingAccountAmount: 105000,
      installmentSavingsAmount: 140000,
      isaAmount: 105000,
      investmentAmount: 0,
    },
    reasons: ['추천 사유 1', '추천 사유 2', '추천 사유 3'],
    cautions: ['주의 사항 1', '주의 사항 2'],
    actions: [
      { type: 'SAVE_PLAN', label: '추천 계획 저장하기' },
      { type: 'RETRY_DIAGNOSIS', label: '다시 진단하기' },
    ],
  };

  const financialInputsServiceMock = {
    create: jest.fn().mockResolvedValue(recommendationPayload),
    update: jest.fn().mockResolvedValue({
      ...recommendationPayload,
      targetMonth: '2026-07',
      summary: {
        ...recommendationPayload.summary,
        monthlyIncome: 2600000,
        fixedExpense: 950000,
        variableExpense: 1000000,
        surplusAmount: 650000,
      },
      savingAmounts: {
        safe: 325000,
        recommended: 455000,
        challenge: 585000,
      },
    }),
    findInputById: jest.fn().mockResolvedValue({
      id: 1,
      targetMonth: '2026-06',
      monthlyIncome: 2500000,
      paydayDay: 25,
      fixedExpense: 900000,
      variableExpense: 1100000,
      emergencyFundAmount: 300000,
      savingGoal: 'EMERGENCY_FUND',
      savingPreference: 'BALANCED',
    }),
    findInputByMonth: jest.fn().mockResolvedValue({
      inputId: 1,
      targetMonth: '2026-06',
      recommendationId: 1,
      hasRecommendation: true,
      summary: {
        monthlyIncome: 2500000,
        fixedExpense: 900000,
        variableExpense: 1100000,
        surplusAmount: 500000,
      },
      recommendation: {
        recommendedType: 'BALANCED_SAVING',
        recommendedSavingAmount: 350000,
      },
    }),
    findRecommendationByInputId: jest
      .fn()
      .mockResolvedValue(recommendationPayload),
  };

  const savedPlansServiceMock = {
    save: jest.fn().mockResolvedValue({
      planId: 1,
      inputId: 1,
      recommendationId: 1,
      targetMonth: '2026-06',
      recommendedType: 'BALANCED_SAVING',
      recommendedSavingAmount: 350000,
      surplusAmount: 500000,
      savedAt: '2026-06-25T12:00:00.000Z',
    }),
    findAll: jest.fn().mockResolvedValue([
      {
        planId: 1,
        inputId: 1,
        recommendationId: 1,
        targetMonth: '2026-06',
        recommendedType: 'BALANCED_SAVING',
        recommendedSavingAmount: 350000,
        surplusAmount: 500000,
        savedAt: '2026-06-25T12:00:00.000Z',
      },
    ]),
    remove: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const ledgerEntriesServiceMock = {
    create: jest.fn().mockResolvedValue({
      entryId: 1,
      targetMonth: '2026-06',
      entryDate: '2026-06-24T00:00:00.000Z',
      type: 'EXPENSE',
      category: '식비',
      amount: 15000,
      memo: '점심',
      isFixed: false,
      createdAt: '2026-06-25T12:00:00.000Z',
      updatedAt: '2026-06-25T12:00:00.000Z',
    }),
    findAll: jest.fn().mockResolvedValue([
      {
        entryId: 1,
        targetMonth: '2026-06',
        entryDate: '2026-06-24T00:00:00.000Z',
        type: 'EXPENSE',
        category: '식비',
        amount: 15000,
        memo: '점심',
        isFixed: false,
        createdAt: '2026-06-25T12:00:00.000Z',
        updatedAt: '2026-06-25T12:00:00.000Z',
      },
    ]),
    summarize: jest.fn().mockResolvedValue({
      targetMonth: '2026-06',
      totals: {
        income: 2500000,
        expense: 115000,
        fixedExpense: 100000,
        variableExpense: 15000,
        balance: 2385000,
      },
      categoryBreakdown: [
        {
          category: '식비',
          amount: 15000,
          percentage: 13,
        },
        {
          category: '월세',
          amount: 100000,
          percentage: 87,
        },
      ],
      entryCount: 2,
    }),
    update: jest.fn().mockResolvedValue({
      entryId: 1,
      targetMonth: '2026-06',
      entryDate: '2026-06-24T00:00:00.000Z',
      type: 'EXPENSE',
      category: '식비',
      amount: 18000,
      memo: '점심 수정',
      isFixed: false,
      createdAt: '2026-06-25T12:00:00.000Z',
      updatedAt: '2026-06-25T12:30:00.000Z',
    }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({})],
      controllers: [
        AuthController,
        FinancialInputsController,
        RecommendationsController,
        SavedPlansController,
        LedgerEntriesController,
      ],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        JwtService,
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: FinancialInputsService,
          useValue: financialInputsServiceMock,
        },
        {
          provide: SavedPlansService,
          useValue: savedPlansServiceMock,
        },
        {
          provide: LedgerEntriesService,
          useValue: ledgerEntriesServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const jwtService = moduleFixture.get(JwtService);
    accessToken = await jwtService.signAsync(
      { sub: 1, email: 'test@example.com' },
      { secret: 'money-coach-access-secret' },
    );

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('POST /api/v1/auth/signup', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Tester',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  it('POST /api/v1/auth/login', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens.accessToken).toBe('access-token');
  });

  it('GET /api/v1/auth/me', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
  });

  it('POST /api/v1/financial-inputs', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/financial-inputs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetMonth: '2026-06',
        monthlyIncome: 2500000,
        paydayDay: 25,
        fixedExpense: 900000,
        variableExpense: 1100000,
        emergencyFundAmount: 300000,
        savingGoal: 'EMERGENCY_FUND',
        savingPreference: 'BALANCED',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.inputId).toBe(1);
  });

  it('GET /api/v1/financial-inputs/month/:targetMonth', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/financial-inputs/month/2026-06')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.inputId).toBe(1);
    expect(response.body.data.hasRecommendation).toBe(true);
    expect(response.body.data.recommendation.recommendedSavingAmount).toBe(350000);
  });

  it('PUT /api/v1/financial-inputs/:inputId', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/v1/financial-inputs/1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetMonth: '2026-07',
        monthlyIncome: 2600000,
        paydayDay: 25,
        fixedExpense: 950000,
        variableExpense: 1000000,
        emergencyFundAmount: 400000,
        savingGoal: 'EMERGENCY_FUND',
        savingPreference: 'BALANCED',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      '입력값이 수정되고 추천 결과가 갱신되었습니다.',
    );
  });

  it('GET /api/v1/recommendations/:inputId', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/recommendations/1')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.recommendationId).toBe(1);
  });

  it('POST /api/v1/saved-plans', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/saved-plans')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ inputId: 1 })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.planId).toBe(1);
  });

  it('GET /api/v1/saved-plans', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/saved-plans')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it('POST /api/v1/ledger-entries', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ledger-entries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetMonth: '2026-06',
        entryDate: '2026-06-24',
        type: 'EXPENSE',
        category: '식비',
        amount: 15000,
        memo: '점심',
        isFixed: false,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.entryId).toBe(1);
  });

  it('GET /api/v1/ledger-entries?targetMonth=2026-06', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/ledger-entries?targetMonth=2026-06')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it('GET /api/v1/ledger-entries/summary?targetMonth=2026-06', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/ledger-entries/summary?targetMonth=2026-06')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.totals.expense).toBe(115000);
  });

  it('PUT /api/v1/ledger-entries/:entryId', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/v1/ledger-entries/1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        targetMonth: '2026-06',
        entryDate: '2026-06-24',
        type: 'EXPENSE',
        category: '식비',
        amount: 18000,
        memo: '점심 수정',
        isFixed: false,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.amount).toBe(18000);
  });

  it('DELETE /api/v1/ledger-entries/:entryId', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v1/ledger-entries/1')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('가계부 항목이 삭제되었습니다.');
  });
});
