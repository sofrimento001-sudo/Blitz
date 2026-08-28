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
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm p-3 rounded-xl shadow-2xl border border-slate-700 max-w-xs z-50 pointer-events-none">
          <div className="font-bold text-blue-300 text-sm pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.tipo}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Ocorrências:</span>
              <span className="font-bold text-white">{formatNumber(data.quantidade)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-amber-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
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
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm p-3 rounded-xl shadow-2xl border border-slate-700 max-w-xs z-50 pointer-events-none">
          <div className="font-bold text-sky-300 text-sm pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.fabrica}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Ocorrências:</span>
              <span className="font-bold text-white">{formatNumber(data.ocorrencias)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-amber-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
              <span className="text-slate-300">Share Ocorrências:</span>
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
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm p-3 rounded-xl shadow-2xl border border-slate-700 max-w-xs z-50 pointer-events-none">
          <div className="font-bold text-white text-sm pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.status}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Ocorrências:</span>
              <span className="font-bold text-white">{formatNumber(data.ocorrencias)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-amber-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
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
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm p-3.5 rounded-xl shadow-2xl border border-slate-700 max-w-xs z-50 pointer-events-none">
          <div className="font-bold text-purple-300 text-sm pb-1 mb-1.5 border-b border-slate-700 break-words">
            {data.produto}
          </div>
          <div className="space-y-1 text-xs">
            {data.codigo && data.codigo !== '-' && (
              <div className="flex items-center justify-between gap-4 text-slate-400">
                <span>Código SKU:</span>
                <span className="font-mono text-slate-200">{data.codigo}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Apontamentos:</span>
              <span className="font-bold text-white">{formatNumber(data.ocorrencias)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">QTD Retida:</span>
              <span className="font-bold text-rose-300">{formatNumber(data.qtdRetida)} cx</span>
            </div>
            {data.qtdPuxada > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Volume Inspecionado:</span>
                <span className="font-bold text-blue-300">{formatNumber(data.qtdPuxada)} cx</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
              <span className="text-slate-300">Taxa Retenção:</span>
              <span className="font-extrabold text-amber-300">{formatPercent(data.percentualRetida, 2)}</span>
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
    <div id="occurrence-analysis-row" className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      {/* GRÁFICO 1 — OCORRÊNCIAS POR TIPO (Horizontal Bar Chart com amplo espaço) */}
      <div
        id="chart-card-tipo"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Ocorrências por Tipo
              </h3>
              <p className="text-xs text-slate-500 font-medium">Classificação por quantidade de ocorrências e participação</p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={typeData.slice(0, 7)}
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="tipo"
                  width={150}
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                  tickFormatter={(val) => (val.length > 22 ? `${val.substring(0, 21)}…` : val)}
                />
                <Tooltip
                  content={<CustomTypeTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 999 }}
                />
                <Bar
                  dataKey="quantidade"
                  fill="#2563eb"
                  radius={[0, 6, 6, 0]}
                  label={{
                    position: 'right',
                    formatter: (val: any, entry: any) => {
                      const pct = entry && entry.percentual !== undefined ? ` (${entry.percentual.toFixed(0)}%)` : '';
                      return `${formatNumber(val)}${pct}`;
                    },
                    fontSize: 11,
                    fill: '#0f172a',
                    fontWeight: 700,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum dado encontrado para os filtros atuais.
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-600 flex justify-between items-center">
          <span>Categorias mapeadas no período</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {typeData.length} tipos mapeados
          </span>
        </div>
      </div>

      {/* GRÁFICO 2 — TOP 10 PRODUTOS REGISTRADOS (Bar Chart) */}
      <div
        id="chart-card-top-produtos"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-100 text-purple-800 shadow-2xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Top 10 Produtos Registrados
              </h3>
              <p className="text-xs text-slate-500 font-medium">SKUs com maior volume de apontamentos no período</p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {top10List.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={top10List}
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="produto"
                  width={160}
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                  tickFormatter={(val) => (val.length > 22 ? `${val.substring(0, 21)}…` : val)}
                />
                <Tooltip
                  content={<CustomProductTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 999 }}
                />
                <Bar
                  dataKey="ocorrencias"
                  fill="#7c3aed"
                  radius={[0, 6, 6, 0]}
                  label={{
                    position: 'right',
                    formatter: (val: any) => `${formatNumber(val)} apont.`,
                    fontSize: 11,
                    fill: '#581c87',
                    fontWeight: 700,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum produto registrado no filtro atual.
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-600 flex justify-between items-center">
          <span>Ocorrências no Top 10</span>
          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            {formatNumber(totalTop10Ocorrencias)} apontamentos ({top10List.length} SKUs)
          </span>
        </div>
      </div>

      {/* GRÁFICO 3 — OCORRÊNCIAS POR FÁBRICA (Donut Chart) */}
      <div
        id="chart-card-fabrica"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-800 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Ocorrências por Fábrica
              </h3>
              <p className="text-xs text-slate-500 font-medium">Participação de desvios por unidade produtora</p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {factoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={factoryData}
                  dataKey="ocorrencias"
                  nameKey="fabrica"
                  cx="50%"
                  cy="46%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
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
                  wrapperStyle={{ zIndex: 999 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={45}
                  formatter={(value) => {
                    const item = factoryData.find((f) => f.fabrica === value);
                    const pct = item ? ` (${item.percentual.toFixed(0)}%)` : '';
                    return (
                      <span className="text-xs text-slate-700 font-semibold">
                        {value} <strong className="text-slate-950 font-bold">{pct}</strong>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum dado encontrado para os filtros atuais.
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-600 flex justify-between items-center">
          <span>Origem dos desvios</span>
          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {factoryData.length} fábricas ativas
          </span>
        </div>
      </div>

      {/* GRÁFICO 4 — DISTRIBUIÇÃO POR STATUS (Donut Chart) */}
      <div
        id="chart-card-status"
        className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Distribuição por Status
              </h3>
              <p className="text-xs text-slate-500 font-medium">Fluxo de liberação, análise e quarentena</p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="ocorrencias"
                  nameKey="status"
                  cx="50%"
                  cy="46%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
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
                  wrapperStyle={{ zIndex: 999 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={45}
                  formatter={(value) => {
                    const item = statusData.find((s) => s.status === value);
                    const pct = item ? ` (${item.percentual.toFixed(0)}%)` : '';
                    return (
                      <span className="text-xs text-slate-700 font-semibold">
                        {value} <strong className="text-slate-950 font-bold">{pct}</strong>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Nenhum dado encontrado para os filtros atuais.
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-600 flex justify-between items-center">
          <span>Situação operacional</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {formatNumber(statusData.reduce((acc, s) => acc + s.ocorrencias, 0))} ocorrências tratadas
          </span>
        </div>
      </div>
    </div>
  );
};
