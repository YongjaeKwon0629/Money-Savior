-- CreateEnum
CREATE TYPE "SavingGoal" AS ENUM ('EMERGENCY_FUND', 'LIFE_STABILITY', 'TRAVEL', 'HOUSING_MARRIAGE', 'INVESTMENT_PREP');

-- CreateEnum
CREATE TYPE "SavingPreference" AS ENUM ('STABLE', 'BALANCED', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "SavingsCapacityLevel" AS ENUM ('DEFICIT', 'LOW', 'MID', 'HIGH');

-- CreateEnum
CREATE TYPE "EmergencyFundStatus" AS ENUM ('NONE', 'INSUFFICIENT', 'SUFFICIENT');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('EXPENSE_CONTROL', 'LIQUIDITY_FIRST', 'STABLE_SAVING', 'BALANCED_SAVING', 'DIVERSIFIED_ALLOCATION');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_finance_inputs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetMonth" VARCHAR(7) NOT NULL,
    "monthlyIncome" INTEGER NOT NULL,
    "paydayDay" INTEGER NOT NULL,
    "fixedExpense" INTEGER NOT NULL,
    "variableExpense" INTEGER NOT NULL,
    "emergencyFundAmount" INTEGER NOT NULL,
    "savingGoal" "SavingGoal" NOT NULL,
    "savingPreference" "SavingPreference" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_finance_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_results" (
    "id" SERIAL NOT NULL,
    "monthlyFinanceInputId" INTEGER NOT NULL,
    "surplusAmount" INTEGER NOT NULL,
    "fixedExpenseRatio" DECIMAL(5,2) NOT NULL,
    "livingCostBase" INTEGER NOT NULL,
    "emergencyFundTarget" INTEGER NOT NULL,
    "emergencyFundRatio" DECIMAL(7,2) NOT NULL,
    "savingsCapacityLevel" "SavingsCapacityLevel" NOT NULL,
    "emergencyFundStatus" "EmergencyFundStatus" NOT NULL,
    "recommendedType" "RecommendationType" NOT NULL,
    "safeSavingAmount" INTEGER NOT NULL,
    "recommendedSavingAmount" INTEGER NOT NULL,
    "challengeSavingAmount" INTEGER NOT NULL,
    "parkingAccountAmount" INTEGER NOT NULL DEFAULT 0,
    "installmentSavingsAmount" INTEGER NOT NULL DEFAULT 0,
    "isaAmount" INTEGER NOT NULL DEFAULT 0,
    "investmentAmount" INTEGER NOT NULL DEFAULT 0,
    "recommendationReason1" VARCHAR(255),
    "recommendationReason2" VARCHAR(255),
    "recommendationReason3" VARCHAR(255),
    "cautionMessage1" VARCHAR(255),
    "cautionMessage2" VARCHAR(255),
    "exceptionCode" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_finance_inputs_userId_targetMonth_key" ON "monthly_finance_inputs"("userId", "targetMonth");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_results_monthlyFinanceInputId_key" ON "recommendation_results"("monthlyFinanceInputId");

-- AddForeignKey
ALTER TABLE "monthly_finance_inputs" ADD CONSTRAINT "monthly_finance_inputs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_monthlyFinanceInputId_fkey" FOREIGN KEY ("monthlyFinanceInputId") REFERENCES "monthly_finance_inputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
