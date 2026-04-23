/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as FinanceService from './finance-service';
import { SaaSExpense } from './finance-service';

export class ExportService {
  /**
   * Generates a monthly closing report in HTML format.
   */
  static generateMonthlyReportHTML(
    company: string,
    year: string,
    month: string,
    expenses: SaaSExpense[]
  ): string {
    // Calculate required metrics on the fly for the provided dataset
    const stats = FinanceService.calculateDashboardMetrics(expenses);
    const topServices = FinanceService.calculateServiceRanking(expenses);
    const byCostCenter = FinanceService.groupExpensesByField(expenses, 'costCenter');
    const alerts = FinanceService.generateFinanceAlerts(expenses);

    const today = new Date().toLocaleDateString('pt-BR');
    const monthLabels: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
      'TODOS': 'Todos os Meses'
    };
    
    const periodLabel = month === 'TODOS' ? `Ano ${year}` : `${monthLabels[month]} de ${year}`;
    
    // Formatting helpers
    const fCurrency = (val: number, currency: string = 'BRL') => 
      val.toLocaleString('pt-BR', { style: 'currency', currency });

    const totalCommitted = stats.totalPaidConsolidatedBRL + stats.pendingAmountBRL + stats.overdueAmountBRL;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Fechamento Mensal — ${company} | ${periodLabel}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 11px; line-height: 1.5; }

  .page { max-width: 210mm; margin: 0 auto; padding: 24px 28px; }
  .page-break { page-break-before: always; padding-top: 24px; }

  /* Header */
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; }
  .report-header h1 { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
  .report-header .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
  .report-header .meta { text-align: right; font-size: 10px; color: #64748b; line-height: 1.6; }
  .report-header .meta strong { color: #0f172a; }

  /* Section */
  .section { margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }

  /* KPI cards */
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
  .kpi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .kpi-card .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; }
  .kpi-card .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .kpi-card .kpi-sub { font-size: 8px; color: #94a3b8; margin-top: 2px; }
  
  /* Color Themes */
  .kpi-green { border-color: #22c55e; background: #f0fdf4; }
  .kpi-green .kpi-value { color: #16a34a; }
  
  .kpi-teal { border-color: #0d9488; background: #f0fdfa; }
  .kpi-teal .kpi-value { color: #0f766e; }
  
  .kpi-blue { border-color: #2563eb; background: #eff6ff; }
  .kpi-blue .kpi-value { color: #1d4ed8; }
  
  .kpi-orange { border-color: #f59e0b; background: #fffbeb; }
  .kpi-orange .kpi-value { color: #d97706; }
  
  .kpi-red { border-color: #ef4444; background: #fef2f2; }
  .kpi-red .kpi-value { color: #dc2626; }
  
  .kpi-dark { border-color: #1e293b; background: #f8fafc; }
  .kpi-dark .kpi-value { color: #0f172a; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin-bottom: 6px; }
  th { background: #0f172a; color: #fff; padding: 6px 8px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .table-wrap { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 10px; }

  /* Summary box */
  .summary-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; font-size: 11px; color: #334155; margin-bottom: 15px; }

  /* Footer */
  .report-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="page">
  <div class="report-header">
    <div>
      <h1>Relatório Executivo de Fechamento</h1>
      <div class="subtitle">${company} — Controle de Despesas com Cartão de Crédito</div>
    </div>
    <div class="meta">
      <strong>Data de Emissão:</strong> ${today}<br>
      <strong>Período:</strong> ${periodLabel}<br>
      <strong>Status:</strong> ${stats.overdueCount > 0 ? 'PENDENTE' : 'REGULAR'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Resumo do Mês</div>
    <div class="summary-box">
      Durante o período de <strong>${periodLabel}</strong>, a empresa <strong>${company}</strong> registrou um volume total de compromissos financeiros de <strong>${fCurrency(totalCommitted)}</strong>. 
      Deste total, <strong>${fCurrency(stats.totalPaidConsolidatedBRL)}</strong> já foram liquidados (incluindo conversões de USD). 
      Atualmente existem <strong>${stats.overdueCount}</strong> itens vencidos somando <strong>${fCurrency(stats.overdueAmountBRL)}</strong> e 
      <strong>${stats.upcomingCount}</strong> itens a vencer somando <strong>${fCurrency(stats.pendingAmountBRL)}</strong>.
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dashboard Financeiro</div>
    <div class="kpi-grid">
      <div class="kpi-card kpi-green">
        <div class="kpi-value">${fCurrency(stats.paidBRL)}</div>
        <div class="kpi-label">Total Pago (BRL)</div>
      </div>
      <div class="kpi-card kpi-teal">
        <div class="kpi-value">${fCurrency(stats.paidUSD, 'USD')}</div>
        <div class="kpi-label">Efetivado (USD)</div>
        <div class="kpi-sub">≈ ${fCurrency(stats.paidUSDConverted)}</div>
      </div>
      <div class="kpi-card kpi-blue">
        <div class="kpi-value">${fCurrency(stats.totalPaidConsolidatedBRL)}</div>
        <div class="kpi-label">Soma Liquidada</div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-value">${stats.upcomingCount}</div>
        <div class="kpi-label">Contas a Vencer</div>
        <div class="kpi-sub">${fCurrency(stats.pendingAmountBRL)}</div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-value">${stats.overdueCount}</div>
        <div class="kpi-label">Contas Vencidas</div>
        <div class="kpi-sub">${fCurrency(stats.overdueAmountBRL)}</div>
      </div>
      <div class="kpi-card kpi-dark">
        <div class="kpi-value">${stats.errorCount}</div>
        <div class="kpi-label">Contas com Erro</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Top 5 Serviços por Investimento</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Posição</th>
            <th>Serviço</th>
            <th>Valor Consolidado (BRL)</th>
            <th>% do Total</th>
          </tr>
        </thead>
        <tbody>
          ${topServices.map((s, i) => `
            <tr>
              <td>${i + 1}º</td>
              <td><strong>${s.name}</strong></td>
              <td>${fCurrency(s.value)}</td>
              <td>${((s.value / (stats.totalPaidConsolidatedBRL || 1)) * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Distribuição por Centro de Custo</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Centro de Custo</th>
            <th>Total Alocado (BRL)</th>
            <th>Participação</th>
          </tr>
        </thead>
        <tbody>
          ${byCostCenter.map(cc => `
            <tr>
              <td><strong>${cc.name}</strong></td>
              <td>${fCurrency(cc.value)}</td>
              <td>${((cc.value / (totalCommitted || 1)) * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="page-break"></div>
  
  <div class="section">
    <div class="section-title">Listagem Detalhada de Lançamentos (${expenses.length})</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Vencimento</th>
            <th>Pagamento</th>
            <th>Valor Orig.</th>
            <th>Cotação</th>
            <th>Total (BRL)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(e => {
            const vBrl = e.currency === 'BRL' ? e.value : e.value * (e.exchangeRate || 5.0);
            return `
              <tr>
                <td><strong>${e.service}</strong></td>
                <td>${e.dueDate.split('-').reverse().join('/')}</td>
                <td>${e.paymentDate ? e.paymentDate.split('-').reverse().join('/') : '—'}</td>
                <td>${fCurrency(e.value, e.currency)}</td>
                <td>${e.currency === 'USD' ? (e.exchangeRate || '5.00 (Est.)') : '—'}</td>
                <td><strong>${fCurrency(vBrl)}</strong></td>
                <td>${e.status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  ${alerts.length > 0 ? `
  <div class="section">
    <div class="section-title">Alertas e Observações</div>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px;">
      <ul style="padding-left: 15px; font-size: 10px; color: #92400e;">
        ${alerts.map(a => `<li><strong>${a.message}:</strong> ${a.details}</li>`).join('')}
      </ul>
    </div>
  </div>
  ` : ''}

  <div class="report-footer">
    <span>Gerado por RTECH CONTROL — Sistema de Gestão Financeira</span>
    <span>Página 1 de 2</span>
  </div>
</div>
</body>
</html>`;
  }

  /**
   * Triggers a download of the report as an HTML file.
   */
  static downloadReport(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
