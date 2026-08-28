import React from 'react';
import {
  FileText,
  AlertTriangle,
  Building2,
  Package,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { ExecutiveInsights as InsightsType, ThresholdConfig } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';

interface ExecutiveInsightsProps {
  insights: InsightsType;
  thresholds: ThresholdConfig;
}

export const ExecutiveInsights: React.FC<ExecutiveInsightsProps> = ({ insights, thresholds }) => {
  const isRetentionHigh = insights.percentualGeralRetencao > thresholds.midRetentionMax;
  const isRetentionModerate =
    insights.percentualGeralRetencao > thresholds.lowRetentionMax &&
    insights.percentualGeralRetencao <= thresholds.midRetentionMax;

  return (
    <div
      id="executive-insights-panel"
      className="bg-gradient-to-br from-slate-900 via-[#0b192e] to-slate-900 text-white rounded-xl border border-slate-700/80 shadow-md p-4 sm:p-5 mb-4"
    >
      {/* Header of Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/70 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              LEITURA GERENCIAL
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 lowercase">
                síntese executiva diária
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Destaques analíticos automatizados gerados a partir da base filtrada
            </p>
          </div>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Retenção Geral:</span>
              <span
                className={`font-bold ${
                  isRetentionHigh
                    ? 'text-rose-400'
                    : isRetentionModerate
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatPercent(insights.percentualGeralRetencao, 2)}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Retido:</span>
              <span className="font-bold text-white">
                {formatNumber(insights.qtdTotalRetida)} cx
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Executive Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3.5">
        {/* Highlight 1: Principal Tipo */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 flex flex-col justify-between hover:bg-slate-800/90 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-300">
              Principal Ocorrência
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-bold text-sm text-amber-300 truncate" title={insights.principalTipoOcorrencia.tipo}>
            {insights.principalTipoOcorrencia.tipo || '-'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {formatNumber(insights.principalTipoOcorrencia.count)} registros (
            {formatPercent(insights.principalTipoOcorrencia.percentual, 1)})
          </div>
        </div>

        {/* Highlight 2: Fábrica com Maior Número */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 flex flex-col justify-between hover:bg-slate-800/90 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-300">
              Fábrica Crítica
            </span>
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="font-bold text-sm text-blue-300 truncate" title={insights.fabricaMaiorOcorrencias.fabrica}>
            {insights.fabricaMaiorOcorrencias.fabrica || '-'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {formatNumber(insights.fabricaMaiorOcorrencias.count)} ocorrências (
            {formatPercent(insights.fabricaMaiorOcorrencias.percentual, 1)})
          </div>
        </div>

        {/* Highlight 3: Produto com Maior Qtd Retida */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 flex flex-col justify-between hover:bg-slate-800/90 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-300">
              Produto Mais Retido
            </span>
            <Package className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="font-bold text-sm text-rose-300 truncate" title={insights.produtoMaiorRetencao.produto}>
            {insights.produtoMaiorRetencao.produto || '-'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {formatNumber(insights.produtoMaiorRetencao.qtdRetida)} caixas retidas
          </div>
        </div>

        {/* Highlight 4: Maior % de Retenção */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 flex flex-col justify-between hover:bg-slate-800/90 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-300">
              Maior % de Retenção
            </span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-sm text-emerald-300 truncate">
            {formatPercent(insights.maiorPercentualRetencao.percentual, 1)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 truncate" title={insights.maiorPercentualRetencao.produto}>
            {insights.maiorPercentualRetencao.produto}
          </div>
        </div>

        {/* Highlight 5: Dia com Maior Qtd Retida */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 flex flex-col justify-between hover:bg-slate-800/90 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-300">
              Pico de Retenção (Dia)
            </span>
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="font-bold text-sm text-purple-300">
            {insights.diaMaiorRetencao.data || '-'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {formatNumber(insights.diaMaiorRetencao.qtdRetida)} cx retidas no dia
          </div>
        </div>
      </div>

      {/* Operational Attention Points for Daily Meeting */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Pontos de Atenção para a Operação Logística:
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          {insights.pontosDeAtencao.map((ponto, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded border border-slate-800">
              <span className="text-blue-400 font-bold mt-0.5">•</span>
              <span>{ponto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
