import type { Company, SaaSExpense } from './finance-service';

export const DEFAULT_AVAILABLE_YEARS = [2025, 2026];

const createId = (company: Company, service: string, dueDate: string, index: number) =>
  `${company}-${service}-${dueDate}-${index}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');

export const INITIAL_TEMPLATES: Record<Company, Partial<SaaSExpense>[]> = {
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
  ],
};

export const generateFullYearSeedData = (year: string, company: Company): SaaSExpense[] => {
  const templates = INITIAL_TEMPLATES[company];
  const fullData: SaaSExpense[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0');
    templates.forEach((template, index) => {
      const day = (template.dueDate || '2026-01-01').substring(8, 10);
      const dueDate = `${year}-${monthStr}-${day}`;

      fullData.push({
        id: createId(company, template.service || 'service', dueDate, index),
        company,
        service: template.service || '',
        dueDate,
        paymentDate: undefined,
        currency: template.currency || 'BRL',
        value: template.value || 0,
        exchangeRate: undefined,
        status: 'A VENCER',
        cardLast4: template.cardLast4 || '',
        notes: '',
        costCenter: template.costCenter || '',
        isRecurring: true,
        conversionDate: undefined,
        isEstimated: undefined,
      });
    });
  }

  return fullData;
};
