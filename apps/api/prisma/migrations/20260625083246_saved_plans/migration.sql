-- CreateTable
CREATE TABLE "saved_recommendation_plans" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "monthlyFinanceInputId" INTEGER NOT NULL,
    "recommendationResultId" INTEGER NOT NULL,
    "targetMonth" VARCHAR(7) NOT NULL,
    "recommendedType" "RecommendationType" NOT NULL,
    "recommendedSavingAmount" INTEGER NOT NULL,
    "surplusAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_recommendation_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_recommendation_plans_userId_monthlyFinanceInputId_key" ON "saved_recommendation_plans"("userId", "monthlyFinanceInputId");

-- AddForeignKey
ALTER TABLE "saved_recommendation_plans" ADD CONSTRAINT "saved_recommendation_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recommendation_plans" ADD CONSTRAINT "saved_recommendation_plans_monthlyFinanceInputId_fkey" FOREIGN KEY ("monthlyFinanceInputId") REFERENCES "monthly_finance_inputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recommendation_plans" ADD CONSTRAINT "saved_recommendation_plans_recommendationResultId_fkey" FOREIGN KEY ("recommendationResultId") REFERENCES "recommendation_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
