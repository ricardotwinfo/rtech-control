-- CreateEnum
CREATE TYPE "Company" AS ENUM ('LIFTERS', 'BPX', 'ACESSE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('A_VENCER', 'PAGO', 'FREE', 'ERRO');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "company" "Company" NOT NULL,
    "dueDate" DATE NOT NULL,
    "paymentDate" DATE,
    "service" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "exchangeRate" DECIMAL(10,4),
    "status" "ExpenseStatus" NOT NULL,
    "cardLast4" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "costCenter" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyYear" (
    "id" TEXT NOT NULL,
    "company" "Company" NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyYear_company_year_key" ON "CompanyYear"("company", "year");
