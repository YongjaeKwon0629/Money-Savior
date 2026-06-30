-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetMonth" VARCHAR(7) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" VARCHAR(255),
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_entries_userId_targetMonth_entryDate_idx" ON "ledger_entries"("userId", "targetMonth", "entryDate");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
