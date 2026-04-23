# Product Requirements Document (PRD): Controle de Pagamentos

## 1. Visão Geral do Projeto
O **Controle de Pagamentos** é uma aplicação web robusta desenvolvida para substituir planilhas complexas na gestão de custos de ferramentas SaaS (Software as a Service) e outros pagamentos corporativos realizados via cartões de crédito. A aplicação foca em centralizar o controle de múltiplas empresas, permitindo o monitoramento de vencimentos, status de pagamento e conversão de moedas estrangeiras em tempo real.

## 2. Objetivos do Negócio
- **Centralização**: Gerenciar os custos de três empresas distintas (LIFTERS, BPX, ACESSE) em uma única interface.
- **Eficiência Operacional**: Automatizar a geração de lançamentos recorrentes e facilitar a confirmação de pagamentos.
- **Transparência Financeira**: Fornecer dashboards claros com totais pagos em BRL e USD, incluindo conversão automática baseada na cotação do dia.
- **Segurança de Dados**: Operar 100% no navegador com persistência local (`localStorage`), garantindo privacidade e rapidez.

## 3. Público-Alvo
- Gestores Financeiros e de Operações.
- Responsáveis por infraestrutura de TI e assinaturas SaaS.
- Administradores de empresas do grupo (Lifters, BPX, Acesse).

## 4. Requisitos Funcionais

### 4.1. Gestão Multi-Empresa
- **Seletor de Empresa**: Alternância instantânea entre os módulos LIFTERS, BPX e ACESSE.
- **Isolamento de Dados**: Filtros, dashboards e tabelas exibem apenas dados da empresa selecionada.
- **Persistência de Contexto**: A última empresa selecionada é lembrada ao recarregar a página.

### 4.2. Gestão de Lançamentos (SaaS/Custos)
- **CRUD Completo**: Adicionar, editar e excluir lançamentos com campos detalhados:
  - Serviço (Ferramenta)
  - Vencimento (Data)
  - Data de Pagamento (Opcional)
  - Moeda (BRL ou USD)
  - Valor
  - Cotação do Dólar (Obrigatório para USD)
  - Status (PENDENTE, PAGO, FREE, ERRO)
  - Final do Cartão (4 dígitos)
  - Centro de Custo (Lifters, BPX, Acesse)
  - Observações
  - Flag de Recorrência

### 4.3. Dashboard e Estatísticas
- **Cards de Resumo**:
  - Total Pago em BRL.
  - Total Pago em USD (com exibição do valor convertido para BRL).
  - Contador de pagamentos Pendentes.
  - Contador de pagamentos com Erro.

### 4.4. Filtros e Busca
- **Busca Global**: Pesquisa por nome do serviço.
- **Filtro Temporal**: Seleção de mês específico ou visualização de "Todos os Meses".
- **Filtros de Atributos**: Status, Moeda, Centro de Custo e Final do Cartão.

### 4.5. Automação e Exportação
- **Geração de Recorrentes**: Criar automaticamente os lançamentos do próximo mês com base nos itens marcados como recorrentes.
- **Pagamento Rápido**: Modal simplificado para confirmar pagamento, atualizar valor final e inserir cotação do dólar.
- **Exportação CSV**: Download dos dados filtrados para integração com outros sistemas financeiros.

## 5. Requisitos Não Funcionais
- **Performance**: Interface reativa com transições suaves (Motion).
- **Responsividade**: Layout adaptável para desktop e dispositivos móveis.
- **Offline-First**: Funcionamento sem dependência de APIs externas para as funcionalidades core.
- **Usabilidade**: Código de cores intuitivo para status (Verde = Pago, Amarelo = Pendente, Vermelho = Erro).

## 6. Arquitetura Técnica
- **Frontend**: React 19 com TypeScript.
- **Estilização**: Tailwind CSS 4.
- **Ícones**: Lucide React.
- **Animações**: Motion (framer-motion).
- **Armazenamento**: LocalStorage API.
- **Build Tool**: Vite.

## 7. Estrutura de Dados (Interface Principal)
```typescript
interface SaaSExpense {
  id: string;
  company: 'LIFTERS' | 'BPX' | 'ACESSE';
  dueDate: string;
  paymentDate?: string;
  service: string;
  currency: 'BRL' | 'USD';
  value: number;
  exchangeRate?: number;
  status: 'PENDENTE' | 'PAGO' | 'FREE' | 'ERRO';
  cardLast4: string;
  notes: string;
  costCenter: 'Lifters' | 'BPX' | 'Acesse';
  isRecurring: boolean;
}
```

## 8. Roadmap Futuro (Sugestões)
- Integração com Firebase para sincronização multi-dispositivo.
- Gráficos de evolução mensal de custos por centro de custo.
- Alertas de vencimento via notificações do navegador.
- Anexação de comprovantes de pagamento (Base64).

---
**Status do Documento**: Versão 1.0 - Finalizado e Implementado.
