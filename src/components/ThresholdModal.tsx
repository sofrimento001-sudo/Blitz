import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { ThresholdConfig } from '../types';
import { DEFAULT_THRESHOLDS } from '../data/initialData';

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onSave: (config: ThresholdConfig) => void;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
}) => {
  const [lowMax, setLowMax] = useState(thresholds.lowRetentionMax);
  const [midMax, setMidMax] = useState(thresholds.midRetentionMax);

  useEffect(() => {
    if (isOpen) {
      setLowMax(thresholds.lowRetentionMax);
      setMidMax(thresholds.midRetentionMax);
    }
  }, [isOpen, thresholds]);

  const handleSave = () => {
    onSave({
      lowRetentionMax: Number(lowMax) || 2.5,
      midRetentionMax: Number(midMax) || 5.0,
    });
    onClose();
  };

  const handleReset = () => {
    setLowMax(DEFAULT_THRESHOLDS.lowRetentionMax);
    setMidMax(DEFAULT_THRESHOLDS.midRetentionMax);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-[#0b192e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Configuração do Farol de Desempenho
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600">
            Defina os limites percentuais de <strong>% Retenção</strong> para categorizar o farol
            operacional nos cards e gráficos:
          </p>

          {/* Green limit */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                🟢 Nível Baixo (Dentro da Meta)
              </span>
              <span className="text-emerald-700 font-semibold">&le; {lowMax}%</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-slate-600 font-medium">Limite Máximo Verde (%):</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={lowMax}
                onChange={(e) => setLowMax(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Yellow limit */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-amber-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                🟡 Nível Atenção Operacional
              </span>
              <span className="text-amber-700 font-semibold">
                {lowMax}% a {midMax}%
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-slate-600 font-medium">Limite Máximo Amarelo (%):</label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="50"
                value={midMax}
                onChange={(e) => setMidMax(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Red limit */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                🔴 Nível Alto (Crítico)
              </span>
              <span className="text-rose-700 font-semibold">&gt; {midMax}%</span>
            </div>
            <p className="text-[11px] text-rose-600 mt-1">
              Qualquer valor superior a {midMax}% será destacado como crítico em vermelho.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrão
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Salvar Parâmetros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
