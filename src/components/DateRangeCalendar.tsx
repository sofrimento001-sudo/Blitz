import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { formatDateBR, normalizeDateToIso } from '../utils/formatters';

interface DateRangeCalendarProps {
  startDate: string; // YYYY-MM-DD or DD/MM/YYYY
  endDate: string; // YYYY-MM-DD or DD/MM/YYYY
  onChange: (startDate: string, endDate: string) => void;
  onClose?: () => void;
  referenceDate?: string | Date; // dataset latest date or fallback
  minDate?: string;
  maxDate?: string;
  availableDates?: string[];
  availableYears?: number[];
}

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const WEEKDAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Helper to safely parse string (YYYY-MM-DD, DD/MM/YYYY or ISO) or Date to local Date object
function parseSafeDate(val: string | Date | null | undefined): Date {
  if (!val) return new Date();
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }
  const iso = normalizeDateToIso(val);
  if (iso) {
    const parts = iso.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? new Date() : d;
}

// Formats a Date object to YYYY-MM-DD
function toIsoDate(d: Date): string {
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DateRangeCalendar: React.FC<DateRangeCalendarProps> = ({
  startDate,
  endDate,
  onChange,
  onClose,
  referenceDate = '2026-08-28',
  minDate,
  maxDate,
  availableDates,
  availableYears,
}) => {
  const normStart = normalizeDateToIso(startDate);
  const normEnd = normalizeDateToIso(endDate);

  // Set of dates with actual data in the database
  const availableSet = useMemo(() => {
    if (!availableDates) return null;
    return new Set(availableDates);
  }, [availableDates]);

  // Temporary selection state until user clicks "APLICAR" or a shortcut
  const [tempStart, setTempStart] = useState<string>(normStart);
  const [tempEnd, setTempEnd] = useState<string>(normEnd);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Synchronize internal state when props change
  useEffect(() => {
    setTempStart(normalizeDateToIso(startDate));
    setTempEnd(normalizeDateToIso(endDate));
  }, [startDate, endDate]);

  // Determine initial calendar month and year to display
  const refObj = useMemo(() => parseSafeDate(referenceDate), [referenceDate]);
  const initialDateObj = useMemo(() => {
    return normStart ? parseSafeDate(normStart) : refObj;
  }, [normStart, refObj]);

  const [currentYear, setCurrentYear] = useState<number>(() => initialDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => initialDateObj.getMonth());

  // Keep calendar month aligned when startDate OR referenceDate changes
  useEffect(() => {
    if (normStart) {
      const d = parseSafeDate(normStart);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    } else if (referenceDate) {
      const d = parseSafeDate(referenceDate);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  }, [normStart, referenceDate]);

  // Reference "Today / Latest day" for highlighting dot
  const todayIso = useMemo(() => toIsoDate(refObj), [refObj]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Click on a day cell
  const handleDayClick = (dayIso: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Start a new range selection
      setTempStart(dayIso);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      // Completing the range selection
      if (dayIso < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dayIso);
      } else {
        setTempEnd(dayIso);
      }
    }
  };

  // Double-click to instantly select and apply a single day
  const handleDayDoubleClick = (dayIso: string) => {
    setTempStart(dayIso);
    setTempEnd(dayIso);
    onChange(dayIso, dayIso);
    if (onClose) onClose();
  };

  // Shortcuts logic based dynamically on dataset reference date
  const handleShortcut = (type: string) => {
    let start = '';
    let end = '';

    const ref = parseSafeDate(referenceDate);

    if (type === 'hoje') {
      start = toIsoDate(ref);
      end = toIsoDate(ref);
    } else if (type === 'ontem') {
      const yesterday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1);
      start = toIsoDate(yesterday);
      end = toIsoDate(yesterday);
    } else if (type === '7d') {
      const past7 = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 6);
      start = toIsoDate(past7);
      end = toIsoDate(ref);
    } else if (type === '15d') {
      const past15 = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 14);
      start = toIsoDate(past15);
      end = toIsoDate(ref);
    } else if (type === '30d') {
      const past30 = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 29);
      start = toIsoDate(past30);
      end = toIsoDate(ref);
    } else if (type === 'esteMes') {
      const startM = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const endM = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      start = toIsoDate(startM);
      end = toIsoDate(endM);
    } else if (type === 'mesPassado') {
      const startPastM = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      const endPastM = new Date(ref.getFullYear(), ref.getMonth(), 0);
      start = toIsoDate(startPastM);
      end = toIsoDate(endPastM);
    } else if (type === '4meses') {
      const start4M = new Date(ref.getFullYear(), ref.getMonth() - 3, 1);
      const end4M = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      start = toIsoDate(start4M);
      end = toIsoDate(end4M);
    } else if (type === 'tudo') {
      if (minDate && maxDate) {
        start = minDate;
        end = maxDate;
      } else {
        setTempStart('');
        setTempEnd('');
        onChange('', '');
        if (onClose) onClose();
        return;
      }
    }

    if (start && end) {
      setTempStart(start);
      setTempEnd(end);
      const sObj = parseSafeDate(start);
      setCurrentYear(sObj.getFullYear());
      setCurrentMonth(sObj.getMonth());
      onChange(start, end);
    }

    if (onClose) onClose();
  };

  // Clear all filter
  const handleClearAll = () => {
    setTempStart('');
    setTempEnd('');
    onChange('', '');
    if (onClose) onClose();
  };

  // Apply custom range
  const handleApplyCustom = () => {
    if (tempStart && !tempEnd) {
      // Single day selected
      onChange(tempStart, tempStart);
    } else if (tempStart && tempEnd) {
      const s = tempStart <= tempEnd ? tempStart : tempEnd;
      const e = tempStart <= tempEnd ? tempEnd : tempStart;
      onChange(s, e);
    } else {
      onChange('', '');
    }
    if (onClose) onClose();
  };

  // Build calendar matrix (6 weeks = 42 cells)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = DOM, 1 = SEG ...
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dateIso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasData: boolean;
    }> = [];

    // Previous month filler days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const iso = toIsoDate(prevDate);
      cells.push({
        dateIso: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        hasData: availableSet ? availableSet.has(iso) : false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(currentYear, currentMonth, d);
      const iso = toIsoDate(currDate);
      cells.push({
        dateIso: iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        hasData: availableSet ? availableSet.has(iso) : false,
      });
    }

    // Next month filler days up to 42 cells
    const remaining = 42 - cells.length;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(currentYear, currentMonth + 1, n);
      const iso = toIsoDate(nextDate);
      cells.push({
        dateIso: iso,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        hasData: availableSet ? availableSet.has(iso) : false,
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayIso, availableSet]);

  // Year options dynamically combining available years and current selection
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<number>();
    if (availableYears && availableYears.length > 0) {
      availableYears.forEach((y) => yearsSet.add(y));
    }
    const baseYear = refObj.getFullYear() || 2026;
    for (let y = baseYear - 3; y <= baseYear + 2; y++) {
      yearsSet.add(y);
    }
    yearsSet.add(currentYear);
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [refObj, currentYear, availableYears]);

  // Range preview check
  const activeStart = tempStart;
  const activeEnd = tempEnd;

  return (
    <div
      id="custom-date-range-calendar"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-[620px] text-slate-800 select-none animate-in fade-in zoom-in-95 duration-150 z-50"
    >
      {/* ========================================================================= */}
      {/* LEFT COLUMN: ATALHOS / SHORTCUTS                                         */}
      {/* ========================================================================= */}
      <div className="w-full md:w-44 bg-slate-50/70 p-4 border-b md:border-b-0 md:border-r border-slate-200/70 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              ATALHOS
            </h4>
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
          </div>

          <div className="space-y-1 text-xs">
            <button
              type="button"
              onClick={() => handleShortcut('hoje')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('ontem')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('7d')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('15d')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Últimos 15 dias
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('30d')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('esteMes')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('mesPassado')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Mês Passado
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('4meses')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-blue-50 font-medium transition cursor-pointer"
            >
              Últimos 4 meses
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('tudo')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-indigo-900 hover:bg-indigo-50 font-semibold transition cursor-pointer"
            >
              Todo o Período
            </button>
          </div>
        </div>

        {/* Limpar Filtro button in Red */}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClearAll}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer uppercase tracking-wider"
          >
            <span>LIMPAR FILTRO</span>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: CALENDAR GRID & ACTIONS                                     */}
      {/* ========================================================================= */}
      <div className="flex-1 p-4 flex flex-col justify-between bg-white">
        <div>
          {/* Header with Navigation and Quick Month/Year selectors */}
          <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-100 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-slate-200/60"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Direct Month and Year Selectors */}
            <div className="flex items-center gap-1.5">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-slate-200/60"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (DOM SEG TER QUA QUI SEX SÁB) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((day) => (
              <div
                key={day}
                className="text-[10px] font-bold text-slate-400 uppercase py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Matrix (42 cells) */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
            {calendarCells.map((cell) => {
              const isStart = cell.dateIso === activeStart;
              const isEnd = cell.dateIso === activeEnd;
              const isSingleSelected = isStart && !activeEnd;

              const isInRange =
                activeStart &&
                activeEnd &&
                cell.dateIso > activeStart &&
                cell.dateIso < activeEnd;

              const isInHoverRange =
                activeStart &&
                !activeEnd &&
                hoverDate &&
                hoverDate > activeStart &&
                cell.dateIso > activeStart &&
                cell.dateIso < hoverDate;

              return (
                <div
                  key={cell.dateIso}
                  onClick={() => handleDayClick(cell.dateIso)}
                  onDoubleClick={() => handleDayDoubleClick(cell.dateIso)}
                  onMouseEnter={() => setHoverDate(cell.dateIso)}
                  onMouseLeave={() => setHoverDate(null)}
                  title={`${formatDateBR(cell.dateIso)} (Clique duas vezes para aplicar este dia)`}
                  className={`relative h-8 flex flex-col items-center justify-center cursor-pointer transition text-xs font-semibold
                    ${isInRange || isInHoverRange ? 'bg-blue-50 text-blue-950' : ''}
                    ${isStart && activeEnd ? 'rounded-l-full bg-blue-100' : ''}
                    ${isEnd && activeStart ? 'rounded-r-full bg-blue-100' : ''}
                  `}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full transition
                      ${
                        isStart || isEnd
                          ? 'bg-[#0a1930] text-white font-bold shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Today Blue Dot Indicator */}
                  {cell.isToday && !isStart && !isEnd && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-blue-600 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER: CUSTOMIZADO & BUTTONS                                             */}
        {/* ========================================================================= */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Custom Date Display */}
          <div className="text-left">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              CUSTOMIZADO
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {tempStart && tempEnd
                ? `${formatDateBR(tempStart)} - ${formatDateBR(tempEnd)}`
                : tempStart
                ? `${formatDateBR(tempStart)} - ${formatDateBR(tempStart)}`
                : 'Nenhum período selecionado'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTempStart('');
                setTempEnd('');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              LIMPAR
            </button>

            <button
              type="button"
              id="btn-apply-custom-calendar"
              onClick={handleApplyCustom}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0a1930] hover:bg-[#071324] rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>APLICAR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
