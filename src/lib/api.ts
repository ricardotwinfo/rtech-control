import type { AppState, Company, Currency, SaaSExpense, Status } from './finance-service';
import { clientEnv } from './env';

type ExpensePayload = {
  company: Company;
  service: string;
  dueDate: string;
  paymentDate?: string;
  currency: Currency;
  value: number;
  exchangeRate?: number;
  status: Status;
  cardLast4: string;
  notes: string;
  costCenter: string;
  isRecurring: boolean;
};

const request = async <T>(path: string, accessToken: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const Api = {
  syncProfile: (accessToken: string) =>
    request<{ profile: { id: string; email: string; fullName?: string; isActive: boolean } }>('/api/auth/sync-profile', accessToken, {
      method: 'POST',
    }),
  fetchBootstrap: (accessToken: string) =>
    request<{ appState: AppState }>('/api/bootstrap', accessToken),
  fetchExpenses: (accessToken: string, query: URLSearchParams) =>
    request<{ expenses: SaaSExpense[] }>(`/api/expenses?${query.toString()}`, accessToken),
  createExpense: (accessToken: string, payload: ExpensePayload) =>
    request<{ expense: SaaSExpense }>('/api/expenses', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateExpense: (accessToken: string, id: string, payload: ExpensePayload) =>
    request<{ expense: SaaSExpense }>(`/api/expenses/${id}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteExpense: (accessToken: string, id: string) =>
    request<void>(`/api/expenses/${id}`, accessToken, {
      method: 'DELETE',
    }),
  payExpense: (
    accessToken: string,
    id: string,
    payload: { paymentDate: string; value?: number; exchangeRate?: number; notes?: string; existingNotes?: string },
  ) =>
    request<{ expense: SaaSExpense }>(`/api/expenses/${id}/pay`, accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateRecurring: (accessToken: string, company: Company, targetMonth: string, targetYear: string) =>
    request<{ generated: number; appState: AppState }>('/api/expenses/recurring/generate', accessToken, {
      method: 'POST',
      body: JSON.stringify({ company, targetMonth, targetYear }),
    }),
  resetCompany: (accessToken: string, company: Company) =>
    request<{ appState: AppState }>(`/api/companies/${company}/reset`, accessToken, {
      method: 'POST',
    }),
  cleanupDuplicates: (accessToken: string, company: Company) =>
    request<{ removed: number; appState: AppState }>(`/api/companies/${company}/cleanup-duplicates`, accessToken, {
      method: 'POST',
    }),
  addCompanyYear: (accessToken: string, company: Company, year: string) =>
    request<{ appState: AppState }>('/api/company-years', accessToken, {
      method: 'POST',
      body: JSON.stringify({ company, year }),
    }),
};
