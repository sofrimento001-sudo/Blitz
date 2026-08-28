import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { FactoryDistribution, ProductRanking, StatusDistribution, TypeDistribution } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';
import { AlertTriangle, Building2, CheckCircle2, Package } from 'lucide-react';

interface OccurrenceChartsProps {
  typeData: TypeDistribution[];
  factoryData: FactoryDistribution[];
  statusData: StatusDistribution[];
  topProductsData?: ProductRanking[];
}

// Executive corporate color palettes (Power BI style)
const FACTORY_COLORS = [
  '#0f3460', // Deep Navy
  '#1e6091', // Classic Steel Blue
  '#168aad', // Cerulean
  '#34a0a4', // Teal Blue
  '#52b69a', // Mint Green
  '#76c893', // Light Green
  '#99d98c', // Soft Lime
  '#b5e2fa', // Ice Blue
];

const STATUS_COLORS: Record<string, string> = {
  Liberado: '#16a34a', // Emerald Green (positivo)
  'Liberado Parcial': '#3b82f6', // Blue
  Bloqueado: '#dc2626', // Crimson Red (crítico)
  'Em Análise': '#f59e0b', // Amber (atenção)
  'Retrabalho Concluído': '#0d9488', // Teal
  Descarte: '#64748b', // Slate Gray
  Outros: '#94a3b8',
};

export const OccurrenceCharts: React.FC<OccurrenceChartsProps> = ({
  typeData,
  factoryData,
  statusData,
  topProductsData = [],
}) => {
  // Custom tooltip for Type Bar Chart
  const CustomTypeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TypeDistribution;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-2xl border border-slate-700 max-w-[220px] pointer-events-none">
          <div className="font-bold text-blue-300 text-xs pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.tipo}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Ocorrências:</span>
              <span className="font-bold text-white">{formatNumber(data.quantidade)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-amber-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="text-slate-300">Participação:</span>
              <span className="font-extrabold text-emerald-300">{formatPercent(data.percentual, 1)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Factory Donut Chart
  const CustomFactoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as FactoryDistribution;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-2xl border border-slate-700 max-w-[220px] pointer-events-none">
          <div className="font-bold text-sky-300 text-xs pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.fabrica}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Ocorrências:</span>
              <span className="font-bold text-white">{formatNumber(data.ocorrencias)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-amber-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="text-slate-300">Share:</span>
              <span className="font-extrabold text-emerald-300">{formatPercent(data.percentual, 1)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Status Donut Chart
  const CustomStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as StatusDistribution;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-2xl border border-slate-700 max-w-[220px] pointer-events-none">
          <div className="font-bold text-white text-xs pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.status}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Ocorrências:</span>
              <span className="font-bold text-white">{formatNumber(data.ocorrencias)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-amber-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="text-slate-300">Percentual:</span>
              <span className="font-extrabold text-emerald-300">{formatPercent(data.percentual, 1)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Top 10 Products Chart
  const CustomProductTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ProductRanking;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-2xl border border-slate-700 max-w-[230px] pointer-events-none">
          <div className="font-bold text-purple-300 text-xs pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.produto}
          </div>
          <div className="space-y-1 text-xs">
            {data.codigo && data.codigo !== '-' && (
              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                <span>SKU:</span>
                <span className="font-mono text-slate-200">{data.codigo}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">Apontamentos:</span>
              <span className="font-bold text-white">{formatNumber(data.ocorrencias)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-rose-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            {data.qtdPuxada > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Volume Inspecionado:</span>
                <span className="font-bold text-blue-300">{formatNumber(data.qtdPuxada)} cx</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="text-slate-300">Taxa Retenção:</span>
              <span className="font-extrabold text-amber-300">{formatPercent(data.percentualRetida, 1)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const top10List = topProductsData.slice(0, 10);
  const totalTop10Ocorrencias = top10List.reduce((acc, p) => acc + p.ocorrencias, 0);

  return (
    <div id="occurrence-analysis-row" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
      {/* CARD 1 — OCORRÊNCIAS POR TIPO */}
      <div
        id="chart-card-tipo"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Ocorrências por Tipo
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Classificação por quantidade e %</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={typeData.slice(0, 6)}
                margin={{ top: 4, right: 35, left: 0, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="tipo"
                  width={92}
                  tick={{ fontSize: 9.5, fill: '#1e293b', fontWeight: 600 }}
                  tickFormatter={(val) => (val.length > 13 ? `${val.substring(0, 12)}…` : val)}
                />
                <Tooltip
                  content={<CustomTypeTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
                <Bar
                  dataKey="quantidade"
                  fill="#2563eb"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    formatter: (val: any) => `${val}`,
                    fontSize: 9.5,
                    fill: '#0f172a',
                    fontWeight: 700,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum dado encontrado.
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex justify-between items-center">
          <span>Top categorias</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {typeData.length} tipos mapeados
          </span>
        </div>
      </div>

      {/* CARD 2 — OCORRÊNCIAS POR FÁBRICA */}
      <div
        id="chart-card-fabrica"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-800 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Ocorrências por Fábrica
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Participação de cada unidade</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {factoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={factoryData}
                  dataKey="ocorrencias"
                  nameKey="fabrica"
                  cx="50%"
                  cy="45%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {factoryData.map((entry, index) => (
                    <Cell
                      key={`cell-fab-${index}`}
                      fill={FACTORY_COLORS[index % FACTORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomFactoryTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  formatter={(value) => {
                    const item = factoryData.find((f) => f.fabrica === value);
                    const pct = item ? ` (${item.percentual.toFixed(0)}%)` : '';
                    return (
                      <span className="text-[9.5px] text-slate-700 font-semibold">
                        {value.length > 11 ? `${value.substring(0, 10)}…` : value}
                        <strong className="text-slate-950 font-bold">{pct}</strong>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum dado encontrado.
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex justify-between items-center">
          <span>Origem dos desvios</span>
          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
            {factoryData.length} fábricas ativas
          </span>
        </div>
      </div>

      {/* CARD 3 — DISTRIBUIÇÃO POR STATUS */}
      <div
        id="chart-card-status"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Distribuição por Status
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Fluxo de liberação e quarentena</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="ocorrencias"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={`cell-status-${entry.status}`}
                      fill={STATUS_COLORS[entry.status] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomStatusTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  formatter={(value) => {
                    const item = statusData.find((s) => s.status === value);
                    const pct = item ? ` (${item.percentual.toFixed(0)}%)` : '';
                    return (
                      <span className="text-[9.5px] text-slate-700 font-semibold">
                        {value} <strong className="text-slate-950 font-bold">{pct}</strong>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum dado encontrado.
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex justify-between items-center">
          <span>Situação operacional</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {formatNumber(statusData.reduce((acc, s) => acc + s.ocorrencias, 0))} tratadas
          </span>
        </div>
      </div>

      {/* CARD 4 — TOP 10 PRODUTOS REGISTRADOS */}
      <div
        id="chart-card-top-produtos"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-100 text-purple-800 shadow-2xs">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Top 10 Produtos Registrados
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">SKUs com mais ocorrências</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {top10List.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={top10List}
                margin={{ top: 2, right: 35, left: 0, bottom: 2 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="produto"
                  width={92}
                  tick={{ fontSize: 8.5, fill: '#1e293b', fontWeight: 600 }}
                  tickFormatter={(val) => (val.length > 13 ? `${val.substring(0, 12)}…` : val)}
                />
                <Tooltip
                  content={<CustomProductTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 9999 }}
                />
                <Bar
                  dataKey="ocorrencias"
                  fill="#7c3aed"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    formatter: (val: any) => `${val}`,
                    fontSize: 9,
                    fill: '#581c87',
                    fontWeight: 700,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum produto registrado.
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex justify-between items-center">
          <span>Top 10 SKUs</span>
          <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            {formatNumber(totalTop10Ocorrencias)} apont.
          </span>
        </div>
      </div>
    </div>
  );
};
