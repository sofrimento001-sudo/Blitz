import React from 'react';
import {
  AlertOctagon,
  Clock,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { KpiSummary, ThresholdConfig } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';

interface KpiCardsProps {
  kpis: KpiSummary;
  totalBaseKpis?: KpiSummary;
  thresholds: ThresholdConfig;
  onOpenThresholdModal: () => void;
  isFiltered?: boolean;
  totalRecordsCount?: number;
  filteredRecordsCount?: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  kpis,
  totalBaseKpis,
  thresholds,
  onOpenThresholdModal,
  isFiltered = false,
  totalRecordsCount = 0,
  filteredRecordsCount = 0,
}) => {
  // Farol status calculation for % RETIDA
  const getFarolStatus = (pct: number) => {
    if (kpis.totalOcorrencias === 0) {
      return {
        label: 'Base Limpa',
        color: 'slate',
        badgeBg: 'bg-slate-100/90 text-slate-700 border-slate-300',
        dotBg: 'bg-slate-400',
        icon: ShieldCheck,
      };
    }
    if (pct <= thresholds.lowRetentionMax) {
      return {
        label: 'Baixa Retenção',
        color: 'emerald',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotBg: 'bg-emerald-600',
        icon: ShieldCheck,
      };
    } else if (pct <= thresholds.midRetentionMax) {
      return {
        label: 'Atenção Operacional',
        color: 'amber',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        dotBg: 'bg-amber-600',
        icon: AlertOctagon,
      };
    } else {
      return {
        label: 'Alta Retenção (Crítico)',
        color: 'rose',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        dotBg: 'bg-rose-600',
        icon: ShieldAlert,
      };
    }
  };

  const farol = getFarolStatus(kpis.percentualRetencao);

  // Compute share percentages vs total base if filtered
  const totalBasePuxada = totalBaseKpis?.totalQtdPuxada || 0;
  const totalBaseRetida = totalBaseKpis?.totalQtdRetida || 0;

  const pctOfBasePuxada =
    totalBasePuxada > 0 ? (kpis.totalQtdPuxada / totalBasePuxada) * 100 : 100;
  const pctOfBaseRetida =
    totalBaseRetida > 0 ? (kpis.totalQtdRetida / totalBaseRetida) * 100 : 100;

  return (
    <div id="kpis-row" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* CARD 1: QTD PUXADA */}
      <div
        id="kpi-card-qtd-puxada"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between p-4.5 group"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold tracking-wider text-indigo-900 uppercase">
              VOLUME INSPECIONADO
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Filter className="w-2.5 h-2.5" />
                Filtrado
              </span>
            )}
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tight transition-all duration-200">
            {formatNumber(kpis.totalQtdPuxada)}
          </div>
          <div className="text-xs font-extrabold text-slate-800 mt-0.5">
            {isFiltered ? 'VOLUME INSPECIONADO FILTRADO (CX)' : 'QUANTIDADE DE CAIXAS (CX)'}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">
            {isFiltered
              ? `${formatPercent(pctOfBasePuxada, 1)} do volume total`
              : 'Volume total inspecionado'}
          </span>
          <span className="font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded">
            {isFiltered ? `${filteredRecordsCount} registros` : '100% Carga'}
          </span>
        </div>
      </div>

      {/* CARD 2: QTD RETIDA */}
      <div
        id="kpi-card-qtd-retida"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between p-4.5 group"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold tracking-wider text-rose-900 uppercase">
              VOLUME RETIDO
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                <Filter className="w-2.5 h-2.5" />
                Filtrado
              </span>
            )}
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shadow-2xs">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-black text-rose-600 tracking-tight transition-all duration-200">
            {formatNumber(kpis.totalQtdRetida)}
          </div>
          <div className="text-xs font-extrabold text-slate-800 mt-0.5">
            {isFiltered ? 'QTD RETIDA FILTRADA (CX)' : 'QTD RETIDA (CX)'}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">
            {isFiltered
              ? `${formatPercent(pctOfBaseRetida, 1)} do retido total`
              : 'Segregado p/ retrabalho'}
          </span>
          <span className="font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded">
            {kpis.totalOcorrencias}{' '}
            {kpis.totalOcorrencias === 1 ? 'apontamento' : 'apontamentos'}
          </span>
        </div>
      </div>

      {/* CARD 3: % RETIDA (COM FAROL DE DESEMPENHO) */}
      <div
        id="kpi-card-pct-retida"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between p-4.5 group"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold tracking-wider text-amber-900 uppercase">
              ÍNDICE DE RETENÇÃO
            </span>
          </div>
          <button
            onClick={onOpenThresholdModal}
            title="Clique para ajustar limites do Farol de Retenção"
            className="cursor-pointer p-0.5 rounded hover:bg-slate-100 transition"
          >
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${farol.badgeBg}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${farol.dotBg}`}></span>
              {farol.label}
            </span>
          </button>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tight transition-all duration-200">
              {formatPercent(kpis.percentualRetencao, 2)}
            </div>
          </div>
          <div className="text-xs font-extrabold text-slate-800 mt-0.5">
            {isFiltered ? '% RETIDA DO RECORTE' : '% RETIDA GERAL'}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">
            Meta: &lt;{thresholds.lowRetentionMax}%{' '}
            {totalBaseKpis && isFiltered && (
              <span className="text-slate-400 font-normal">
                (Geral: {formatPercent(totalBaseKpis.percentualRetencao, 2)})
              </span>
            )}
          </span>
          <span
            className="text-blue-700 hover:text-blue-900 underline cursor-pointer font-bold"
            onClick={onOpenThresholdModal}
          >
            Ajustar Farol
          </span>
        </div>
      </div>

      {/* CARD 4: MÉDIA DIAS ATÉ BLOQUEIO */}
      <div
        id="kpi-card-dias-bloqueio"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between p-4.5 group"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-600"></div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold tracking-wider text-teal-900 uppercase">
              LEAD TIME BLOQUEIO
            </span>
          </div>
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tight transition-all duration-200">
            {formatNumber(kpis.mediaDiasAteBloqueio, 1)}{' '}
            <span className="text-sm font-bold text-slate-500">dias</span>
          </div>
          <div className="text-xs font-extrabold text-slate-800 mt-0.5">
            MÉDIA DIAS ATÉ BLOQUEIO
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">Chegada → Bloqueio</span>
          <span className="font-bold text-teal-900 bg-teal-100/80 px-2 py-0.5 rounded">
            {kpis.mediaDiasAteBloqueio <= 1.0 ? 'Ação Imediata' : 'Tempo Resposta'}
          </span>
        </div>
      </div>
    </div>
  );
};
