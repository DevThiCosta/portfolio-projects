-- CreateEnum
CREATE TYPE "ExpenseKind" AS ENUM ('FIXA', 'VARIAVEL', 'COMPRA_INSUMO', 'COMPRA_SERVICO');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('ATIVA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PaymentTerm" AS ENUM ('AVISTA', 'PRAZO_UNICO', 'PRAZO_PARCELADO');

-- CreateEnum
CREATE TYPE "SupplierKind" AS ENUM ('INSUMO', 'SERVICO', 'AMBOS');

-- AlterTable
ALTER TABLE "InsumoMovement" ADD COLUMN     "relatedExpenseId" TEXT;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SupplierKind" NOT NULL DEFAULT 'AMBOS',
    "document" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "kind" "ExpenseKind" NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'ATIVA',
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "supplierId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentTerm" "PaymentTerm" NOT NULL,
    "installmentsCount" INTEGER NOT NULL DEFAULT 1,
    "installmentIntervalDays" INTEGER NOT NULL DEFAULT 30,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "competencia" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "insumoId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseInstallment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");

-- CreateIndex
CREATE INDEX "Expense_kind_status_idx" ON "Expense"("kind", "status");

-- CreateIndex
CREATE INDEX "Expense_competencia_idx" ON "Expense"("competencia");

-- CreateIndex
CREATE INDEX "Expense_supplierId_idx" ON "Expense"("supplierId");

-- CreateIndex
CREATE INDEX "ExpenseItem_expenseId_idx" ON "ExpenseItem"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseItem_insumoId_idx" ON "ExpenseItem"("insumoId");

-- CreateIndex
CREATE INDEX "ExpenseInstallment_expenseId_idx" ON "ExpenseInstallment"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseInstallment_dueDate_paid_idx" ON "ExpenseInstallment"("dueDate", "paid");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseInstallment_expenseId_number_key" ON "ExpenseInstallment"("expenseId", "number");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseInstallment" ADD CONSTRAINT "ExpenseInstallment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
