-- CreateIndex
CREATE INDEX "Expense_company_idx" ON "Expense"("company");

-- CreateIndex
CREATE INDEX "Expense_company_dueDate_idx" ON "Expense"("company", "dueDate");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");
