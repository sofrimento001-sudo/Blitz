export interface BlitzRecord {
  id: string;
  dataChegada: string; // YYYY-MM-DD
  dataBloqueio: string; // YYYY-MM-DD
  fabrica: string;
  carreta: string;
  nota: string;
  codigoProduto: string;
  produto: string;
  qtdPuxada: number;
  qtdRetida: number;
  tipoOcorrencia: string;
  motivoRetrabalho: string;
  responsavel: string;
  supervisor?: string;
  origem?: string;
  status: 'Liberado' | 'Liberado Parcial' | 'Bloqueado' | 'Em Análise' | 'Retrabalho Concluído' | 'Descarte' | string;
  observacao?: string;
}

export interface FilterState {
  dataInicio: string;
  dataFim: string;
  fabrica: string[];
  carreta: string[];
  status: string[];
  tipoOcorrencia: string[];
  produto: string[];
  searchTerm: string;
  metaStatus?: 'all' | 'inside' | 'outside';
}

export interface FilterOptions {
  fabricas: string[];
  carretas: string[];
  statuses: string[];
  tiposOcorrencia: string[];
  produtos: string[];
}

export interface ThresholdConfig {
  lowRetentionMax: number; // e.g. 2.5% -> below is Green (Baixa)
  midRetentionMax: number; // e.g. 5.0% -> below is Yellow (Atenção), above is Red (Alta)
}

export interface KpiSummary {
  totalOcorrencias: number;
  totalQtdPuxada: number;
  totalQtdRetida: number;
  percentualRetencao: number;
  mediaDiasAteBloqueio: number;
}

export interface TypeDistribution {
  tipo: string;
  quantidade: number;
  qtdRetida: number;
  percentual: number;
}

export interface FactoryDistribution {
  fabrica: string;
  ocorrencias: number;
  qtdPuxada: number;
  qtdRetida: number;
  percentual: number;
}

export interface StatusDistribution {
  status: string;
  ocorrencias: number;
  qtdRetida: number;
  percentual: number;
}

export interface DateEvolution {
  data: string; // Display formatted DD/MM
  dataIso: string;
  qtdPuxada: number;
  qtdRetida: number;
  percentualRetida: number;
  ocorrencias: number;
}

export interface ProductRanking {
  codigo: string;
  produto: string;
  qtdPuxada: number;
  qtdRetida: number;
  percentualRetida: number;
  ocorrencias: number;
}

export interface MonthTrendProjection {
  totalDaysInMonth: number;
  daysRecorded: number;
  lastRecordedDay: number;
  daysRemaining: number;
  percentMonthElapsed: number;
  dailyAvgPuxada: number;
  dailyAvgRetida: number;
  projectedPuxada: number;
  projectedRetida: number;
  projectedPercentualRetida: number;
  isMonthClosed: boolean; // if daysRecorded covers the full month
  optimisticPercentualRetida: number; // if remaining days have 30% less issues
  pessimisticPercentualRetida: number; // if remaining days have 30% more issues
}

export interface MonthSummary {
  monthKey: string; // e.g. "2026-01"
  monthName: string; // e.g. "Janeiro/2026"
  shortName: string; // e.g. "Jan/26"
  year: number;
  month: number;
  qtdPuxada: number;
  qtdRetida: number;
  percentualRetida: number;
  totalOcorrencias: number;
  notasCount: number;
  carretasCount: number;
  mediaDiasBloqueio: number;
  principalTipo: string;
  principalFabrica: string;
  produtoMaisRetido: string;
  projection: MonthTrendProjection;
}

export interface ExecutiveInsights {
  principalTipoOcorrencia: { tipo: string; count: number; percentual: number };
  fabricaMaiorOcorrencias: { fabrica: string; count: number; percentual: number };
  produtoMaiorRetencao: { produto: string; qtdRetida: number; percentual: number };
  maiorPercentualRetencao: { produto: string; percentual: number; qtdRetida: number; qtdPuxada: number };
  diaMaiorRetencao: { data: string; qtdRetida: number; qtdPuxada: number };
  qtdTotalRetida: number;
  percentualGeralRetencao: number;
  mediaDiasBloqueio: number;
  pontosDeAtencao: string[];
}
