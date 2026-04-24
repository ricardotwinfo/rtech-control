import { Company, Currency, ExpenseStatus, Prisma } from '@prisma/client';
import type { AppState, Company as CompanyType, CompanyState, Currency as CurrencyType, SaaSExpense, Status } from '../../src/lib/finance-service.js';
import { COMPANIES } from '../../src/lib/finance-service.js';
import { DEFAULT_AVAILABLE_YEARS, generateFullYearSeedData, INITIAL_TEMPLATES } from '../../src/lib/expense-templates.js';
import { prisma } from '../prisma.js';

type ExpensePayload = {
  company: CompanyType;
  service: string;
  dueDate: string;
  paymentDate?: string;
  currency: CurrencyType;
  value: number;
  exchangeRate?: number;
  status: Status;
  cardLast4: string;
  notes: string;
  costCenter: string;
  isRecurring: boolean;
};

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const toDateOnly = (value: Date | null | undefined) => (value ? value.toISOString().slice(0, 10) : undefined);
const toExpenseStatus = (status: Status): ExpenseStatus => {
  switch (status) {
    case 'PAGO':
      return ExpenseStatus.PAGO;
    case 'FREE':
      return ExpenseStatus.FREE;
    case 'ERRO':
      return ExpenseStatus.ERRO;
    default:
      return ExpenseStatus.A_VENCER;
  }
};

const fromExpenseStatus = (status: ExpenseStatus): Status => {
  switch (status) {
    case ExpenseStatus.PAGO:
      return 'PAGO';
    case ExpenseStatus.FREE:
      return 'FREE';
    case ExpenseStatus.ERRO:
      return 'ERRO';
    default:
      return 'A VENCER';
  }
};

const serializeExpense = (expense: {
  id: string;
  company: Company;
  dueDate: Date;
  paymentDate: Date | null;
  service: string;
  currency: Currency;
  value: Prisma.Decimal;
  exchangeRate: Prisma.Decimal | null;
  status: ExpenseStatus;
  cardLast4: string;
  notes: string;
  costCenter: string;
  isRecurring: boolean;
}) => ({
  id: expense.id,
  company: expense.company,
  dueDate: toDateOnly(expense.dueDate)!,
  paymentDate: toDateOnly(expense.paymentDate),
  service: expense.service,
  currency: expense.currency,
  value: Number(expense.value),
  exchangeRate: expense.exchangeRate ? Number(expense.exchangeRate) : undefined,
  status: fromExpenseStatus(expense.status),
  cardLast4: expense.cardLast4,
  notes: expense.notes,
  costCenter: expense.costCenter,
  isRecurring: expense.isRecurring,
}) satisfies SaaSExpense;

const companySeedData = (company: CompanyType) =>
  generateFullYearSeedData('2026', company).map((expense) => ({
    company: expense.company as Company,
    dueDate: toDate(expense.dueDate),
    paymentDate: null,
    service: expense.service,
    currency: expense.currency as Currency,
    value: expense.value,
    exchangeRate: null,
    status: ExpenseStatus.A_VENCER,
    cardLast4: expense.cardLast4,
    notes: expense.notes,
    costCenter: expense.costCenter,
    isRecurring: expense.isRecurring,
  }));

const applyFilters = (items: SaaSExpense[], filters: Record<string, string | undefined>) =>
  items.filter((expense) => {
    if (filters.company && expense.company !== filters.company) return false;
    if (filters.search && !expense.service.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.year && filters.year !== 'TODOS' && expense.dueDate.slice(0, 4) !== filters.year) return false;
    if (filters.month && filters.month !== 'TODOS' && expense.dueDate.slice(5, 7) !== filters.month) return false;
    if (filters.status && filters.status !== 'TODOS' && expense.status !== filters.status) return false;
    if (filters.currency && filters.currency !== 'TODOS' && expense.currency !== filters.currency) return false;
    if (filters.costCenter && filters.costCenter !== 'TODOS' && expense.costCenter !== filters.costCenter) return false;
    if (filters.cardLast4 && filters.cardLast4 !== 'TODOS' && expense.cardLast4 !== filters.cardLast4) return false;
    return true;
  });

export async function syncUserProfile(user: { id: string; email: string; fullName?: string | null }) {
  return prisma.userProfile.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      fullName: user.fullName ?? null,
      isActive: true,
    },
    create: {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? null,
      isActive: true,
    },
  });
}

export async function getBootstrapState(): Promise<AppState> {
  const [expenses, years] = await Promise.all([
    prisma.expense.findMany({ orderBy: [{ dueDate: 'asc' }, { service: 'asc' }] }),
    prisma.companyYear.findMany({ orderBy: [{ company: 'asc' }, { year: 'asc' }] }),
  ]);

  const state = COMPANIES.reduce((acc, company) => {
    const availableYears = years
      .filter((item) => item.company === company)
      .map((item) => String(item.year));

    acc[company] = {
      expenses: expenses.filter((expense) => expense.company === company).map(serializeExpense),
      availableYears,
    };
    return acc;
  }, {} as AppState);

  return state;
}

export async function getFilteredExpenses(filters: Record<string, string | undefined>) {
  const bootstrap = await getBootstrapState();
  const allExpenses = COMPANIES.flatMap((company) => bootstrap[company].expenses);
  return applyFilters(allExpenses, filters);
}

export async function createExpense(payload: ExpensePayload, userId: string) {
  const created = await prisma.expense.create({
    data: {
      company: payload.company as Company,
      service: payload.service,
      dueDate: toDate(payload.dueDate),
      paymentDate: payload.paymentDate ? toDate(payload.paymentDate) : null,
      currency: payload.currency as Currency,
      value: payload.value,
      exchangeRate: payload.exchangeRate ?? null,
      status: toExpenseStatus(payload.status),
      cardLast4: payload.cardLast4,
      notes: payload.notes,
      costCenter: payload.costCenter,
      isRecurring: payload.isRecurring,
      createdByUserId: userId,
      updatedByUserId: userId,
    },
  });

  await ensureCompanyYear(payload.company, payload.dueDate.slice(0, 4));
  return serializeExpense(created);
}

export async function updateExpense(id: string, payload: ExpensePayload, userId: string) {
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      company: payload.company as Company,
      service: payload.service,
      dueDate: toDate(payload.dueDate),
      paymentDate: payload.paymentDate ? toDate(payload.paymentDate) : null,
      currency: payload.currency as Currency,
      value: payload.value,
      exchangeRate: payload.exchangeRate ?? null,
      status: toExpenseStatus(payload.status),
      cardLast4: payload.cardLast4,
      notes: payload.notes,
      costCenter: payload.costCenter,
      isRecurring: payload.isRecurring,
      updatedByUserId: userId,
    },
  });

  await ensureCompanyYear(payload.company, payload.dueDate.slice(0, 4));
  return serializeExpense(updated);
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
}

export async function payExpense(
  id: string,
  paymentDate: string,
  value?: number,
  exchangeRate?: number,
  notes?: string,
  userId?: string,
  existingNotes?: string,
) {
  // Skip the pre-fetch when the caller already provides existingNotes and explicit values.
  let baseNotes: string | null | undefined = existingNotes;
  let baseValue: number | Prisma.Decimal | undefined = value;
  let baseExchangeRate: number | Prisma.Decimal | null | undefined = exchangeRate ?? null;
  let baseUserId: string | null | undefined = userId;

  if (baseNotes === undefined || baseValue === undefined) {
    const current = await prisma.expense.findUniqueOrThrow({ where: { id } });
    baseNotes = baseNotes ?? current.notes;
    baseValue = baseValue ?? current.value;
    baseExchangeRate = baseExchangeRate ?? current.exchangeRate;
    baseUserId = baseUserId ?? current.updatedByUserId;
  }

  const noteValue = notes?.trim();
  const combinedNotes = noteValue ? [baseNotes, noteValue].filter(Boolean).join(' | ') : baseNotes;

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      status: ExpenseStatus.PAGO,
      paymentDate: toDate(paymentDate),
      value: baseValue,
      exchangeRate: baseExchangeRate,
      notes: combinedNotes ?? '',
      updatedByUserId: baseUserId,
    },
  });

  return serializeExpense(updated);
}

export async function ensureCompanyYear(company: CompanyType, year: string) {
  return prisma.companyYear.upsert({
    where: {
      company_year: {
        company: company as Company,
        year: Number(year),
      },
    },
    update: {},
    create: {
      company: company as Company,
      year: Number(year),
    },
  });
}

export async function addCompanyYear(company: CompanyType, year: string) {
  await ensureCompanyYear(company, year);
}

export async function resetCompanyData(company: CompanyType) {
  await prisma.$transaction([
    prisma.expense.deleteMany({ where: { company: company as Company } }),
    prisma.companyYear.deleteMany({ where: { company: company as Company } }),
  ]);

  await prisma.companyYear.createMany({
    data: DEFAULT_AVAILABLE_YEARS.map((year) => ({
      company: company as Company,
      year,
    })),
  });

  const seedExpenses = companySeedData(company);
  if (seedExpenses.length > 0) {
    await prisma.expense.createMany({ data: seedExpenses });
  }
}

export async function cleanupDuplicates(company: CompanyType) {
  const expenses = await prisma.expense.findMany({
    where: { company: company as Company },
    orderBy: [{ dueDate: 'desc' }],
  });

  const ranked = [...expenses].sort((a, b) => {
    if (a.status === ExpenseStatus.PAGO && b.status !== ExpenseStatus.PAGO) return -1;
    if (a.status !== ExpenseStatus.PAGO && b.status === ExpenseStatus.PAGO) return 1;
    if (Number(a.value) > 0 && Number(b.value) === 0) return -1;
    if (Number(a.value) === 0 && Number(b.value) > 0) return 1;
    return 0;
  });

  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  ranked.forEach((expense) => {
    const key = `${expense.company}-${expense.service.trim().toLowerCase()}-${expense.dueDate.toISOString().slice(0, 7)}`;
    if (seen.has(key)) {
      duplicateIds.push(expense.id);
      return;
    }
    seen.add(key);
  });

  if (duplicateIds.length > 0) {
    await prisma.expense.deleteMany({ where: { id: { in: duplicateIds } } });
  }

  return duplicateIds.length;
}

export async function generateRecurringExpenses(company: CompanyType, targetMonth: string, targetYear: string) {
  const targetMonthPrefix = `${targetYear}-${targetMonth}`;
  const expenses = (await prisma.expense.findMany({
    where: { company: company as Company },
    orderBy: [{ dueDate: 'desc' }],
  })).map(serializeExpense);

  const recurringMap = new Map<string, SaaSExpense>();
  expenses.forEach((expense) => {
    if (!expense.isRecurring) return;
    const key = expense.service.trim().toLowerCase();
    if (!recurringMap.has(key)) {
      recurringMap.set(key, expense);
    }
  });

  let recurringItems = Array.from(recurringMap.values());

  if (recurringItems.length === 0) {
    const templates = INITIAL_TEMPLATES[company];
    if (templates && templates.length > 0) {
      recurringItems = templates.map((t, index) => ({
        id: `template-${index}`,
        company: company as CompanyType,
        dueDate: t.dueDate || '2026-01-01',
        paymentDate: undefined,
        service: t.service || '',
        currency: (t.currency || 'BRL') as CurrencyType,
        value: t.value || 0,
        exchangeRate: undefined,
        status: 'A VENCER' as Status,
        cardLast4: t.cardLast4 || '',
        notes: '',
        costCenter: t.costCenter || '',
        isRecurring: true,
      }));
    }
  }

  const newExpenses = recurringItems
    .filter((item) => !expenses.some((expense) => expense.service.trim().toLowerCase() === item.service.trim().toLowerCase() && expense.dueDate.startsWith(targetMonthPrefix)))
    .map((item) => {
      const day = item.dueDate.split('-')[2] || '01';
      return {
        company: item.company as Company,
        dueDate: toDate(`${targetMonthPrefix}-${day}`),
        paymentDate: null,
        service: item.service,
        currency: item.currency as Currency,
        value: 0,
        exchangeRate: null,
        status: ExpenseStatus.A_VENCER,
        cardLast4: item.cardLast4,
        notes: '',
        costCenter: item.costCenter,
        isRecurring: true,
      };
    });

  if (newExpenses.length > 0) {
    await prisma.expense.createMany({ data: newExpenses });
    await ensureCompanyYear(company, targetYear);
  }

  return newExpenses.length;
}

export async function getCompanyState(company: CompanyType): Promise<CompanyState> {
  const bootstrap = await getBootstrapState();
  return bootstrap[company];
}
