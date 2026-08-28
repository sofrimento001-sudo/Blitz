import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ProductRanking } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';
import { Trophy, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';

interface EvolutionAndRankingProps {
  dateEvolution?: any[];
  productRanking: ProductRanking[];
  onSelectProduct?: (productName: string) => void;
}

// Harmonious palette for Top 5 items
const TOP5_COLORS = [
  '#1d4ed8', // 1st - Deep Royal Blue
  '#0284c7', // 2nd - Vibrant Sky Blue
  '#0d9488', // 3rd - Ocean Teal
  '#f59e0b', // 4th - Amber Orange
  '#ef4444', // 5th - Crimson Red
  '#94a3b8', // Outros
];

export const EvolutionAndRanking: React.FC<EvolutionAndRankingProps> = ({
  productRanking,
  onSelectProduct,
}) => {
  const [metricType, setMetricType] = useState<'retida' | 'ocorrencias'>('retida');

  // Calculate Top 5 items and distribution
  const top5Data = React.useMemo(() => {
    if (!productRanking || productRanking.length === 0) return [];

    // Sort according to metric
    const sorted = [...productRanking].sort((a, b) => {
      if (metricType === 'retida') return b.qtdRetida - a.qtdRetida;
      return b.ocorrencias - a.ocorrencias;
    });

    const top5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);

    const totalMetricValue = sorted.reduce(
      (sum, p) => sum + (metricType === 'retida' ? p.qtdRetida : p.ocorrencias),
      0
    );

    if (totalMetricValue === 0) return [];

    const items = top5.map((item, idx) => {
      const val = metricType === 'retida' ? item.qtdRetida : item.ocorrencias;
      const share = (val / totalMetricValue) * 100;
      return {
        name: item.produto,
        codigo: item.codigo,
        value: val,
        share,
        qtdPuxada: item.qtdPuxada,
        qtdRetida: item.qtdRetida,
        ocorrencias: item.ocorrencias,
        percentualRetida: item.percentualRetida,
        color: TOP5_COLORS[idx % TOP5_COLORS.length],
      };
    });

    // Add 'Outros' if there are more products
    if (rest.length > 0) {
      const restValue = rest.reduce(
        (sum, p) => sum + (metricType === 'retida' ? p.qtdRetida : p.ocorrencias),
        0
      );
      if (restValue > 0) {
        items.push({
          name: `Outros (${rest.length} produtos)`,
          codigo: 'DIVERSOS',
          value: restValue,
          share: (restValue / totalMetricValue) * 100,
          qtdPuxada: rest.reduce((s, p) => s + p.qtdPuxada, 0),
          qtdRetida: rest.reduce((s, p) => s + p.qtdRetida, 0),
          ocorrencias: rest.reduce((s, p) => s + p.ocorrencias, 0),
          percentualRetida: 0,
          color: TOP5_COLORS[5],
        });
      }
    }

    return items;
  }, [productRanking, metricType]);

  // Find maximum % Retida among ranking products to scale relative data bars
  const maxPct = Math.max(...productRanking.map((p) => p.percentualRetida), 5);

  // Custom Tooltip for Top 5 Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-sm p-4 rounded-xl shadow-2xl border border-slate-700 min-w-[260px] max-w-sm">
          <div className="font-bold text-sky-300 text-base border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between gap-2">
            <span className="truncate">{data.name}</span>
            {data.codigo !== 'DIVERSOS' && (
              <span className="text-xs text-slate-400 font-mono">#{data.codigo}</span>
            )}
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">
                {metricType === 'retida' ? 'Qtd Retida:' : 'Ocorrências:'}
              </span>
              <span className="font-bold text-rose-400 text-sm">
                {formatNumber(data.value)} {metricType === 'retida' ? 'cx' : 'desvios'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Participação (Share):</span>
              <span className="font-extrabold text-emerald-400 text-sm">{formatPercent(data.share, 1)}</span>
            </div>
            {data.codigo !== 'DIVERSOS' && (
              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-800 text-xs">
                <span className="text-slate-400">% Retida do SKU:</span>
                <span className="font-bold text-amber-300 text-sm">{formatPercent(data.percentualRetida, 2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="product-ranking-section" className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* GRÁFICO DE PIZZA — TOP 5 MAIORES ITENS (5 colunas no desktop) */}
      <div
        id="block-top5-pie"
        className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 shadow-2xs">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                TOP 5 MAIORES ITENS
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Distribuição de impacto dos principais produtos
              </p>
            </div>
          </div>

          {/* Toggle between QTD Retida vs Ocorrências */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
            <button
              onClick={() => setMetricType('retida')}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                metricType === 'retida'
                  ? 'bg-white text-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Qtd Retida
            </button>
            <button
              onClick={() => setMetricType('ocorrencias')}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                metricType === 'ocorrencias'
                  ? 'bg-white text-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ocorrências
            </button>
          </div>
        </div>

        {/* Pie Chart Canvas */}
        <div className="h-56 w-full relative flex items-center justify-center">
          {top5Data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={top5Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(entry) => {
                    if (entry && entry.name && !String(entry.name).startsWith('Outros') && onSelectProduct) {
                      onSelectProduct(String(entry.name));
                    }
                  }}
                  cursor="pointer"
                >
                  {top5Data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400">Nenhum dado para o gráfico de pizza.</div>
          )}
        </div>

        {/* Custom Legend for Top 5 */}
        <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1.5 max-h-36 overflow-y-auto">
          {top5Data.map((item, idx) => (
            <div
              key={item.name + idx}
              onClick={() => {
                if (!item.name.startsWith('Outros') && onSelectProduct) {
                  onSelectProduct(item.name);
                }
              }}
              className={`flex items-center justify-between text-[11px] p-1 rounded-md transition ${
                !item.name.startsWith('Outros')
                  ? 'hover:bg-slate-50 cursor-pointer'
                  : 'text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 truncate max-w-[210px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-800 truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-slate-600 font-medium">
                  {formatNumber(item.value)} {metricType === 'retida' ? 'cx' : 'ocorr'}
                </span>
                <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                  {formatPercent(item.share, 1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RANKING EXECUTIVO — TOP 10 PRODUTOS MAIS RETIDOS (7 colunas no desktop) */}
      <div
        id="block-product-ranking"
        className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 mb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                RANKING — TOP 10 PRODUTOS COM MAIOR RETENÇÃO
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Classificação por volume de retenção (QTD Retida) e taxa de desvio (%)
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span className="text-blue-700 font-semibold hidden sm:inline">Dica: Clique no produto para filtrar</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
          {productRanking.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100/90 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-2.5 text-center w-8">#</th>
                  <th className="py-2.5 px-2.5">Produto</th>
                  <th className="py-2.5 px-2 text-right">QTD Puxada</th>
                  <th className="py-2.5 px-2 text-right">QTD Retida</th>
                  <th className="py-2.5 px-2.5 text-right w-36">% Retida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productRanking.map((item, idx) => {
                  // Data bar percentage relative to max
                  const barWidth = Math.min(100, Math.max(8, (item.percentualRetida / maxPct) * 100));
                  const isHighCritical = item.percentualRetida > 5.0;
                  const isMedium = item.percentualRetida > 2.5;

                  return (
                    <tr
                      key={item.produto + idx}
                      onClick={() => onSelectProduct && onSelectProduct(item.produto)}
                      className="hover:bg-blue-50/70 transition-colors group cursor-pointer"
                      title={`Clique para filtrar pelo produto: ${item.produto}`}
                    >
                      <td className="py-2 px-2.5 text-center">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800'
                            : 'text-slate-500'
                        }`}>
                          {idx + 1}º
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-1">
                          <span className="truncate max-w-[170px]" title={item.produto}>{item.produto}</span>
                          <ArrowUpRight className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700 font-semibold">Cód: {item.codigo}</span>
                          <span>•</span>
                          <span>{item.ocorrencias} {item.ocorrencias === 1 ? 'ocorr.' : 'ocorr.'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700 font-bold text-[11px]">
                        {formatNumber(item.qtdPuxada)}
                      </td>
                      <td className="py-2 px-2 text-right font-black text-rose-600 text-[11px]">
                        {formatNumber(item.qtdRetida)}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-black text-xs ${
                              isHighCritical
                                ? 'text-rose-700'
                                : isMedium
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {formatPercent(item.percentualRetida, 2)}
                          </span>
                          {/* In-cell visual data bar */}
                          <div className="w-24 bg-slate-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHighCritical
                                  ? 'bg-rose-500'
                                  : isMedium
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum produto com retenção identificado na base.
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1">
          <span>Exibindo os 10 SKUs com maior impacto volumétrico de retenção</span>
          <span className="text-blue-700 font-semibold">Clique em uma linha para aplicar filtro</span>
        </div>
      </div>
    </div>
  );
};
