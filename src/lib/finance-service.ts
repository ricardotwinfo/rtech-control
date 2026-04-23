/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Types ---

export type Status = 'A VENCER' | 'PAGO' | 'FREE' | 'ERRO' | 'VENCIDO';
export type Currency = 'BRL' | 'USD';
export type Company = 'LIFTERS' | 'BPX' | 'ACESSE';

export interface SaaSExpense {
  id: string;
  company: Company;
  dueDate: string;
  paymentDate?: string;
  service: string;
  currency: Currency;
  value: number; // Original amount
  exchangeRate?: number;
  status: Status;
  cardLast4: string;
  notes: string;
  costCenter: string;
  isRecurring: boolean;
  // Metadata for better tracking (optional for backward compatibility)
  conversionDate?: string;
  isEstimated?: boolean;
}

export interface CompanyState {
  expenses: SaaSExpense[];
  availableYears: string[];
}

export type AppState = Record<Company, CompanyState>;

export interface DashboardSummary {
  paidBRL: number;
  paidUSD: number;
  paidUSDConverted: number; // Estimated BRL
  totalPaidConsolidatedBRL: number;
  pendingAmountBRL: number; // Estimated BRL
  overdueAmountBRL: number; // Estimated BRL
  upcomingCount: number;
  overdueCount: number;
  errorCount: number;
}

export interface MetricTrend {
  value: number;
  isUp: boolean;
}

export interface DashboardTrends {
  paid: MetricTrend | undefined;
  upcoming: MetricTrend | undefined;
  overdue: MetricTrend | undefined;
}

// --- Constants ---

export const COMPANIES: Company[] = ['LIFTERS', 'BPX', 'ACESSE'];
export const FALLBACK_EXCHANGE_RATE = 5.0;

// --- Helpers ---

/**
 * Gets the effective status of an expense based on the current date.
 * Centralizes the VENCIDO logic.
 */
export const getEffectiveStatus = (expense: SaaSExpense, todayStr: string): Status => {
  if (['PAGO', 'FREE', 'ERRO'].includes(expense.status)) {
    return expense.status;
  }
  
  if (expense.dueDate < todayStr) {
    return 'VENCIDO';
  }
  
  return 'A VENCER';
};

/**
 * Gets the reference date for filtering and dashboard.
 * - For PAID items: use paymentDate if available, otherwise dueDate.
 * - For others: use dueDate.
 */
export const getReferenceDate = (expense: SaaSExpense): string => {
  if (expense.status === 'PAGO' && expense.paymentDate) {
    return expense.paymentDate;
  }
  return expense.dueDate;
};

/**
 * Calculates the amount in BRL for an expense.
 * Handles USD to BRL estimation logic.
 */
export const getExpenseAmountBRL = (expense: SaaSExpense) => {
  if (expense.currency === 'BRL') {
    return {
      amount: expense.value,
      isEstimated: false,
      rate: 1
    };
  }
  
  // USD logic
  const rate = expense.exchangeRate || FALLBACK_EXCHANGE_RATE;
  return {
    amount: expense.value * rate,
    isEstimated: true,
    rate: rate
  };
};

/**
 * Filters expenses by period (Year and Month).
 * Standardizes the filtering logic used in Dashboard and List.
 */
export const filterExpensesByPeriod = (
  expenses: SaaSExpense[], 
  year: string, 
  month: string, 
  company: Company
) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  
  return expenses.map(exp => ({
    ...exp,
    status: getEffectiveStatus(exp, todayStr)
  })).filter(exp => {
    if (exp.company !== company) return false;
    
    const referenceDate = getReferenceDate(exp);
    const expYear = referenceDate.substring(0, 4);
    const expMonth = referenceDate.substring(5, 7);
    
    const matchesYear = year === 'TODOS' || expYear === year;
    const matchesMonth = month === 'TODOS' || expMonth === month;
    
    return matchesYear && matchesMonth;
  });
};

/**
 * Calculates dashboard metrics for a set of filtered expenses.
 */
export const calculateDashboardMetrics = (filteredExpenses: SaaSExpense[]): DashboardSummary => {
  let paidBRL = 0;
  let paidUSD = 0;
  let paidUSDConverted = 0;
  let pendingAmountBRL = 0;
  let overdueAmountBRL = 0;
  let upcomingCount = 0;
  let overdueCount = 0;
  let errorCount = 0;

  filteredExpenses.forEach(exp => {
    const { amount } = getExpenseAmountBRL(exp);
    
    if (exp.status === 'PAGO') {
      if (exp.currency === 'BRL') {
        paidBRL += exp.value;
      } else {
        paidUSD += exp.value;
        paidUSDConverted += amount;
      }
    } else if (exp.status === 'A VENCER') {
      upcomingCount++;
      pendingAmountBRL += amount;
    } else if (exp.status === 'VENCIDO') {
      overdueCount++;
      overdueAmountBRL += amount;
    } else if (exp.status === 'ERRO') {
      errorCount++;
    }
  });

  return {
    paidBRL,
    paidUSD,
    paidUSDConverted,
    totalPaidConsolidatedBRL: paidBRL + paidUSDConverted,
    pendingAmountBRL,
    overdueAmountBRL,
    upcomingCount,
    overdueCount,
    errorCount
  };
};

/**
 * Groups expenses by a field and sums their BRL value.
 */
export const groupExpensesByField = (expenses: SaaSExpense[], field: keyof SaaSExpense) => {
  const groups: Record<string, number> = {};
  
  expenses.forEach(exp => {
    const key = String(exp[field] || 'Outros');
    const { amount } = getExpenseAmountBRL(exp);
    groups[key] = (groups[key] || 0) + amount;
  });
  
  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Calculates service ranking (Top N).
 */
export const calculateServiceRanking = (expenses: SaaSExpense[], limit = 5) => {
  return groupExpensesByField(expenses, 'service').slice(0, limit);
};

/**
 * Generates financial alerts based on the data.
 */
export interface FinanceAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  details?: string;
}

export const generateFinanceAlerts = (expenses: SaaSExpense[]): FinanceAlert[] => {
  const alerts: FinanceAlert[] = [];
  const todayStr = new Date().toISOString().substring(0, 10);
  
  const overdueItems = expenses.filter(e => e.status === 'VENCIDO');
  if (overdueItems.length > 0) {
    alerts.push({
      type: 'danger',
      message: `${overdueItems.length} lançamentos vencidos`,
      details: 'Revise os pagamentos pendentes com data de vencimento atrasada.'
    });
  }
  
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().substring(0, 10);
  
  const upcomingSoon = expenses.filter(e => e.status === 'A VENCER' && e.dueDate <= next7DaysStr);
  if (upcomingSoon.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${upcomingSoon.length} lançamentos vencendo nos próximos 7 dias`,
      details: 'Programe os pagamentos para evitar taxas ou interrupção de serviços.'
    });
  }
  
  const usdWithoutRate = expenses.filter(e => e.currency === 'USD' && e.status === 'PAGO' && !e.exchangeRate);
  if (usdWithoutRate.length > 0) {
    alerts.push({
      type: 'info',
      message: `${usdWithoutRate.length} pagamentos em USD sem cotação definida`,
      details: 'Estes valores estão usando uma cotação estimada padrão (R$ 5.00).'
    });
  }

  const errors = expenses.filter(e => e.status === 'ERRO');
  if (errors.length > 0) {
    alerts.push({
      type: 'danger',
      message: `${errors.length} lançamentos com status de ERRO`,
      details: 'Verifique se houve falha na cobrança ou se o cartão precisa ser atualizado.'
    });
  }

  return alerts;
};
