import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  RotateCcw,
  Building2,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  X,
  Filter,
  Target,
} from 'lucide-react';
import { BlitzRecord, FilterState, ThresholdConfig } from '../types';
import { formatDateBR, normalizeDateToIso } from '../utils/formatters';
import { DateRangeCalendar } from './DateRangeCalendar';

interface FilterBarProps {
  records: BlitzRecord[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  thresholds?: ThresholdConfig;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  records,
  filters,
  onFilterChange,
  onResetFilters,
  thresholds,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const metaLimit = thresholds?.midRetentionMax ?? 5.0;

  // Extract unique options dynamically from active records
  const options = useMemo(() => {
    const fabricas = new Set<string>();
    const carretas = new Set<string>();
    const statuses = new Set<string>();
    const tipos = new Set<string>();
    const produtos = new Set<string>();

    records.forEach((r) => {
      const fab = (r.fabrica || '').trim();
      if (fab) fabricas.add(fab);

      const car = (r.carreta || '').trim();
      if (car) carretas.add(car);

      const st = (r.status || '').trim();
      if (st) statuses.add(st);

      const tp = (r.tipoOcorrencia || '').trim();
      if (tp) tipos.add(tp);

      const prod = (r.produto || '').trim();
      if (prod) produtos.add(prod);
    });

    return {
      fabricas: Array.from(fabricas).sort((a, b) => a.localeCompare(b)),
      carretas: Array.from(carretas).sort((a, b) => a.localeCompare(b)),
      statuses: Array.from(statuses).sort((a, b) => a.localeCompare(b)),
      tiposOcorrencia: Array.from(tipos).sort((a, b) => a.localeCompare(b)),
      produtos: Array.from(produtos).sort((a, b) => a.localeCompare(b)),
    };
  }, [records]);

  // Daily meta stats calculation (identifies days inside vs outside the meta)
  const metaStats = useMemo(() => {
    const dailyMap = new Map<string, { puxada: number; retida: number }>();
    records.forEach((r) => {
      const day = normalizeDateToIso(r.dataChegada || r.dataBloqueio) || 'S/D';
      const cur = dailyMap.get(day) || { puxada: 0, retida: 0 };
      cur.puxada += Number(r.qtdPuxada) || 0;
      cur.retida += Number(r.qtdRetida) || 0;
      dailyMap.set(day, cur);
    });

    let outsideCount = 0;
    let insideCount = 0;
    dailyMap.forEach((val) => {
      if (val.puxada > 0) {
        const pct = (val.retida / val.puxada) * 100;
        if (pct > metaLimit) {
          outsideCount++;
        } else {
          insideCount++;
        }
      }
    });

    return { outsideCount, insideCount, totalDays: dailyMap.size };
  }, [records, metaLimit]);

  // Close calendar popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Reference date calculation (latest date in database or fallback)
  const referenceDate = useMemo(() => {
    if (records.length === 0) return '2026-08-28';
    const dates = records
      .map((r) => normalizeDateToIso(r.dataChegada || r.dataBloqueio))
      .filter((d): d is string => Boolean(d) && !d.includes('NaN'))
      .sort();
    if (dates.length === 0) return '2026-08-28';
    return dates[dates.length - 1] || '2026-08-28';
  }, [records]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dataInicio || filters.dataFim) count++;
    if (filters.fabrica.length > 0) count++;
    if (filters.carreta.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.tipoOcorrencia.length > 0) count++;
    if (filters.produto.length > 0) count++;
    if (filters.searchTerm && filters.searchTerm.trim()) count++;
    if (filters.metaStatus && filters.metaStatus !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <div
      id="filters-container"
      className="relative z-30 pt-1"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Filtros Dinâmicos da Operação</h2>
            <p className="text-xs text-slate-500 font-medium">
              Selecione os parâmetros para segmentar os indicadores em tempo real
            </p>
          </div>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Filters button if active */}
          {activeFilterCount > 0 && (
            <button
              id="btn-reset-filters"
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 transition cursor-pointer font-bold shadow-2xs whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Popover Custom Calendar Component */}
      {isCalendarOpen && (
        <div
          ref={calendarRef}
          className="absolute top-full mt-2 left-0 sm:left-0 z-50 shadow-2xl drop-shadow-2xl"
        >
          <DateRangeCalendar
            startDate={filters.dataInicio}
            endDate={filters.dataFim}
            referenceDate={referenceDate}
            onChange={(start, end) => {
              onFilterChange({
                ...filters,
                dataInicio: start,
                dataFim: end,
              });
            }}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>
      )}

      {/* Grid of 6 Slicers including Meta Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
        {/* 1. Período */}
        <div className="flex flex-col relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              Período
            </label>
            {(filters.dataInicio || filters.dataFim) && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, dataInicio: '', dataFim: '' })}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Limpar período"
              >
                <X className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`w-full flex items-center justify-between text-left text-xs px-2 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
              filters.dataInicio || filters.dataFim
                ? 'border-blue-500 bg-blue-50/60 text-blue-950 ring-1 ring-blue-500'
                : 'border-slate-300 text-slate-800 bg-slate-50 hover:border-blue-500'
            }`}
          >
            <span className="truncate">
              {filters.dataInicio && filters.dataFim
                ? `${formatDateBR(filters.dataInicio)} - ${formatDateBR(filters.dataFim)}`
                : filters.dataInicio
                ? `De ${formatDateBR(filters.dataInicio)}`
                : 'Calendário...'}
            </span>
            <CalendarDays className="w-3.5 h-3.5 text-blue-700 shrink-0 ml-1" />
          </button>
        </div>

        {/* 2. Fábrica */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              Fábrica
            </label>
            {filters.fabrica.length > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, fabrica: [] })}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Limpar fábrica"
              >
                <X className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
          <select
            id="filter-factory"
            value={filters.fabrica[0] || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                fabrica: e.target.value ? [e.target.value] : [],
              })
            }
            className={`w-full text-xs px-2 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              filters.fabrica.length > 0
                ? 'border-blue-500 bg-blue-50/60 text-blue-950 font-bold ring-1 ring-blue-500'
                : 'border-slate-300 text-slate-800 bg-slate-50'
            }`}
          >
            <option value="">Todas as Fábricas</option>
            {options.fabricas.map((fab) => (
              <option key={fab} value={fab}>
                {fab}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Carreta */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-700" />
              Carreta
            </label>
            {filters.carreta.length > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, carreta: [] })}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Limpar carreta"
              >
                <X className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
          <select
            id="filter-carreta"
            value={filters.carreta[0] || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                carreta: e.target.value ? [e.target.value] : [],
              })
            }
            className={`w-full text-xs px-2 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              filters.carreta.length > 0
                ? 'border-blue-500 bg-blue-50/60 text-blue-950 font-bold ring-1 ring-blue-500'
                : 'border-slate-300 text-slate-800 bg-slate-50'
            }`}
          >
            <option value="">Todas as Carretas</option>
            {options.carretas.map((car) => (
              <option key={car} value={car}>
                {car}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Status */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
              Status
            </label>
            {filters.status.length > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, status: [] })}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Limpar status"
              >
                <X className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
          <select
            id="filter-status"
            value={filters.status[0] || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value ? [e.target.value] : [],
              })
            }
            className={`w-full text-xs px-2 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              filters.status.length > 0
                ? 'border-blue-500 bg-blue-50/60 text-blue-950 font-bold ring-1 ring-blue-500'
                : 'border-slate-300 text-slate-800 bg-slate-50'
            }`}
          >
            <option value="">Todos os Status</option>
            {options.statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Produto / SKU */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-700" />
              Produto
            </label>
            {filters.produto.length > 0 && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, produto: [] })}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Limpar produto"
              >
                <X className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
          <select
            id="filter-product"
            value={filters.produto[0] || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                produto: e.target.value ? [e.target.value] : [],
              })
            }
            className={`w-full text-xs px-2 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              filters.produto.length > 0
                ? 'border-blue-500 bg-blue-50/60 text-blue-950 font-bold ring-1 ring-blue-500'
                : 'border-slate-300 text-slate-800 bg-slate-50'
            }`}
          >
            <option value="">Todos os Produtos</option>
            {options.produtos.map((prod) => (
              <option key={prod} value={prod}>
                {prod}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Meta / Farol Operacional (Dentro vs Fora da Meta) */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-700" />
              Meta (≤ {metaLimit.toFixed(0)}%)
            </label>
            {filters.metaStatus && filters.metaStatus !== 'all' && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, metaStatus: 'all' })}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Limpar filtro de meta"
              >
                <X className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
          <select
            id="filter-meta"
            value={filters.metaStatus || 'all'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                metaStatus: e.target.value as 'all' | 'inside' | 'outside',
              })
            }
            className={`w-full text-xs px-2 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
              filters.metaStatus === 'outside'
                ? 'border-rose-500 bg-rose-50/90 text-rose-950 font-bold ring-1 ring-rose-500'
                : filters.metaStatus === 'inside'
                ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold ring-1 ring-emerald-500'
                : 'border-slate-300 text-slate-800 bg-slate-50'
            }`}
          >
            <option value="all">Todas as Ocorrências</option>
            <option value="outside">
              🔴 Fora da Meta (&gt; {metaLimit.toFixed(1)}%) {metaStats.outsideCount > 0 ? `(${metaStats.outsideCount}d)` : ''}
            </option>
            <option value="inside">
              🟢 Dentro da Meta (≤ {metaLimit.toFixed(1)}%) {metaStats.insideCount > 0 ? `(${metaStats.insideCount}d)` : ''}
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};
