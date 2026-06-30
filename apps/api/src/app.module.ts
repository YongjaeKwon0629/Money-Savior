import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FinanceCalculator } from './domain/calculators/finance-calculator';
import { RecommendationActionFactory } from './domain/factories/recommendation-action.factory';
import { ExceptionPolicyEngine } from './domain/policies/exception-policy-engine';
import { RecommendationEngine } from './domain/recommenders/recommendation-engine';
import { FinancialInputsController } from './financial-inputs/financial-inputs.controller';
import { FinancialInputsService } from './financial-inputs/financial-inputs.service';
import { LedgerEntriesController } from './ledger-entries/ledger-entries.controller';
import { LedgerEntriesService } from './ledger-entries/ledger-entries.service';
import { RecommendationsController } from './recommendations/recommendations.controller';
import { LedgerEntryRepository } from './repositories/ledger-entry.repository';
import { MonthlyFinanceInputRepository } from './repositories/monthly-finance-input.repository';
import { RecommendationResultRepository } from './repositories/recommendation-result.repository';
import { SavedRecommendationPlanRepository } from './repositories/saved-recommendation-plan.repository';
import { SavedPlansController } from './saved-plans/saved-plans.controller';
import { SavedPlansService } from './saved-plans/saved-plans.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AppController,
    FinancialInputsController,
    RecommendationsController,
    SavedPlansController,
    LedgerEntriesController,
  ],
  providers: [
    AppService,
    FinanceCalculator,
    RecommendationEngine,
    ExceptionPolicyEngine,
    RecommendationActionFactory,
    FinancialInputsService,
    SavedPlansService,
    LedgerEntriesService,
    LedgerEntryRepository,
    MonthlyFinanceInputRepository,
    RecommendationResultRepository,
    SavedRecommendationPlanRepository,
  ],
})
export class AppModule {}
