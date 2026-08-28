import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  TrendingUp,
  Building2,
  Package,
  Clock,
  FileCheck2,
  Truck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Target,
  BarChart3,
  Percent,
  Activity,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { MonthSummary, ThresholdConfig, BlitzRecord, FilterState } from '../types';
import { formatNumber, formatPercent, formatDateShortBR, formatDateBR, normalizeDateToIso } from '../utils/formatters';

interface MonthlyConsolidationProps {
  records?: BlitzRecord[];
  filteredRecords?: BlitzRecord[];
  monthSummaries: MonthSummary[];
  thresholds: ThresholdConfig;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  activeDateFilter?: { dataInicio: string; dataFim: string };
  onApplyMonthFilter: (monthKey: string) => void;
  onClearMonthFilter: () => void;
}

// Linear regression helper for trend line (y = a*x + b)
function calculateLinearTrendLine(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [values[0]];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    const avg = sumY / n;
    return values.map(() => avg);
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) => Math.max(0, parseFloat((slope * i + intercept).toFixed(3))));
}

// Helper to get week info from ISO date (YYYY-MM-DD)
function getWeekInfo(dateStr: string): { weekKey: string; shortLabel: string; fullLabel: string } {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, d);

  // Get Monday
  const dayOfWeek = date.getDay(); // 0: Sunday, 1: Monday...
  const diffToMon = (dayOfWeek + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMon);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const pad = (n: number) => String(n).padStart(2, '0');
  const monStr = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
  const sunStr = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}`;

  // Week number
  const firstJan = new Date(monday.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((monday.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7);

  return {
    weekKey: `${monday.getFullYear()}-W${pad(weekNum)}`,
    shortLabel: `Sem ${weekNum} (${monStr})`,
    fullLabel: `Semana ${weekNum} (${monStr} a ${sunStr})`,
  };
}

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

export const MonthlyConsolidation: React.FC<MonthlyConsolidationProps> = ({
  records = [],
  filteredRecords,
  monthSummaries,
  thresholds,
  filters,
  onFilterChange,
  activeDateFilter,
}) => {
  // Use filteredRecords if provided, fallback to records
  const activeRecords = useMemo(() => {
    return filteredRecords !== undefined ? filteredRecords : records;
  }, [filteredRecords, records]);

  const metaLimit = thresholds.midRetentionMax || 5.0;

  // Determine span of days in activeRecords or date filters
  const dateRangeStats = useMemo(() => {
    if (activeRecords.length === 0) return { daysCount: 0, distinctMonths: 0 };
    const dates = activeRecords
      .map((r) => normalizeDateToIso(r.dataChegada || r.dataBloqueio))
      .filter(Boolean)
      .sort();
    const months = new Set(dates.map((d) => d.slice(0, 7)));
    const uniqueDays = new Set(dates);
    return {
      daysCount: uniqueDays.size,
      distinctMonths: months.size,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
    };
  }, [activeRecords]);

  // Aggregation Granularity: 'daily' (por dia), 'weekly' (por semana), 'monthly' (por mês)
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Automatically adjust default granularity when filter scope changes drastically
  useEffect(() => {
    if (dateRangeStats.distinctMonths > 1 && dateRangeStats.daysCount > 35) {
      setGranularity('monthly');
    } else if (dateRangeStats.daysCount > 14) {
      setGranularity('weekly');
    } else {
      setGranularity('daily');
    }
  }, [dateRangeStats.distinctMonths, dateRangeStats.daysCount, filters?.dataInicio, filters?.dataFim]);

  // Dynamic Header Title & Period description
  const periodTitle = useMemo(() => {
    if (filters?.dataInicio && filters?.dataFim) {
      if (filters.dataInicio === filters.dataFim) {
        return `Dia ${formatDateBR(filters.dataInicio)}`;
      }
      const startM = filters.dataInicio.slice(0, 7);
      const endM = filters.dataFim.slice(0, 7);
      if (startM === endM) {
        const [y, m] = startM.split('-');
        const monthFull = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('pt-BR', {
          month: 'long',
          year: 'numeric',
        });
        return `${monthFull.charAt(0).toUpperCase() + monthFull.slice(1)} (${formatDateBR(filters.dataInicio)} a ${formatDateBR(filters.dataFim)})`;
      }
      return `${formatDateBR(filters.dataInicio)} a ${formatDateBR(filters.dataFim)}`;
    }
    if (filters?.dataInicio) {
      return `A partir de ${formatDateBR(filters.dataInicio)}`;
    }
    return 'Visão Consolidada Geral (Todos os Períodos)';
  }, [filters]);

  // Consolidated Metrics for the active filtered records
  const metrics = useMemo(() => {
    let totalPuxada = 0;
    let totalRetida = 0;
    const notasSet = new Set<string>();
    const carretasSet = new Set<string>();
    const tipoMap = new Map<string, number>();
    const fabricaMap = new Map<string, number>();
    const prodMap = new Map<string, number>();
    const daysSet = new Set<string>();

    activeRecords.forEach((r) => {
      const puxada = Number(r.qtdPuxada) || 0;
      const retida = Number(r.qtdRetida) || 0;
      totalPuxada += puxada;
      totalRetida += retida;

      if (r.nota) notasSet.add(r.nota);
      if (r.carreta) carretasSet.add(r.carreta);
      const isoDate = normalizeDateToIso(r.dataChegada || r.dataBloqueio);
      if (isoDate) daysSet.add(isoDate);

      if (r.tipoOcorrencia) {
        tipoMap.set(r.tipoOcorrencia, (tipoMap.get(r.tipoOcorrencia) || 0) + (retida > 0 ? retida : 1));
      }
      if (r.fabrica) {
        fabricaMap.set(r.fabrica, (fabricaMap.get(r.fabrica) || 0) + (retida > 0 ? retida : 1));
      }
      if (r.produto) {
        prodMap.set(r.produto, (prodMap.get(r.produto) || 0) + retida);
      }
    });

    const percentualRetida = totalPuxada > 0 ? (totalRetida / totalPuxada) * 100 : 0;

    // Sort maps to get top items
    const principalTipo = Array.from(tipoMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EMBALAGEM AVARIADA';
    const principalFabrica = Array.from(fabricaMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ITAPISSUMA';
    const produtoMaisRetido = Array.from(prodMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'SKOL LITRINHO';

    const distinctDays = Math.max(1, daysSet.size);
    const mediaDiariaPuxada = totalPuxada / distinctDays;
    const mediaDiariaRetida = totalRetida / distinctDays;

    return {
      totalPuxada,
      totalRetida,
      percentualRetida,
      notasCount: notasSet.size,
      carretasCount: carretasSet.size,
      totalOcorrencias: activeRecords.length,
      principalTipo,
      principalFabrica,
      produtoMaisRetido,
      distinctDays,
      mediaDiariaPuxada,
      mediaDiariaRetida,
    };
  }, [activeRecords]);

  // =========================================================================
  // 1. DATA GROUPING FOR CHARTS (DAILY / WEEKLY / MONTHLY)
  // =========================================================================

  // Daily Chart Data
  const dailyData = useMemo(() => {
    if (activeRecords.length === 0) return [];

    const dayMap = new Map<string, { qtdPuxada: number; qtdRetida: number; ocorrencias: number }>();

    activeRecords.forEach((r) => {
      const dayIso = normalizeDateToIso(r.dataChegada || r.dataBloqueio) || '2026-08-28';
      const cur = dayMap.get(dayIso) || { qtdPuxada: 0, qtdRetida: 0, ocorrencias: 0 };
      cur.qtdPuxada += Number(r.qtdPuxada) || 0;
      cur.qtdRetida += Number(r.qtdRetida) || 0;
      cur.ocorrencias += 1;
      dayMap.set(dayIso, cur);
    });

    const sortedDays = Array.from(dayMap.keys()).sort();

    const rawList = sortedDays.map((dayIso) => {
      const val = dayMap.get(dayIso)!;
      const percentual = val.qtdPuxada > 0 ? (val.qtdRetida / val.qtdPuxada) * 100 : 0;
      const parts = dayIso.split('-');
      const dayNum = parts[2] || '01';
      const monthNum = parts[1] || '01';

      return {
        key: dayIso,
        label: `${dayNum}/${monthNum}`,
        fullDate: formatDateShortBR(dayIso),
        qtdPuxada: val.qtdPuxada,
        qtdRetida: val.qtdRetida,
        percentualRetida: parseFloat(percentual.toFixed(2)),
        ocorrencias: val.ocorrencias,
      };
    });

    const retencaoTrends = calculateLinearTrendLine(rawList.map((d) => d.percentualRetida));
    const puxadaTrends = calculateLinearTrendLine(rawList.map((d) => d.qtdPuxada));
    const retidaTrends = calculateLinearTrendLine(rawList.map((d) => d.qtdRetida));

    return rawList.map((item, idx) => ({
      ...item,
      tendenciaRetencao: retencaoTrends[idx],
      tendenciaPuxada: Math.round(puxadaTrends[idx]),
      tendenciaRetida: Math.round(retidaTrends[idx]),
      metaRetencao: thresholds.lowRetentionMax,
    }));
  }, [activeRecords, thresholds.lowRetentionMax]);

  // Weekly Chart Data
  const weeklyData = useMemo(() => {
    if (activeRecords.length === 0) return [];

    const weekMap = new Map<
      string,
      { qtdPuxada: number; qtdRetida: number; ocorrencias: number; label: string; fullLabel: string }
    >();

    activeRecords.forEach((r) => {
      const dayIso = normalizeDateToIso(r.dataChegada || r.dataBloqueio) || '2026-08-28';
      const info = getWeekInfo(dayIso);
      const cur = weekMap.get(info.weekKey) || {
        qtdPuxada: 0,
        qtdRetida: 0,
        ocorrencias: 0,
        label: info.shortLabel,
        fullLabel: info.fullLabel,
      };
      cur.qtdPuxada += Number(r.qtdPuxada) || 0;
      cur.qtdRetida += Number(r.qtdRetida) || 0;
      cur.ocorrencias += 1;
      weekMap.set(info.weekKey, cur);
    });

    const sortedWeeks = Array.from(weekMap.keys()).sort();

    const rawList = sortedWeeks.map((wKey) => {
      const val = weekMap.get(wKey)!;
      const percentual = val.qtdPuxada > 0 ? (val.qtdRetida / val.qtdPuxada) * 100 : 0;

      return {
        key: wKey,
        label: val.label,
        fullDate: val.fullLabel,
        qtdPuxada: val.qtdPuxada,
        qtdRetida: val.qtdRetida,
        percentualRetida: parseFloat(percentual.toFixed(2)),
        ocorrencias: val.ocorrencias,
      };
    });

    const retencaoTrends = calculateLinearTrendLine(rawList.map((d) => d.percentualRetida));
    const puxadaTrends = calculateLinearTrendLine(rawList.map((d) => d.qtdPuxada));
    const retidaTrends = calculateLinearTrendLine(rawList.map((d) => d.qtdRetida));

    return rawList.map((item, idx) => ({
      ...item,
      tendenciaRetencao: retencaoTrends[idx],
      tendenciaPuxada: Math.round(puxadaTrends[idx]),
      tendenciaRetida: Math.round(retidaTrends[idx]),
      metaRetencao: thresholds.lowRetentionMax,
    }));
  }, [activeRecords, thresholds.lowRetentionMax]);

  // Monthly Chart Data
  const monthlyData = useMemo(() => {
    if (activeRecords.length === 0) return [];

    const mGroup = new Map<string, { qtdPuxada: number; qtdRetida: number; ocorrencias: number }>();

    activeRecords.forEach((r) => {
      const dayIso = r.dataChegada ? r.dataChegada.split('T')[0] : '2026-08-28';
      const mKey = dayIso.slice(0, 7);
      const cur = mGroup.get(mKey) || { qtdPuxada: 0, qtdRetida: 0, ocorrencias: 0 };
      cur.qtdPuxada += Number(r.qtdPuxada) || 0;
      cur.qtdRetida += Number(r.qtdRetida) || 0;
      cur.ocorrencias += 1;
      mGroup.set(mKey, cur);
    });

    const sortedMonths = Array.from(mGroup.keys()).sort();

    const rawList = sortedMonths.map((mKey) => {
      const val = mGroup.get(mKey)!;
      const percentual = val.qtdPuxada > 0 ? (val.qtdRetida / val.qtdPuxada) * 100 : 0;
      const [y, m] = mKey.split('-');
      const shortName = `${MONTH_NAMES_PT[m] || m}/${y.slice(2)}`;
      const fullName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });

      return {
        key: mKey,
        label: shortName,
        fullDate: fullName.charAt(0).toUpperCase() + fullName.slice(1),
        qtdPuxada: val.qtdPuxada,
        qtdRetida: val.qtdRetida,
        percentualRetida: parseFloat(percentual.toFixed(2)),
        ocorrencias: val.ocorrencias,
      };
    });

    const retencaoTrends = calculateLinearTrendLine(rawList.map((d) => d.percentualRetida));
    const puxadaTrends = calculateLinearTrendLine(rawList.map((d) => d.qtdPuxada));
    const retidaTrends = calculateLinearTrendLine(rawList.map((d) => d.qtdRetida));

    return rawList.map((item, idx) => ({
      ...item,
      tendenciaRetencao: retencaoTrends[idx],
      tendenciaPuxada: Math.round(puxadaTrends[idx]),
      tendenciaRetida: Math.round(retidaTrends[idx]),
      metaRetencao: thresholds.lowRetentionMax,
    }));
  }, [activeRecords, thresholds.lowRetentionMax]);

  // Selected Active Chart Data
  const activeChartData = useMemo(() => {
    if (granularity === 'weekly') return weeklyData;
    if (granularity === 'monthly') return monthlyData;
    return dailyData;
  }, [granularity, dailyData, weeklyData, monthlyData]);

  // Days that exceeded the meta
  const daysAboveTarget = useMemo(() => {
    return dailyData.filter((d) => d.percentualRetida > metaLimit);
  }, [dailyData, metaLimit]);

  // Status Info styling helper
  const getStatusInfo = (percentual: number) => {
    if (percentual > thresholds.midRetentionMax) {
      return {
        label: 'Crítico / Atenção Alta',
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        badge: 'bg-rose-600 text-white',
        dot: 'bg-rose-500',
        border: 'border-rose-300',
      };
    }
    if (percentual > thresholds.lowRetentionMax) {
      return {
        label: 'Alerta Operacional',
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        badge: 'bg-amber-500 text-white',
        dot: 'bg-amber-500',
        border: 'border-amber-300',
      };
    }
    return {
      label: 'Dentro da Meta',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      badge: 'bg-emerald-600 text-white',
      dot: 'bg-emerald-500',
      border: 'border-emerald-300',
    };
  };

  // Retention Chart Custom Tooltip
  const RetentionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = getStatusInfo(data.percentualRetida);
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-sm p-4 rounded-xl shadow-2xl border border-slate-700 min-w-[280px] sm:min-w-[310px]">
          <div className="font-bold text-amber-300 border-b border-slate-700/80 pb-2 mb-2.5 flex items-center justify-between gap-3 text-base">
            <span className="tracking-wide">{data.fullDate || label}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs ${status.badge}`}>
              {status.label}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 flex items-center gap-2 text-xs sm:text-sm font-medium">
                <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block shadow-2xs"></span>
                % Retenção Real:
              </span>
              <span className="font-extrabold text-amber-300 text-sm sm:text-base">{formatPercent(data.percentualRetida, 2)}</span>
            </div>

            {data.tendenciaRetencao !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300 flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <span className="w-3 h-1.5 bg-indigo-400 rounded-xs inline-block"></span>
                  Linha de Tendência:
                </span>
                <span className="font-bold text-indigo-300 text-sm sm:text-base">{formatPercent(data.tendenciaRetencao, 2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-xs sm:text-sm text-emerald-400 pt-2 border-t border-slate-800 font-medium">
              <span>Meta Operacional:</span>
              <span className="font-bold text-emerald-300">≤ {formatPercent(thresholds.lowRetentionMax, 2)}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-xs text-slate-400 pt-1">
              <span>Desvio no Período:</span>
              <span className="font-medium text-slate-200">
                {formatNumber(data.qtdRetida)} cx retidas de {formatNumber(data.qtdPuxada)} cx
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Boxes Chart Custom Tooltip
  const BoxesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-sm p-4 rounded-xl shadow-2xl border border-slate-700 min-w-[280px] sm:min-w-[310px]">
          <div className="font-bold text-blue-300 border-b border-slate-700/80 pb-2 mb-2.5 flex items-center justify-between text-base">
            <span className="tracking-wide">{data.fullDate || label}</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 flex items-center gap-2 text-xs sm:text-sm font-medium">
                <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block shadow-2xs"></span>
                Volume Inspecionado:
              </span>
              <span className="font-extrabold text-white text-sm sm:text-base">{formatNumber(data.qtdPuxada)} cx</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 flex items-center gap-2 text-xs sm:text-sm font-medium">
                <span className="w-3 h-3 bg-rose-500 rounded-sm inline-block shadow-2xs"></span>
                Volume Retido:
              </span>
              <span className="font-extrabold text-rose-400 text-sm sm:text-base">{formatNumber(data.qtdRetida)} cx</span>
            </div>

            {data.tendenciaPuxada !== undefined && (
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
                <span className="text-slate-300 flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <span className="w-3 h-1.5 bg-blue-400 rounded-xs inline-block"></span>
                  Tendência de Volume:
                </span>
                <span className="font-bold text-blue-300 text-sm sm:text-base">{formatNumber(data.tendenciaPuxada)} cx</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (activeRecords.length === 0) {
    return (
      <div
        id="monthly-consolidation-container"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] p-8 mb-5 text-center"
      >
        <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-2">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Nenhum registro no período filtrado</h3>
        <p className="text-xs text-slate-500 mt-1">
          Ajuste as datas ou os filtros operacionais acima para visualizar os indicadores e gráficos de tendência.
        </p>
      </div>
    );
  }

  return (
    <div id="monthly-consolidation-section" className="space-y-4 mb-5">
      {/* Floating Header Card for the Filtered Timeframe */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-700 text-white shadow-md">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Síntese do Período Filtrado
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="text-indigo-800">{periodTitle}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-semibold">Taxa de Retenção:</span>
            <span
              className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs ${
                getStatusInfo(metrics.percentualRetida).badge
              }`}
            >
              {formatPercent(metrics.percentualRetida, 2)} ({getStatusInfo(metrics.percentualRetida).label})
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRÁFICOS OPERACIONAIS INDEPENDENTES: 1. RETENÇÃO (%) E 2. CAIXAS (VOLUMES) */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] p-4 sm:p-6 space-y-4">
        {/* Control Bar for Charts Period & Granularity Toggle */}
        <div className="flex flex-col gap-2.5 bg-slate-50/80 rounded-xl border border-slate-200/90 p-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-700 text-white shadow-2xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    PAINEL DE GRÁFICOS OPERACIONAIS COM LINHA DE TENDÊNCIA
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Consolidando os dados de acordo com os filtros selecionados
                  </p>
                </div>
              </div>

              {/* Granularity Switcher: Dia a Dia | Por Semana | Por Mês */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setGranularity('daily')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    granularity === 'daily'
                      ? 'bg-white text-indigo-800 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Por Dia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity('weekly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    granularity === 'weekly'
                      ? 'bg-white text-indigo-800 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Por Semana</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity('monthly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    granularity === 'monthly'
                      ? 'bg-white text-indigo-800 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Por Mês</span>
                </button>
              </div>
            </div>

            {/* Visual Active Filter Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-600" />
                Filtro Ativo:
              </span>
              
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                {periodTitle}
              </span>

              {filters?.fabrica && filters.fabrica.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  Fábrica: {filters.fabrica.join(', ')}
                </span>
              )}

              {filters?.carreta && filters.carreta.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  Carreta: {filters.carreta.join(', ')}
                </span>
              )}

              {filters?.status && filters.status.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  Status: {filters.status.join(', ')}
                </span>
              )}

              {filters?.tipoOcorrencia && filters.tipoOcorrencia.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Tipo: {filters.tipoOcorrencia.join(', ')}
                </span>
              )}

              {filters?.produto && filters.produto.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                  Produto: {filters.produto.join(', ')}
                </span>
              )}

              {filters?.searchTerm && (
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                  Busca: "{filters.searchTerm}"
                </span>
              )}
            </div>
          </div>

          {/* 2 Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ========================================================= */}
            {/* CHART 1: GRÁFICO DE RETENÇÃO (%) COM LINHA DE TENDÊNCIA   */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-amber-100 text-amber-800">
                      <Percent className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Gráfico de Retenção (%)
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {granularity === 'daily'
                          ? `Taxa diária no período (${periodTitle})`
                          : granularity === 'weekly'
                          ? `Taxa consolidada por semana`
                          : `Taxa consolidada por mês`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      Meta: ≤ {formatPercent(thresholds.lowRetentionMax, 2)}
                    </span>
                  </div>
                </div>

                {/* Retention Chart Canvas */}
                <div className="h-64 w-full">
                  {activeChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Sem dados disponíveis para os filtros selecionados.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={activeChartData}
                        margin={{ top: 18, right: 18, bottom: 20, left: -10 }}
                      >
                        <defs>
                          <linearGradient id="retencaoBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                          </linearGradient>
                          <linearGradient id="tendenciaLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#4338ca" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickFormatter={(val) => `${val.toFixed(1)}%`}
                          domain={[0, (dataMax: number) => Math.max(dataMax * 1.25, thresholds.lowRetentionMax * 1.3, 2.5)]}
                        />
                        <Tooltip content={<RetentionTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: 10, fontSize: 11, fontWeight: 600 }}
                          iconType="circle"
                        />

                        {/* Barras de % Retenção Real com Gradiente */}
                        <Bar
                          dataKey="percentualRetida"
                          name="% Retenção Real"
                          fill="url(#retencaoBarGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={38}
                        />

                        {/* Linha Curva de Evolução Real da Taxa */}
                        <Line
                          type="monotone"
                          dataKey="percentualRetida"
                          name="Curva de Retenção"
                          stroke="#d97706"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#ffffff', stroke: '#d97706', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2.5 }}
                        />

                        {/* Linha de Tendência Linear Refinada */}
                        <Line
                          type="linear"
                          dataKey="tendenciaRetencao"
                          name="Linha de Tendência (%)"
                          stroke="#4338ca"
                          strokeWidth={3}
                          strokeDasharray="6 4"
                          strokeLinecap="round"
                          dot={false}
                          activeDot={{ r: 5, fill: '#4338ca', stroke: '#ffffff', strokeWidth: 2 }}
                        />

                        {/* Linha de Meta Operacional com Badge Nítido */}
                        <ReferenceLine
                          y={thresholds.lowRetentionMax}
                          stroke="#059669"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          label={{
                            value: `Meta: ≤ ${thresholds.lowRetentionMax}%`,
                            fill: '#047857',
                            fontSize: 11,
                            position: 'top',
                            fontWeight: 800,
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bottom Footer Indicators for Retention */}
              <div className="grid grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-200/80 text-xs">
                <div className="p-2 rounded bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <span className="text-amber-900 text-[11px] font-semibold">Retenção no Período:</span>
                  <span className="font-extrabold text-amber-950">{formatPercent(metrics.percentualRetida, 2)}</span>
                </div>
                <div className="p-2 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                  <span className="text-indigo-900 text-[11px] font-semibold">Pontos no Gráfico:</span>
                  <span className="font-extrabold text-indigo-950">
                    {activeChartData.length} {activeChartData.length === 1 ? 'intervalo' : 'intervalos'}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CHART 2: GRÁFICO DE CAIXAS (VOLUMES) COM LINHA TENDÊNCIA  */}
            {/* ========================================================= */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100 text-blue-800">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Gráfico de Caixas (Volumes)
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {granularity === 'daily'
                          ? `Volume diário no período (${periodTitle})`
                          : granularity === 'weekly'
                          ? `Volume consolidado por semana`
                          : `Volume consolidado por mês`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-800 border border-blue-300">
                      Total: {formatNumber(metrics.totalPuxada)} cx
                    </span>
                  </div>
                </div>

                {/* Boxes Chart Canvas */}
                <div className="h-64 w-full">
                  {activeChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Sem dados disponíveis para os filtros selecionados.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={activeChartData}
                        margin={{ top: 18, right: 18, bottom: 20, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="puxadaBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.75} />
                          </linearGradient>
                          <linearGradient id="retidaBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#be123c" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                        />
                        <Tooltip content={<BoxesTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: 10, fontSize: 11, fontWeight: 600 }}
                          iconType="circle"
                        />

                        {/* Barras de Volume Inspecionado */}
                        <Bar
                          dataKey="qtdPuxada"
                          name="Volume Inspecionado (cx)"
                          fill="url(#puxadaBarGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={38}
                        />

                        {/* Barras de Volume Retido */}
                        <Bar
                          dataKey="qtdRetida"
                          name="Volume Retido (cx)"
                          fill="url(#retidaBarGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={38}
                        />

                        {/* Linha de Tendência de Volume Puxado */}
                        <Line
                          type="linear"
                          dataKey="tendenciaPuxada"
                          name="Linha de Tendência (Caixas)"
                          stroke="#312e81"
                          strokeWidth={3}
                          strokeDasharray="6 4"
                          strokeLinecap="round"
                          dot={false}
                          activeDot={{ r: 6, fill: '#312e81', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bottom Footer Indicators for Boxes */}
              <div className="grid grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-200/80 text-xs">
                <div className="p-2 rounded bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <span className="text-blue-900 text-[11px] font-semibold">Média Diária:</span>
                  <span className="font-extrabold text-blue-950">
                    ~{formatNumber(Math.round(metrics.mediaDiariaPuxada))} cx/dia
                  </span>
                </div>
                <div className="p-2 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                  <span className="text-indigo-900 text-[11px] font-semibold">Volume Retido:</span>
                  <span className="font-extrabold text-rose-600">
                    {formatNumber(metrics.totalRetida)} cx
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
