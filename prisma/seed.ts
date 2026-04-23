import { PrismaClient, Company, Currency, ExpenseStatus } from '@prisma/client';
import { COMPANIES } from '../src/lib/finance-service';
import { DEFAULT_AVAILABLE_YEARS, generateFullYearSeedData } from '../src/lib/expense-templates';

const prisma = new PrismaClient();

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  await prisma.companyYear.deleteMany();
  await prisma.expense.deleteMany();

  for (const company of COMPANIES) {
    for (const year of DEFAULT_AVAILABLE_YEARS) {
      await prisma.companyYear.upsert({
        where: {
          company_year: {
            company: company as Company,
            year,
          },
        },
        update: {},
        create: {
          company: company as Company,
          year,
        },
      });
    }

    const expenses = generateFullYearSeedData('2026', company).map((expense) => ({
      company: expense.company as Company,
      dueDate: toDate(expense.dueDate),
      paymentDate: expense.paymentDate ? toDate(expense.paymentDate) : null,
      service: expense.service,
      currency: expense.currency as Currency,
      value: expense.value,
      exchangeRate: expense.exchangeRate ?? null,
      status: ExpenseStatus.A_VENCER,
      cardLast4: expense.cardLast4,
      notes: expense.notes,
      costCenter: expense.costCenter,
      isRecurring: expense.isRecurring,
    }));

    if (expenses.length > 0) {
      await prisma.expense.createMany({ data: expenses });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
