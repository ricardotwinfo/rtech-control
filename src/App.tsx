/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { 
  Plus, 
  Search, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  Filter, 
  Trash2, 
  Edit2, 
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  DollarSign,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Receipt,
  Settings,
  Bell,
  Menu,
  LogOut,
  History,
  ArrowUpDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList
} from 'recharts';
import * as FinanceService from './lib/finance-service';
import { Api } from './lib/api';
import { ExportService } from './lib/export-service';
import { supabase } from './lib/supabase';
import type { 
  SaaSExpense, 
  Status, 
  Currency, 
  Company, 
  DashboardSummary, 
  FinanceAlert,
  AppState,
  CompanyState
} from './lib/finance-service';

const CHART_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#f43f5e', '#84cc16', '#d946ef', '#3b82f6', '#22c55e',
  '#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed',
  '#db2777', '#0891b2', '#ea580c', '#4338ca', '#0d9488'
];

const getServiceColor = (service: string) => {
  let hash = 0;
  for (let i = 0; i < service.length; i++) {
    hash = service.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHART_COLORS[Math.abs(hash) % CHART_COLORS.length];
};

// --- Constants ---

const STORAGE_KEY_V3 = 'saas_expenses_data_v3';
const COMPANIES: Company[] = FinanceService.COMPANIES;
const COST_CENTERS = ['Lifters', 'BPX', 'Acesse'];
const COMPANY_COST_CENTER: Record<string, string> = { LIFTERS: 'Lifters', BPX: 'BPX', ACESSE: 'Acesse' };
const STATUS_OPTIONS: Status[] = ['A VENCER', 'PAGO', 'FREE', 'ERRO', 'VENCIDO'];
const CURRENCIES: Currency[] = ['BRL', 'USD'];
const createEmptyAppState = (): AppState => ({
  LIFTERS: { expenses: [], availableYears: [] },
  BPX: { expenses: [], availableYears: [] },
  ACESSE: { expenses: [], availableYears: [] },
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

const STATUS_DESCRIPTIONS: Record<Status, string> = {
  'PAGO': 'Lançamento já quitado e liquidado.',
  'A VENCER': 'Lançamento futuro dentro do prazo de vencimento.',
  'VENCIDO': 'Lançamento com data de vencimento ultrapassada e não pago.',
  'FREE': 'Serviço gratuito ou isento de cobrança.',
  'ERRO': 'Problema identificado no processamento ou cobrança.'
};

const INITIAL_TEMPLATES: Record<Company, Partial<SaaSExpense>[]> = {
  LIFTERS: [
    { service: 'Slack', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-01' },
    { service: 'Google Workspace Lifters', currency: 'BRL', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-01' },
    { service: 'AWS - Lifters 915484180968', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-01' },
    { service: 'Auth0 Lifters', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-02' },
    { service: 'Z-API - Lifters Recepção', currency: 'BRL', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-17' },
    { service: 'ClickUP', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-21' },
    { service: 'Github', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-24' },
    { service: 'Figma', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-25' },
    { service: 'Adobe Creative Cloud Pro', currency: 'BRL', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-26' },
    { service: 'CircleCI', currency: 'USD', value: 0, cardLast4: '4705', costCenter: 'Lifters', dueDate: '2026-01-30' },
  ],
  BPX: [
    { service: 'AWS-bpx-root-organizations', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Google Workspace betpix.com', currency: 'BRL', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Google Workspace vaidebet.com', currency: 'BRL', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Google Workspace pay365.com', currency: 'BRL', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Google Cloud / Firebase 01D222-692A11-365327', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Sendgrid BPX', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Databricks', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-01' },
    { service: 'Fingerprint', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-03' },
    { service: 'Claude Antropic', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-03' },
    { service: 'CloudAMQP BPX - ORION', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-05' },
    { service: 'OpenAI - ChatGPT', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-17' },
    { service: 'Clickhouse BPX', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-17' },
    { service: 'Cloudflare BPX', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-19' },
    { service: 'Progressier BPX', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-19' },
    { service: 'Power BI', currency: 'BRL', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-24' },
    { service: 'New Relic BPX', currency: 'USD', value: 0, cardLast4: '7594', costCenter: 'BPX', dueDate: '2026-01-30' },
  ],
  ACESSE: [
    { service: 'Google Workspace ACESSE', currency: 'BRL', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-01' },
    { service: 'AWS - ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-01' },
    { service: 'SendGrid ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-01' },
    { service: 'Localxpose ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-03' },
    { service: 'StatusCake ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-03' },
    { service: 'CloudAMQP / RabbitMQ ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-05' },
    { service: 'Comtele ACESSE', currency: 'BRL', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-12' },
    { service: 'Chatwoot ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-12' },
    { service: 'Cloudflare ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-19' },
    { service: 'Progressier ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-24' },
    { service: 'New Relic - ACESSE', currency: 'USD', value: 0, cardLast4: '1697', costCenter: 'Acesse', dueDate: '2026-01-30' },
  ]
};

const generateFullYearData = (year: string, company: Company): SaaSExpense[] => {
  const fullData: SaaSExpense[] = [];
  const templates = INITIAL_TEMPLATES[company];
  
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0');
    templates.forEach(template => {
      const day = (template.dueDate || '01').substring(8, 10);
      fullData.push({
        id: generateId(),
        company: company,
        service: template.service || '',
        dueDate: `${year}-${monthStr}-${day}`,
        currency: template.currency || 'BRL',
        value: template.value || 0,
        status: 'A VENCER',
        cardLast4: template.cardLast4 || '',
        notes: '',
        costCenter: template.costCenter || '',
        isRecurring: true,
      });
    });
  }
  return fullData;
};

// --- Toast System ---

type ToastItem = { id: string; message: string; type: 'success' | 'error'; duration: number };

function ToastNotification({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);

  useEffect(() => {
    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => onDismiss(toast.id), remainingRef.current);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleMouseEnter = () => {
    setPaused(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startTimeRef.current));
  };

  const handleMouseLeave = () => {
    setPaused(false);
    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => onDismiss(toast.id), remainingRef.current);
  };

  const isSuccess = toast.type === 'success';

  return (
    <motion.div
      role={isSuccess ? 'status' : 'alert'}
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-start gap-3 w-[340px] rounded-xl shadow-2xl border overflow-hidden cursor-default select-none ${
        isSuccess
          ? 'bg-white border-emerald-100'
          : 'bg-white border-rose-100'
      }`}
    >
      {/* Colored left accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      {/* Icon */}
      <div className={`mt-3.5 ml-4 flex-shrink-0 p-1.5 rounded-full ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isSuccess
          ? <CheckCircle className="w-4 h-4" />
          : <AlertCircle className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 py-3 pr-8 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isSuccess ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isSuccess ? 'Sucesso' : 'Erro'}
        </p>
        <p className="text-sm text-slate-700 leading-snug break-words">{toast.message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100">
        <div
          className={`h-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`}
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>
    </motion.div>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastNotification toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

export default function App() {
  // --- State ---
  const [appState, setAppState] = useState<AppState>(createEmptyAppState);
  const [activeCompany, setActiveCompany] = useState<Company>('LIFTERS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDashboardDatePickerOpen, setIsDashboardDatePickerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringTargetMonth, setRecurringTargetMonth] = useState('');
  const [recurringTargetYear, setRecurringTargetYear] = useState('');
  const [newYearInput, setNewYearInput] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<{ title: string, message: string, onConfirm: () => void | Promise<void> } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [editingExpense, setEditingExpense] = useState<SaaSExpense | null>(null);
  const [payingExpense, setPayingExpense] = useState<SaaSExpense | null>(null);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [modalCurrency, setModalCurrency] = useState<Currency>('BRL');
  const [modalValue, setModalValue] = useState('');
  const [modalStatus, setModalStatus] = useState<Status>('A VENCER');
  const [modalExchangeRate, setModalExchangeRate] = useState<string>('');
  const [modalDueDate, setModalDueDate] = useState('');
  const [modalPaymentDate, setModalPaymentDate] = useState('');
  const [modalCostCenter, setModalCostCenter] = useState('');
  const [historicalRateDate, setHistoricalRateDate] = useState('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const isPasswordRecoveryRef = useRef(false);

  const quickPayInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPayModalOpen && quickPayInputRef.current) {
      setTimeout(() => {
        quickPayInputRef.current?.focus();
        if (quickPayInputRef.current) {
          quickPayInputRef.current.select();
        }
      }, 150);
    }
  }, [isPayModalOpen]);

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().substring(5, 7));
  
  const [dashboardYear, setDashboardYear] = useState<string>(new Date().getFullYear().toString());
  const [dashboardMonth, setDashboardMonth] = useState<string>(new Date().toISOString().substring(5, 7));
  
  const [filterStatus, setFilterStatus] = useState<Status | 'TODOS'>('TODOS');
  const [filterCurrency, setFilterCurrency] = useState<Currency | 'TODOS'>('TODOS');
  const [filterCostCenter, setFilterCostCenter] = useState<string>('TODOS');
  const [filterCard, setFilterCard] = useState<string>('TODOS');

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper to get active company data
  const activeData = useMemo(() => appState[activeCompany], [appState, activeCompany]);
  const expenses = activeData.expenses;
  const availableYears = activeData.availableYears;

  const applyAppState = (nextState: AppState) => {
    setAppState(nextState);
    setIsLoaded(true);

    const companyYears = nextState[activeCompany]?.availableYears ?? [];
    const currentYear = new Date().getFullYear().toString();
    const fallbackYear = companyYears.includes(currentYear) ? currentYear : companyYears[companyYears.length - 1] || currentYear;

    setFilterYear((prev) => (prev === 'TODOS' || companyYears.includes(prev) ? prev : fallbackYear));
    setDashboardYear((prev) => (prev === 'TODOS' || companyYears.includes(prev) ? prev : fallbackYear));
  };

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }
    return data.session.access_token;
  };

  const refreshAppState = async (sessionOverride?: Session | null, opts: { syncProfile?: boolean } = {}) => {
    const activeSession = sessionOverride ?? session;
    if (!activeSession) {
      setAppState(createEmptyAppState());
      setIsLoaded(false);
      return;
    }

    setIsSyncingData(true);
    try {
      if (opts.syncProfile) {
        // Run both in parallel on first login — saves one serial round trip
        const [, { appState: nextState }] = await Promise.all([
          Api.syncProfile(activeSession.access_token),
          Api.fetchBootstrap(activeSession.access_token),
        ]);
        applyAppState(nextState);
      } else {
        const { appState: nextState } = await Api.fetchBootstrap(activeSession.access_token);
        applyAppState(nextState);
      }
      setAuthError('');
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível carregar os dados.';
      setAuthError(message);
      showToast(message, 'error');
    } finally {
      setIsSyncingData(false);
    }
  };

  // Load auth state and bootstrap data
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY_V3);
    localStorage.removeItem('saas_expenses_data_v2');

    const savedCompany = localStorage.getItem('active_company');
    if (savedCompany && COMPANIES.includes(savedCompany as Company)) {
      setActiveCompany(savedCompany as Company);
    }

    // Detect recovery token in URL hash (implicit flow: #type=recovery)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    if (hashParams.get('type') === 'recovery') {
      isPasswordRecoveryRef.current = true;
      setIsPasswordRecovery(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthReady(true);
      // Skip bootstrap when in recovery mode — user must reset password first
      if (data.session && !isPasswordRecoveryRef.current) {
        refreshAppState(data.session, { syncProfile: true });
      } else {
        setIsSyncingData(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Mark recovery mode and stop — do NOT load the app
        isPasswordRecoveryRef.current = true;
        setIsPasswordRecovery(true);
        setSession(nextSession);
        setIsAuthReady(true);
        setIsSyncingData(false);
        return;
      }

      // Supabase v2 + PKCE fires SIGNED_IN right after PASSWORD_RECOVERY.
      // Ignore all subsequent events until the user finishes the reset flow.
      if (isPasswordRecoveryRef.current) return;

      setIsPasswordRecovery(false);
      setSession(nextSession);
      setIsAuthReady(true);
      if (nextSession) {
        refreshAppState(nextSession);
      } else {
        setAppState(createEmptyAppState());
        setIsLoaded(false);
        setIsSyncingData(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('active_company', activeCompany);
  }, [activeCompany]);

  useEffect(() => {
    const companyYears = appState[activeCompany]?.availableYears ?? [];
    if (companyYears.length === 0) return;

    const fallbackYear = companyYears.includes(new Date().getFullYear().toString())
      ? new Date().getFullYear().toString()
      : companyYears[companyYears.length - 1];

    if (filterYear !== 'TODOS' && !companyYears.includes(filterYear)) {
      setFilterYear(fallbackYear);
    }

    if (dashboardYear !== 'TODOS' && !companyYears.includes(dashboardYear)) {
      setDashboardYear(fallbackYear);
    }
  }, [activeCompany, appState, dashboardYear, filterYear]);

  // Derived Data
  const filteredExpenses = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    
    let result = expenses.map(exp => ({
      ...exp,
      status: FinanceService.getEffectiveStatus(exp, todayStr)
    })).filter(exp => {
      const matchesCompany = exp.company === activeCompany;
      const matchesSearch = exp.service.toLowerCase().includes(searchTerm.toLowerCase());
      
      const expYear = exp.dueDate.substring(0, 4);
      const expMonth = exp.dueDate.substring(5, 7);
      
      const matchesYear = filterYear === 'TODOS' || expYear === filterYear;
      const matchesMonth = filterMonth === 'TODOS' || expMonth === filterMonth;
      
      const matchesStatus = filterStatus === 'TODOS' || exp.status === filterStatus;
      const matchesCurrency = filterCurrency === 'TODOS' || exp.currency === filterCurrency;
      const matchesCostCenter = filterCostCenter === 'TODOS' || exp.costCenter === filterCostCenter;
      const matchesCard = filterCard === 'TODOS' || exp.cardLast4 === filterCard;
      
      return matchesCompany && matchesSearch && matchesYear && matchesMonth && matchesStatus && matchesCurrency && matchesCostCenter && matchesCard;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortConfig.key === 'value') {
          // Sort by effective BRL value for better logic
          aVal = FinanceService.getExpenseAmountBRL(a).amount;
          bVal = FinanceService.getExpenseAmountBRL(b).amount;
        } else {
          aVal = (a as any)[sortConfig.key];
          bVal = (b as any)[sortConfig.key];
          
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [expenses, activeCompany, searchTerm, filterYear, filterMonth, filterStatus, filterCurrency, filterCostCenter, filterCard, sortConfig]);

  const dashboardFilteredExpenses = useMemo(() => {
    return FinanceService.filterExpensesByPeriod(expenses, dashboardYear, dashboardMonth, activeCompany);
  }, [expenses, activeCompany, dashboardYear, dashboardMonth]);

  const stats = useMemo(() => {
    const current = FinanceService.calculateDashboardMetrics(dashboardFilteredExpenses);
    
    // Calculate previous period for trends
    let prevYear = dashboardYear;
    let prevMonth = dashboardMonth;
    let hasPrev = false;

    if (dashboardMonth !== 'TODOS') {
      const monthIdx = parseInt(dashboardMonth);
      if (monthIdx === 1) {
        prevMonth = '12';
        prevYear = (parseInt(dashboardYear) - 1).toString();
      } else {
        prevMonth = (monthIdx - 1).toString().padStart(2, '0');
      }
      hasPrev = true;
    } else if (dashboardYear !== 'TODOS') {
      prevYear = (parseInt(dashboardYear) - 1).toString();
      prevMonth = 'TODOS';
      hasPrev = true;
    }

    const calculateTrend = (curr: number, prev: number) => {
      if (!hasPrev || prev === 0) return undefined;
      const diff = curr - prev;
      const percent = (diff / prev) * 100;
      return { value: percent, isUp: percent >= 0 };
    };

    const prevExpenses = hasPrev ? FinanceService.filterExpensesByPeriod(expenses, prevYear, prevMonth, activeCompany) : [];
    const prev = hasPrev ? FinanceService.calculateDashboardMetrics(prevExpenses) : null;

    return {
      ...current,
      trends: {
        paid: prev ? calculateTrend(current.totalPaidConsolidatedBRL, prev.totalPaidConsolidatedBRL) : undefined,
        upcoming: prev ? calculateTrend(current.upcomingCount, prev.upcomingCount) : undefined,
        overdue: prev ? calculateTrend(current.overdueCount, prev.overdueCount) : undefined,
      }
    };
  }, [expenses, dashboardFilteredExpenses, activeCompany, dashboardYear, dashboardMonth]);

  const alerts = useMemo(() => {
    return FinanceService.generateFinanceAlerts(dashboardFilteredExpenses);
  }, [dashboardFilteredExpenses]);

  const chartData = useMemo(() => {
    // Monthly evolution for the selected year
    const year = dashboardYear === 'TODOS' ? new Date().getFullYear().toString() : dashboardYear;
    const monthlyData = months.map(m => {
      const monthExpenses = FinanceService.filterExpensesByPeriod(expenses, year, m.value, activeCompany);
      const dashboardMetrics = FinanceService.calculateDashboardMetrics(monthExpenses);
      
      return {
        name: m.label,
        total: Math.round(dashboardMetrics.totalPaidConsolidatedBRL * 100) / 100
      };
    });

    // Annual evolution
    const annualData = availableYears.map(y => {
      const yearExpenses = FinanceService.filterExpensesByPeriod(expenses, y, 'TODOS', activeCompany)
        .filter(e => e.status === 'PAGO');

      const monthlyBreakdown: Record<string, number> = {};
      const servicesBreakdown: Record<string, number> = {};
      let total = 0;
      
      yearExpenses.forEach(e => {
        const referenceDate = FinanceService.getReferenceDate(e);
        const monthNum = referenceDate.substring(5, 7);
        const monthLabel = months.find(m => m.value === monthNum)?.label || monthNum;
        
        const { amount } = FinanceService.getExpenseAmountBRL(e);
        
        monthlyBreakdown[monthLabel] = (monthlyBreakdown[monthLabel] || 0) + amount;
        servicesBreakdown[e.service] = (servicesBreakdown[e.service] || 0) + amount;
        total += amount;
      });

      // Round values
      Object.keys(monthlyBreakdown).forEach(key => {
        monthlyBreakdown[key] = Math.round(monthlyBreakdown[key] * 100) / 100;
      });
      Object.keys(servicesBreakdown).forEach(key => {
        servicesBreakdown[key] = Math.round(servicesBreakdown[key] * 100) / 100;
      });

      return {
        name: y,
        total: Math.round(total * 100) / 100,
        servicesBreakdown,
        ...monthlyBreakdown
      };
    });

    // Distribution by Status
    const statusData = STATUS_OPTIONS.map(status => {
      const count = dashboardFilteredExpenses.filter(e => e.status === status).length;
      return { name: status, value: count };
    }).filter(d => d.value > 0);

    // New insights
    const topServices = FinanceService.calculateServiceRanking(dashboardFilteredExpenses);
    const byCostCenter = FinanceService.groupExpensesByField(dashboardFilteredExpenses, 'costCenter');
    
    return { monthlyData, annualData, statusData, topServices, byCostCenter };
  }, [expenses, activeCompany, dashboardYear, availableYears, dashboardFilteredExpenses]);

  const uniqueCards = useMemo(() => {
    return Array.from(new Set(expenses.filter(e => e.company === activeCompany).map(e => e.cardLast4)));
  }, [expenses, activeCompany]);

  const formatToBRL = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const amount = parseInt(digits, 10) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatToBRL(e.target.value);
    setModalValue(formatted);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Status;
    setModalStatus(newStatus);
    if (newStatus === 'FREE') {
      setModalValue('0,00');
    }
    
    // Auto-fetch exchange rate if marking as paid in USD
    if (newStatus === 'PAGO' && modalCurrency === 'USD' && !modalExchangeRate) {
      const paymentDateInput = document.querySelector('input[name="paymentDate"]') as HTMLInputElement;
      if (paymentDateInput?.value) {
        fetchHistoricalRate(paymentDateInput.value);
      } else {
        fetchExchangeRate();
      }
    }
  };

  const fetchExchangeRate = async () => {
    setIsFetchingRate(true);
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await response.json();
      if (data.USDBRL) {
        setModalExchangeRate(parseFloat(data.USDBRL.bid).toFixed(4));
        showToast('Cotação atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao buscar cotação:', error);
      showToast('Erro ao buscar cotação do dólar.', 'error');
    } finally {
      setIsFetchingRate(false);
    }
  };

  const fetchHistoricalRate = async (date: string) => {
    if (!date) return;

    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      return fetchExchangeRate();
    }

    setIsFetchingRate(true);
    try {
      // Query a 7-day window ending on the selected date so weekends and
      // holidays automatically fall back to the most recent trading day.
      const targetDate = new Date(date + 'T12:00:00');
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 7);
      const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');

      const response = await fetch(
        `https://economia.awesomeapi.com.br/json/daily/USD-BRL/?start_date=${fmt(startDate)}&end_date=${fmt(targetDate)}`
      );

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0]; // API returns newest first
        setModalExchangeRate(parseFloat(entry.bid).toFixed(4));

        const actualDate = new Date(parseInt(entry.timestamp) * 1000)
          .toISOString().split('T')[0];

        if (actualDate === date) {
          showToast(`Cotação de ${formatDate(date)} aplicada!`);
        } else {
          showToast(`Fechamento de ${formatDate(actualDate)} aplicado (${formatDate(date)} sem negociações).`);
        }
      } else {
        showToast('Cotação não encontrada para o período selecionado.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar cotação histórica:', error);
      showToast('Erro ao buscar cotação histórica.', 'error');
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value as Currency;
    setModalCurrency(newCurrency);
    if (newCurrency === 'USD') {
      fetchExchangeRate();
    } else {
      setModalExchangeRate('');
    }
  };

  // Handlers
  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const numericValue = parseFloat(modalValue.replace(/\./g, '').replace(',', '.'));
    const numericExchangeRate = modalExchangeRate ? parseFloat(modalExchangeRate) : undefined;

    const payload = {
      company: activeCompany,
      service: formData.get('service') as string,
      dueDate: formData.get('dueDate') as string,
      paymentDate: formData.get('paymentDate') as string || undefined,
      currency: formData.get('currency') as Currency,
      value: isNaN(numericValue) ? 0 : numericValue,
      exchangeRate: numericExchangeRate,
      status: formData.get('status') as Status,
      cardLast4: formData.get('cardLast4') as string,
      costCenter: formData.get('costCenter') as string,
      notes: formData.get('notes') as string,
      isRecurring: formData.get('isRecurring') === 'on',
    };

    try {
      const accessToken = await getAccessToken();
      if (editingExpense) {
        const { expense: updated } = await Api.updateExpense(accessToken, editingExpense.id, payload);
        setAppState(prev => {
          const year = updated.dueDate.slice(0, 4);
          const co = prev[activeCompany];
          return {
            ...prev,
            [activeCompany]: {
              expenses: co.expenses.map(e => e.id === editingExpense.id ? updated : e),
              availableYears: co.availableYears.includes(year) ? co.availableYears : [...co.availableYears, year].sort(),
            },
          };
        });
        showToast('Lançamento atualizado com sucesso!');
      } else {
        const { expense: created } = await Api.createExpense(accessToken, payload);
        setAppState(prev => {
          const year = created.dueDate.slice(0, 4);
          const co = prev[activeCompany];
          const expenses = [...co.expenses, created].sort(
            (a, b) => a.dueDate.localeCompare(b.dueDate) || a.service.localeCompare(b.service),
          );
          return {
            ...prev,
            [activeCompany]: {
              expenses,
              availableYears: co.availableYears.includes(year) ? co.availableYears : [...co.availableYears, year].sort(),
            },
          };
        });
        showToast('Lançamento criado com sucesso!');
      }

      setIsModalOpen(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao salvar lançamento.', 'error');
    }
  };

  const handleQuickPay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingExpense) return;

    const formData = new FormData(e.currentTarget);
    const numericValue = parseFloat(modalValue.replace(/\./g, '').replace(',', '.'));
    const numericExchangeRate = modalExchangeRate ? parseFloat(modalExchangeRate) : payingExpense.exchangeRate;

    try {
      const accessToken = await getAccessToken();
      const { expense: updated } = await Api.payExpense(accessToken, payingExpense.id, {
        paymentDate: formData.get('paymentDate') as string,
        value: isNaN(numericValue) ? payingExpense.value : numericValue,
        exchangeRate: numericExchangeRate,
        notes: formData.get('notes') as string,
        existingNotes: payingExpense.notes,
      });

      setAppState(prev => ({
        ...prev,
        [activeCompany]: {
          ...prev[activeCompany],
          expenses: prev[activeCompany].expenses.map(e => e.id === payingExpense.id ? updated : e),
        },
      }));
      setIsPayModalOpen(false);
      setPayingExpense(null);
      showToast('Pagamento confirmado com sucesso!');
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao confirmar pagamento.', 'error');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      'Excluir Lançamento',
      'Tem certeza que deseja excluir este lançamento?',
      async () => {
        try {
          const accessToken = await getAccessToken();
          await Api.deleteExpense(accessToken, id);
          setAppState(prev => ({
            ...prev,
            [activeCompany]: {
              ...prev[activeCompany],
              expenses: prev[activeCompany].expenses.filter(e => e.id !== id),
            },
          }));
          showToast('Lançamento excluído.');
        } catch (error) {
          console.error('Erro ao excluir lançamento:', error);
          showToast(error instanceof Error ? error.message : 'Erro ao excluir lançamento.', 'error');
        }
      }
    );
  };

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = type === 'error' ? 6000 : 3500;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const showConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmConfig({ title, message, onConfirm });
    setIsConfirmModalOpen(true);
  };

  const handleGenerateRecurring = async () => {
    if (!recurringTargetMonth || !recurringTargetYear) {
      showToast("Selecione o mês e ano de destino.", "error");
      return;
    }

    try {
      const accessToken = await getAccessToken();
      const { generated, appState: nextState } = await Api.generateRecurring(accessToken, activeCompany, recurringTargetMonth, recurringTargetYear);

      applyAppState(nextState);
      setFilterYear(recurringTargetYear);
      setFilterMonth(recurringTargetMonth);
      setActiveTab('expenses');
      setIsRecurringModalOpen(false);

      if (generated === 0) {
        showToast(`Todos os lançamentos recorrentes para ${recurringTargetMonth}/${recurringTargetYear} já existem.`, 'success');
        return;
      }

      showToast(`${generated} lançamentos gerados para ${recurringTargetMonth}/${recurringTargetYear}.`);
    } catch (error) {
      console.error('Erro ao gerar recorrentes:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao gerar recorrentes.', 'error');
    }
  };

  const openRecurringModal = () => {
    // Default to next month based on current filter or current date
    let baseYear = filterYear === 'TODOS' ? new Date().getFullYear().toString() : filterYear;
    let baseMonth = filterMonth === 'TODOS' ? (new Date().getMonth() + 1).toString().padStart(2, '0') : filterMonth;
    
    const date = new Date(`${baseYear}-${baseMonth}-01`);
    date.setMonth(date.getMonth() + 1);
    
    setRecurringTargetYear(date.getFullYear().toString());
    setRecurringTargetMonth((date.getMonth() + 1).toString().padStart(2, '0'));
    setIsRecurringModalOpen(true);
  };

  const handleCleanupDuplicates = async () => {
    try {
      const accessToken = await getAccessToken();
      const { removed, appState: nextState } = await Api.cleanupDuplicates(accessToken, activeCompany);
      applyAppState(nextState);

      if (removed === 0) {
        showToast("Nenhum lançamento duplicado encontrado.", "success");
        return;
      }

      showToast(`${removed} lançamentos duplicados foram removidos.`);
    } catch (error) {
      console.error('Erro ao limpar duplicados:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao limpar duplicados.', 'error');
    }
  };

  const handleResetData = () => {
    showConfirm(
      'Resetar Dados',
      'Isso irá apagar todos os seus dados atuais e carregar a lista padrão de serviços para todo o ano de 2026. Deseja continuar?',
      async () => {
        try {
          const accessToken = await getAccessToken();
          const { appState: nextState } = await Api.resetCompany(accessToken, activeCompany);
          applyAppState(nextState);
          setFilterYear('2026');
          setFilterMonth(new Date().toISOString().substring(5, 7));
          showToast('Dados resetados com sucesso!');
        } catch (error) {
          console.error('Erro ao resetar dados:', error);
          showToast(error instanceof Error ? error.message : 'Erro ao resetar dados.', 'error');
        }
      }
    );
  };

  const exportToCSV = () => {
    const headers = ['SERVIÇO', 'MOEDA', 'VALOR (BRL)'];
    const rows = filteredExpenses.map(e => {
      const { amount } = FinanceService.getExpenseAmountBRL(e);
        
      return [
        e.service,
        'BRL',
        amount.toFixed(2).replace('.', ',')
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateLabel = `${filterYear}-${filterMonth}`;
    link.setAttribute('download', `relatorio_gastos_${activeCompany}_${dateLabel}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    const html = ExportService.generateMonthlyReportHTML(
      activeCompany,
      filterYear,
      filterMonth,
      filteredExpenses
    );
    
    const dateLabel = filterMonth === 'TODOS' ? filterYear : `${filterYear}-${filterMonth}`;
    ExportService.downloadReport(html, `relatorio_executivo_${activeCompany}_${dateLabel}.html`);
    showToast('Relatório executivo gerado com sucesso!');
  };

  const handleExportDashboardReport = () => {
    const html = ExportService.generateMonthlyReportHTML(
      activeCompany,
      dashboardYear,
      dashboardMonth,
      dashboardFilteredExpenses
    );
    
    const dateLabel = dashboardMonth === 'TODOS' ? dashboardYear : `${dashboardYear}-${dashboardMonth}`;
    ExportService.downloadReport(html, `relatorio_executivo_${activeCompany}_${dateLabel}.html`);
    showToast('Relatório do dashboard gerado com sucesso!');
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'PAGO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'A VENCER': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'VENCIDO': return 'bg-red-50 text-red-600 border-red-200';
      case 'ERRO': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'FREE': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRowColor = (status: Status) => {
    switch (status) {
      case 'PAGO': return 'hover:bg-emerald-50/50';
      case 'A VENCER': return 'hover:bg-blue-50/50';
      case 'VENCIDO': return 'hover:bg-red-50/50';
      case 'ERRO': return 'hover:bg-rose-50/50';
      case 'FREE': return 'hover:bg-slate-50/50';
      default: return 'hover:bg-gray-50';
    }
  };

  const handleAddYear = async () => {
    if (newYearInput && /^\d{4}$/.test(newYearInput)) {
      if (!availableYears.includes(newYearInput)) {
        try {
          const accessToken = await getAccessToken();
          await Api.addCompanyYear(accessToken, activeCompany, newYearInput);
          setAppState(prev => {
            const co = prev[activeCompany];
            return {
              ...prev,
              [activeCompany]: {
                ...co,
                availableYears: [...co.availableYears, newYearInput].sort(),
              },
            };
          });
          setFilterYear(newYearInput);
          setNewYearInput('');
          setIsYearModalOpen(false);
          showToast(`Ano ${newYearInput} adicionado.`);
        } catch (error) {
          console.error('Erro ao adicionar ano:', error);
          showToast(error instanceof Error ? error.message : 'Erro ao adicionar ano.', 'error');
        }
      } else {
        showToast('Este ano já existe.', 'error');
      }
    } else if (newYearInput) {
      showToast('Ano inválido.', 'error');
    }
  };

  const getMonthLabel = (value: string) => {
    if (value === 'TODOS') return 'Todos os Meses';
    return months.find(m => m.value === value)?.label || '';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!isAuthReady || isSyncingData) {
    return <LoadingScreen message={!isAuthReady ? 'Validando sessão...' : 'Sincronizando dados com o Supabase...'} />;
  }

  if (isPasswordRecovery) {
    return (
      <ResetPasswordScreen
        onSuccess={() => {
          isPasswordRecoveryRef.current = false;
          setIsPasswordRecovery(false);
          setSession(null);
          supabase.auth.signOut();
        }}
      />
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#001529] text-slate-300 flex flex-col transition-all duration-300 lg:relative lg:inset-auto lg:z-auto ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div className="whitespace-normal break-words">
              <h1 className="text-lg font-bold text-white leading-tight">RTECH CONTROL</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Gestão de Pagamentos Corporativos</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {isSidebarOpen && <p className="text-[10px] font-bold text-slate-500 px-3 mb-2 uppercase tracking-widest">Geral</p>}
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => { setActiveTab('dashboard'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem
            icon={<Receipt className="w-5 h-5" />}
            label="Financeiro"
            active={activeTab === 'expenses'}
            onClick={() => { setActiveTab('expenses'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
            collapsed={!isSidebarOpen}
          />

          <div className="pt-4">
            {isSidebarOpen && <p className="text-[10px] font-bold text-slate-500 px-3 mb-2 uppercase tracking-widest">Sistema</p>}
            <SidebarItem
              icon={<Settings className="w-5 h-5" />}
              label="Configurações"
              active={activeTab === 'settings'}
              onClick={() => { setActiveTab('settings'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              collapsed={!isSidebarOpen}
            />
          </div>
        </nav>

        <div className="hidden lg:block p-4 border-t border-slate-800/50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {activeTab !== 'dashboard' && (
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {/* Company Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="flex items-center gap-3 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-all group"
                >
                  <CompanyLogo company={activeCompany} size="sm" />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-none mb-1">{activeCompany}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Empresa Ativa</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform group-hover:text-slate-600 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCompanyDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCompanyDropdownOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {COMPANIES.map(company => (
                        <button
                          key={company}
                          onClick={() => {
                            setActiveCompany(company);
                            setIsCompanyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                            activeCompany === company ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <CompanyLogo company={company} size="sm" />
                          <span className={`font-bold ${activeCompany === company ? 'text-blue-600' : 'text-slate-700'}`}>
                            {company}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden lg:flex flex-col text-right">
                <p className="text-xs font-semibold text-slate-800">{session.user.email}</p>
                <p className="text-[10px] font-medium text-slate-400">Usuário autenticado</p>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {activeTab === 'dashboard' ? 'VISÃO GERAL / RESUMO EXECUTIVO' : 'GESTÃO FINANCEIRA / LANÇAMENTOS'}
                </p>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {activeTab === 'dashboard' ? 'Dashboard Financeiro' : 'Controle de Lançamentos'}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                {activeTab === 'dashboard' && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleExportDashboardReport}
                      className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Relatório
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setIsDashboardDatePickerOpen(!isDashboardDatePickerOpen)}
                        className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 transition-all shadow-sm min-w-[180px] justify-between"
                      >
                      <span className="capitalize">
                        {dashboardMonth === 'TODOS' && dashboardYear === 'TODOS' 
                          ? 'Todos os Períodos' 
                          : `${getMonthLabel(dashboardMonth)} ${dashboardYear === 'TODOS' ? '' : 'de ' + dashboardYear}`}
                      </span>
                      <Filter className="w-4 h-4 text-slate-400" />
                    </button>

                    <AnimatePresence>
                      {isDashboardDatePickerOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsDashboardDatePickerOpen(false)} 
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full mt-2 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-[280px]"
                          >
                            <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-lg">
                              <select 
                                value={dashboardYear}
                                onChange={(e) => setDashboardYear(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
                              >
                                <option value="TODOS">Todos os Anos</option>
                                {availableYears.map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => setIsYearModalOpen(true)}
                                className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Novo Ano
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                              {months.map(m => (
                                <button
                                  key={m.value}
                                  onClick={() => {
                                    setDashboardMonth(m.value);
                                    setIsDashboardDatePickerOpen(false);
                                  }}
                                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                    dashboardMonth === m.value
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => {
                                setDashboardMonth('TODOS');
                                setIsDashboardDatePickerOpen(false);
                              }}
                              className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                                dashboardMonth === 'TODOS'
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Ver Ano Inteiro
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
                {activeTab === 'expenses' && (
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleCleanupDuplicates}
                      className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg transition-colors border border-red-100 shadow-sm text-sm font-semibold"
                      title="Remove lançamentos repetidos (mesmo serviço no mesmo mês)"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Limpar Duplicados</span>
                    </button>
                    <button 
                      onClick={openRecurringModal}
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-200 shadow-sm text-sm font-semibold"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Gerar Recorrentes</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEditingExpense(null);
                        setModalCurrency('BRL');
                        setModalValue('');
                        setModalStatus('A VENCER');
                        setModalExchangeRate('');
                        setModalCostCenter(COMPANY_COST_CENTER[activeCompany] || 'Lifters');
                        const y = filterYear !== 'TODOS' ? filterYear : new Date().getFullYear().toString();
                        const m = filterMonth !== 'TODOS' ? filterMonth : (new Date().getMonth() + 1).toString().padStart(2, '0');
                        setModalDueDate(`${y}-${m}-01`);
                        setModalPaymentDate(`${y}-${m}-01`);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-[#001529] hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Lançamento</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="space-y-8">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            title="Total Pago (BRL)" 
            value={stats.paidBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
            color="border-emerald-500"
          />
          <StatCard 
            title="Efetivado (USD)" 
            value={stats.paidUSD.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })} 
            subValue={`≈ ${stats.paidUSDConverted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Estimado)`}
            icon={<DollarSign className="w-5 h-5 text-teal-700" />}
            color="border-teal-600"
            trend={stats.trends.paid}
          />
          <StatCard 
            title="Soma Liquidada" 
            value={stats.totalPaidConsolidatedBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            subValue="Consolidado (vlr operacional)"
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
            color="border-blue-600"
          />
          <StatCard 
            title="A Vencer" 
            value={stats.upcomingCount.toString()} 
            subValue={stats.pendingAmountBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' (pendente)'}
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            color="border-amber-400"
          />
          <StatCard 
            title="Vencidos" 
            value={stats.overdueCount.toString()} 
            subValue={stats.overdueAmountBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' (atrasado)'}
            icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
            color="border-rose-500"
          />
          <StatCard 
            title="Total mês" 
            value={(stats.totalPaidConsolidatedBRL + stats.pendingAmountBRL + stats.overdueAmountBRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            subValue="Comprometido total (estimado)"
            icon={<History className="w-5 h-5 text-slate-600" />}
            color="border-slate-500"
          />
        </div>

        {/* Alertas Financeiros */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  alert.type === 'danger' ? 'bg-rose-50 border-rose-100' : 
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  alert.type === 'danger' ? 'bg-rose-100 text-rose-600' : 
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {alert.type === 'danger' ? <AlertCircle className="w-4 h-4" /> : 
                   alert.type === 'warning' ? <Bell className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${
                    alert.type === 'danger' ? 'text-rose-900' : 
                    alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                  }`}>{alert.message}</h4>
                  <p className="text-xs text-slate-500 mt-1">{alert.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Evolução Mensal ({dashboardYear === 'TODOS' ? new Date().getFullYear() : dashboardYear})</h3>
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Valores em BRL</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    width={65}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total']}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {chartData.monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === getMonthLabel(dashboardMonth) ? '#2563eb' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Distribuição Status</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => {
                      const colors: Record<string, string> = {
                        'PAGO': '#10b981',
                        'A VENCER': '#3b82f6',
                        'VENCIDO': '#ef4444',
                        'ERRO': '#f43f5e',
                        'FREE': '#64748b'
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#cbd5e1'} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Top Services */}
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top 5 Serviços</h4>
                </div>
                <div className="space-y-4 flex-1">
                  {chartData.topServices.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 max-w-[65%]">
                        <span className="flex items-center justify-center text-[10px] font-bold text-blue-600 bg-blue-50 w-5 h-5 rounded-full shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 break-words leading-tight">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-slate-900 block">
                          {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / chartData.topServices[0].value) * 100}%` }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {chartData.topServices.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
                      <Receipt className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs italic">Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Composition by CC */}
              <div className="flex flex-col h-full border-x border-slate-100 px-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className={`p-2 rounded-lg ${
                    activeCompany === 'LIFTERS' ? 'bg-orange-50 text-orange-600' : 
                    activeCompany === 'BPX' ? 'bg-slate-100 text-slate-900' : 'bg-purple-50 text-purple-600'
                  }`}>
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Por Centro de Custo</h4>
                </div>
                <div className="space-y-4">
                  {chartData.byCostCenter.map((item, idx) => {
                    const brand = item.name.toUpperCase();
                    const isLifters = brand.includes('LIFTERS');
                    const isBPX = brand.includes('BPX');
                    const isAcesse = brand.includes('ACESSE');
                    
                    const brandColorClass = isLifters ? 'bg-orange-500' : isBPX ? 'bg-black' : isAcesse ? 'bg-purple-600' : 'bg-blue-500';
                    const brandBgClass = isLifters ? 'bg-orange-50' : isBPX ? 'bg-slate-100' : isAcesse ? 'bg-purple-50' : 'bg-blue-50';

                    return (
                      <div key={idx} className={`relative p-3 ${brandBgClass} rounded-xl border border-slate-100 group overflow-hidden`}>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Categoria</span>
                            <span className="text-xs font-bold text-slate-700">{item.name}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Investimento</span>
                            <span className="text-sm font-black font-mono text-slate-900">
                              {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>
                        <motion.div 
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          className={`absolute left-0 bottom-0 h-1 ${brandColorClass} origin-left opacity-30`}
                          style={{ width: `${(item.value / (stats.totalPaidConsolidatedBRL || 1)) * 100}%` }}
                        />
                      </div>
                    );
                  })}
                  {chartData.byCostCenter.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
                      <PieChartIcon className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs italic">Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Impacto Cambial */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Impacto Cambial</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total em USD</p>
                    <p className="text-xl font-bold text-slate-900">{stats.paidUSD.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Conversão Estimada</p>
                    <p className="text-xl font-bold text-teal-700">{stats.paidUSDConverted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-black rounded uppercase tracking-tighter">
                      Valor Operacional Estimado
                    </span>
                    <p className="text-[9px] text-slate-500 leading-tight mt-2 italic">
                      Conversão baseada na cotação da data do pagamento. O valor final cobrado em fatura pode variar conforme regras bancárias.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Evolução Anual</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.annualData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#1e293b', fontWeight: 600 }}
                    width={60}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={(props: any) => {
                      const { active, payload, label } = props;
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const services = data.servicesBreakdown || {};
                        const total = data.total;
                        
                        return (
                          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
                            <p className="font-bold text-slate-800 mb-2">{label}</p>
                            <div className="space-y-1 mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {Object.entries(services).sort((a: any, b: any) => b[1] - a[1]).map(([name, value]: any, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-4 text-[10px]">
                                  <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getServiceColor(name) }} />
                                    <span className="text-slate-600 truncate max-w-[150px]">{name}:</span>
                                  </span>
                                  <span className="font-bold text-slate-900 whitespace-nowrap">
                                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800">TOTAL:</span>
                              <span className="text-xs font-black text-blue-600">
                                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {months.map((m, idx) => (
                    <Bar 
                      key={m.label} 
                      dataKey={m.label} 
                      stackId="a" 
                      fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                      barSize={60}
                    >
                      <LabelList 
                        dataKey={m.label} 
                        position="center" 
                        content={(props: any) => {
                          const { x, y, width, height, value } = props;
                          if (width < 60 || !value) return null;
                          return (
                            <text 
                              x={x + width / 2} 
                              y={y + height / 2} 
                              fill="#fff" 
                              textAnchor="middle" 
                              dominantBaseline="middle"
                              style={{ fontSize: '10px', fontWeight: 'bold', pointerEvents: 'none', textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
                            >
                              {m.label}: R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    ) : activeTab === 'expenses' ? (
        <div className="space-y-6">
          {/* Filters & Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar serviço..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4 items-start">
              <div className="relative">
                <button 
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 transition-all shadow-sm min-w-[180px] justify-between"
                >
                  <span className="capitalize">
                    {filterMonth === 'TODOS' && filterYear === 'TODOS' 
                      ? 'Todos os Períodos' 
                      : `${getMonthLabel(filterMonth)} ${filterYear === 'TODOS' ? '' : 'de ' + filterYear}`}
                  </span>
                  <Filter className="w-4 h-4 text-slate-400" />
                </button>

                <AnimatePresence>
                  {isDatePickerOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDatePickerOpen(false)} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-2 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-[280px]"
                      >
                        <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-lg">
                          <select 
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="TODOS">Todos os Anos</option>
                            {availableYears.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => setIsYearModalOpen(true)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Novo Ano
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {months.map(m => (
                            <button
                              key={m.value}
                              onClick={() => {
                                setFilterMonth(m.value);
                                setIsDatePickerOpen(false);
                              }}
                              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                filterMonth === m.value
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <button 
                            onClick={() => {
                              setFilterMonth('TODOS');
                              setFilterYear('TODOS');
                              setIsDatePickerOpen(false);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Limpar
                          </button>
                          <button 
                            onClick={() => {
                              const now = new Date();
                              setFilterYear(now.getFullYear().toString());
                              setFilterMonth(now.toISOString().substring(5, 7));
                              setIsDatePickerOpen(false);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Este mês
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleExportReport}
                  className="flex items-center gap-2 text-blue-600 hover:text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors border border-blue-200 hover:border-blue-600"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-bold">Relatório Executivo</span>
                </button>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Exportar CSV</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <FilterSelect 
              label="Status" 
              value={filterStatus} 
              onChange={(v) => setFilterStatus(v as any)}
              options={['TODOS', ...STATUS_OPTIONS]}
            />
            <FilterSelect 
              label="Moeda" 
              value={filterCurrency} 
              onChange={(v) => setFilterCurrency(v as any)}
              options={['TODOS', ...CURRENCIES]}
            />
            <FilterSelect 
              label="Centro de Custo" 
              value={filterCostCenter} 
              onChange={setFilterCostCenter}
              options={['TODOS', ...COST_CENTERS]}
            />
            <FilterSelect 
              label="Cartão" 
              value={filterCard} 
              onChange={setFilterCard}
              options={['TODOS', ...uniqueCards]}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => requestSort('service')}
                  >
                    <div className="flex items-center gap-2">
                      SERVIÇO
                      <SortIcon isSorted={sortConfig.key === 'service'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => requestSort('dueDate')}
                  >
                    <div className="flex items-center gap-2">
                      VENCIMENTO
                      <SortIcon isSorted={sortConfig.key === 'dueDate'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => requestSort('value')}
                  >
                    <div className="flex items-center gap-2">
                      VALOR
                      <SortIcon isSorted={sortConfig.key === 'value'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      STATUS
                      <SortIcon isSorted={sortConfig.key === 'status'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CARTÃO</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CENTRO DE CUSTO</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className={`transition-colors ${getRowColor(expense.status)}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{expense.service}</span>
                          {expense.notes && <span className="text-xs text-slate-400 truncate max-w-[200px]">{expense.notes}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(expense.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-medium text-slate-900">
                            {expense.currency} {expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {expense.currency === 'USD' && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium">
                                ≈ {FinanceService.getExpenseAmountBRL(expense).amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                              <span className="px-1 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold rounded uppercase tracking-tighter border border-slate-200" title="Conversão operacional baseada na data do pagamento ou vencimento">
                                Estimado
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap cursor-help transition-all hover:scale-105 ${getStatusColor(expense.status)}`}
                          title={STATUS_DESCRIPTIONS[expense.status]}
                        >
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>**** {expense.cardLast4}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <CompanyLogo company={expense.company} size="sm" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {expense.status !== 'PAGO' && expense.status !== 'FREE' && (
                            <button 
                              onClick={() => { 
                                setPayingExpense(expense); 
                                setModalValue(expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                setModalExchangeRate(expense.exchangeRate?.toString() || '');
                                
                                // Default to expense due date instead of today
                                setHistoricalRateDate(expense.dueDate);
                                
                                if (expense.currency === 'USD' && !expense.exchangeRate) {
                                  // Fetch historical rate for the due date
                                  fetchHistoricalRate(expense.dueDate);
                                }
                                
                                setIsPayModalOpen(true); 
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Marcar como Pago"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setModalCurrency(expense.currency);
                              setModalValue(expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                              setModalStatus(expense.status);
                              setModalExchangeRate(expense.exchangeRate?.toString() || '');
                              setModalDueDate(expense.dueDate);
                              setModalPaymentDate(expense.paymentDate || '');
                              setModalCostCenter(expense.costCenter);
                              setHistoricalRateDate(expense.paymentDate || expense.dueDate);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhum lançamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-4">
            <Settings className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-xl font-bold text-slate-800">Configurações do Sistema</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Gerenciamento de dados e manutenção para a empresa <strong>{activeCompany}</strong>.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
              <button 
                onClick={handleCleanupDuplicates}
                className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-6 py-4 rounded-xl transition-all font-bold text-sm border border-blue-100"
              >
                <RefreshCw className="w-4 h-4" />
                Limpar Duplicados ({activeCompany})
              </button>
              
              <button 
                onClick={handleResetData}
                className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-6 py-4 rounded-xl transition-all font-bold text-sm border border-rose-100"
              >
                <Trash2 className="w-4 h-4" />
                Resetar Dados ({activeCompany})
              </button>
            </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Informações de Armazenamento</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Os dados são armazenados localmente no seu navegador. Cada empresa possui seu próprio conjunto de dados independente. 
              A limpeza de duplicados remove entradas com o mesmo serviço e mês, priorizando manter aquelas marcadas como "PAGO".
            </p>
          </div>
        </div>
      )}
    </div>
  </main>
</div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Year Modal */}
        <AnimatePresence>
          {isYearModalOpen && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsYearModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-4">Adicionar Novo Ano</h3>
                <input 
                  type="text"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="Ex: 2027"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setIsYearModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddYear}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-200"
                  >
                    Adicionar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Recurring Modal */}
        <AnimatePresence>
          {isRecurringModalOpen && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsRecurringModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">Gerar Recorrentes</h3>
                      <p className="text-xs text-slate-500 font-medium">Empresa: {activeCompany}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsRecurringModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Selecione o mês e ano de destino para replicar os serviços marcados como recorrentes. O sistema não criará duplicatas se o serviço já existir no período selecionado.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mês de Destino</label>
                      <select 
                        value={recurringTargetMonth}
                        onChange={(e) => setRecurringTargetMonth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        {months.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ano de Destino</label>
                      <select 
                        value={recurringTargetYear}
                        onChange={(e) => setRecurringTargetYear(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        {Array.from(new Set([
                          ...availableYears,
                          new Date().getFullYear().toString(),
                          (new Date().getFullYear() + 1).toString()
                        ])).sort().map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-800 leading-relaxed">
                        <strong>Dica:</strong> Se houver lançamentos repetidos indesejados, use o botão <strong>Limpar Duplicados</strong> na tela anterior antes ou depois de gerar.
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateRecurring}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Gerar Lançamentos
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && confirmConfig && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsConfirmModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold text-slate-900">{confirmConfig.title}</h3>
              </div>
              <p className="text-slate-600 mb-8 leading-relaxed">
                {confirmConfig.message}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setIsConfirmModalOpen(false);
                  }}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-rose-200"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">{editingExpense ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveExpense} className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Serviço</label>
                    <input 
                      name="service" 
                      required={modalStatus !== 'FREE'} 
                      defaultValue={editingExpense?.service}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder={modalStatus === 'FREE' ? 'Opcional' : 'Ex: AWS, Netflix, Slack'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Vencimento</label>
                    <input
                      name="dueDate"
                      type="date"
                      required={modalStatus !== 'FREE'}
                      value={modalDueDate}
                      onChange={e => setModalDueDate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Moeda</label>
                    <select 
                      name="currency" 
                      value={modalCurrency}
                      onChange={handleCurrencyChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Valor</label>
                    <div className="relative">
                      <input 
                        name="value" 
                        type="text" 
                        required={modalStatus !== 'FREE'} 
                        value={modalValue}
                        onChange={handleValueChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="0,00"
                      />
                      {modalCurrency === 'USD' && modalValue && modalExchangeRate && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                          ≈ {(parseFloat(modalValue.replace(/\./g, '').replace(',', '.')) * parseFloat(modalExchangeRate)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          <span className="text-[8px] bg-blue-100 px-1 rounded">ESTIMADO</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {modalCurrency === 'USD' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                        Cotação do Dólar (BRL)
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <input 
                              type="date" 
                              value={historicalRateDate}
                              onChange={(e) => {
                                setHistoricalRateDate(e.target.value);
                                fetchHistoricalRate(e.target.value);
                              }}
                              className="text-[10px] bg-transparent border-none outline-none text-slate-600 cursor-pointer"
                              title="Buscar cotação por data"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={fetchExchangeRate}
                            disabled={isFetchingRate}
                            className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold"
                          >
                            <RefreshCw className={`w-3 h-3 ${isFetchingRate ? 'animate-spin' : ''}`} />
                            Hoje
                          </button>
                        </div>
                      </label>
                      <input 
                        name="exchangeRate" 
                        type="number" 
                        step="0.0001" 
                        value={modalExchangeRate}
                        onChange={(e) => setModalExchangeRate(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Opcional (Ex: 5.25)"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select 
                      name="status" 
                      value={modalStatus}
                      onChange={handleStatusChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Final do Cartão (4 dígitos)</label>
                    <input 
                      name="cardLast4" 
                      maxLength={4} 
                      required={modalStatus !== 'FREE'} 
                      defaultValue={editingExpense?.cardLast4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder={modalStatus === 'FREE' ? 'Opcional' : '1234'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Centro de Custos</label>
                    <select
                      name="costCenter"
                      value={modalCostCenter}
                      onChange={e => setModalCostCenter(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {COST_CENTERS.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Data de Pagamento (opcional)</label>
                    <input
                      name="paymentDate"
                      type="date"
                      value={modalPaymentDate}
                      onChange={(e) => {
                        setModalPaymentDate(e.target.value);
                        if (modalCurrency === 'USD') {
                          setHistoricalRateDate(e.target.value);
                          fetchHistoricalRate(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Observações</label>
                  <textarea 
                    name="notes" 
                    rows={3} 
                    defaultValue={editingExpense?.notes}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                    placeholder="Detalhes adicionais..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="isRecurring" 
                    id="isRecurring" 
                    defaultChecked={editingExpense?.isRecurring}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">Lançamento Recorrente</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Pay Modal */}
      <AnimatePresence>
        {isPayModalOpen && payingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-emerald-600 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Confirmar Pagamento</h2>
                <button onClick={() => setIsPayModalOpen(false)} className="text-emerald-100 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleQuickPay} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">Serviço</p>
                    <p className="font-bold text-slate-900">{payingExpense.service}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Data de Pagamento</label>
                    <input 
                      name="paymentDate" 
                      type="date" 
                      required 
                      defaultValue={payingExpense.dueDate}
                      onChange={(e) => {
                        if (payingExpense.currency === 'USD') {
                          setHistoricalRateDate(e.target.value);
                          fetchHistoricalRate(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Valor Pago ({payingExpense.currency})</label>
                    <div className="relative">
                      <input 
                        ref={quickPayInputRef}
                        name="value" 
                        type="text" 
                        required 
                        value={modalValue}
                        onChange={handleValueChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="0,00"
                      />
                      {payingExpense.currency === 'USD' && modalValue && modalExchangeRate && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                          ≈ {(parseFloat(modalValue.replace(/\./g, '').replace(',', '.')) * parseFloat(modalExchangeRate)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          <span className="text-[8px] bg-emerald-100 px-1 rounded">ESTIMADO</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {payingExpense.currency === 'USD' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
                      Cotação do Dólar (BRL)
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <input 
                            type="date" 
                            value={historicalRateDate}
                            onChange={(e) => {
                              setHistoricalRateDate(e.target.value);
                              fetchHistoricalRate(e.target.value);
                            }}
                            className="text-[10px] bg-transparent border-none outline-none text-slate-600 cursor-pointer"
                            title="Buscar cotação por data"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={fetchExchangeRate}
                          disabled={isFetchingRate}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold"
                        >
                          <RefreshCw className={`w-3 h-3 ${isFetchingRate ? 'animate-spin' : ''}`} />
                          Hoje
                        </button>
                      </div>
                    </label>
                    <input 
                      name="exchangeRate" 
                      type="number" 
                      step="0.0001" 
                      value={modalExchangeRate}
                      onChange={(e) => setModalExchangeRate(e.target.value)}
                      className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                      placeholder="Opcional (Ex: 5.25)"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Observação Adicional</label>
                  <input 
                    name="notes" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="Ex: Pago com bônus, desconto, etc."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-md"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Subcomponents ---

function SortIcon({ isSorted, direction }: { isSorted: boolean, direction: 'asc' | 'desc' }) {
  if (!isSorted) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  return direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
          <RefreshCw className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-200">Rtech Control</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Preparando o ambiente</h1>
        <p className="mt-3 text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}

function ResetPasswordScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Não foi possível redefinir a senha. Solicite um novo link de recuperação.');
    } else {
      setSuccess(true);
      setTimeout(onSuccess, 3000);
    }
    setIsSubmitting(false);
  };

  const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 placeholder:text-slate-500';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_60%)] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/40">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">RTECH CONTROL</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Gestão de Pagamentos Corporativos</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-sm">
          <div className="mb-5">
            <h2 className="text-base font-bold text-white">Criar nova senha</h2>
            <p className="text-xs text-slate-400 mt-1">Escolha uma senha segura para sua conta.</p>
          </div>

          {success ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              <p className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> Senha redefinida!
              </p>
              <p className="text-xs leading-relaxed text-emerald-200">
                Sua senha foi atualizada com sucesso. Redirecionando para o login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className={labelClass}>Nova Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Repita a nova senha"
                />
              </div>
              {error && (
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 mt-1"
              >
                {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar nova senha'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const ALLOWED_SIGNUP_DOMAINS = ['twinfo.io', 'lifters.tech'];

function LoginScreen() {
  const [mode, setMode] = React.useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const switchMode = (next: 'login' | 'signup' | 'forgot') => {
    setMode(next);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    if (!ALLOWED_SIGNUP_DOMAINS.includes(domain)) {
      setError('Não foi possível realizar o cadastro.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError('Não foi possível realizar o cadastro.');
    } else {
      setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar o acesso à plataforma.');
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setSuccess('Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em breve.');
    setIsSubmitting(false);
  };

  const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 placeholder:text-slate-500';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider';

  const formHandler = mode === 'login' ? handleLogin : mode === 'signup' ? handleSignUp : handleForgotPassword;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_60%)] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/40">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">RTECH CONTROL</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Gestão de Pagamentos Corporativos</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-sm">

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-white">
              {mode === 'login' && 'Entrar na plataforma'}
              {mode === 'signup' && 'Criar sua conta'}
              {mode === 'forgot' && 'Recuperar senha'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login' && 'Acesse com suas credenciais corporativas.'}
              {mode === 'signup' && 'Preencha os dados para criar seu acesso.'}
              {mode === 'forgot' && 'Enviaremos um link de redefinição por e-mail.'}
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100 mb-4">
              <p className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> Pronto!
              </p>
              <p className="text-xs leading-relaxed text-emerald-200">{success}</p>
            </div>
          ) : (
            <form onSubmit={formHandler} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className={labelClass}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  className={inputClass}
                  placeholder="voce@empresa.com"
                />
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div>
                  <label className={labelClass}>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className={inputClass}
                    placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                  />
                </div>
              )}

              {/* Confirm password */}
              {mode === 'signup' && (
                <div>
                  <label className={labelClass}>Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="Repita a senha"
                  />
                </div>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-right -mt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 mt-1"
              >
                {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>
                  {isSubmitting
                    ? (mode === 'login' ? 'Entrando...' : mode === 'signup' ? 'Cadastrando...' : 'Enviando...')
                    : (mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link de recuperação')}
                </span>
              </button>
            </form>
          )}

          {/* Footer navigation */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center space-y-2">
            {mode !== 'login' ? (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar para o login
              </button>
            ) : (
              <p className="text-sm text-slate-400">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Cadastre-se
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyLogo({ company, size = 'md' }: { company: Company; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const getLogoSrc = (company: Company) => {
    switch (company) {
      case 'LIFTERS': return '/lifters_laranja.png';
      case 'ACESSE': return '/Logo_Acesse1.png';
      case 'BPX': return '/BPX_Preto.png';
      default: return '';
    }
  };

  const getBgColor = (company: Company) => {
    switch (company) {
      case 'LIFTERS': return 'bg-orange-500';
      case 'ACESSE': return 'bg-purple-600';
      case 'BPX': return 'bg-black';
      default: return 'bg-slate-200';
    }
  };

  const getAbbreviation = (company: Company) => {
    switch (company) {
      case 'LIFTERS': return 'L';
      case 'ACESSE': return 'A';
      case 'BPX': return 'BPX';
      default: return '';
    }
  };

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden flex items-center justify-center ${getBgColor(company)} shadow-sm border border-slate-200 relative`}>
      {!hasError && (
        <img 
          src={getLogoSrc(company)} 
          alt={company} 
          className={`w-full h-full object-contain p-0.5 transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
      {(!isLoaded || hasError) && (
        <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-tighter pointer-events-none">
          {getAbbreviation(company)}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color, trend }: { 
  title: string, 
  value: string, 
  subValue?: string, 
  icon: React.ReactNode, 
  color: string,
  trend?: { value: number, isUp: boolean }
}) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${color} hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-xl">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend.isUp ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} px-2 py-0.5 rounded-full`}>
            {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.isUp ? '+' : '-'}{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 font-medium mt-1">{subValue}</p>}
      </div>
      <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full bg-current opacity-20 w-3/4 ${color.replace('border-', 'bg-')}`}></div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-semibold text-sm tracking-wide">{label}</span>
      )}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill"
          className="absolute right-2 w-1 h-5 bg-white/40 rounded-full"
        />
      )}
    </button>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
