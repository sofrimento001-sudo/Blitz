import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  FileSpreadsheet,
  SlidersHorizontal,
  TableProperties,
  Download,
  Trash2,
  Sparkles,
  MoreHorizontal,
  Cloud,
  CloudCheck,
  CloudAlert,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { CloudSyncStatus } from '../services/cloudDataService';

interface HeaderProps {
  onOpenImport: () => void;
  onOpenNewRecord: () => void;
  onOpenThresholds: () => void;
  onOpenRawData: () => void;
  onOpenRecovery: () => void;
  onClearAllData: () => void;
  onLoadDemoData: () => void;
  onExportReport: () => void;
  totalRecords: number;
  filteredCount: number;
  cloudStatus: CloudSyncStatus;
  cloudErrorMessage?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImport,
  onOpenNewRecord,
  onOpenThresholds,
  onOpenRawData,
  onOpenRecovery,
  onClearAllData,
  onLoadDemoData,
  onExportReport,
  totalRecords,
  filteredCount,
  cloudStatus,
  cloudErrorMessage,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Brand & Main Title */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 font-sans uppercase">
              BLITZ DE PUXADA
            </h1>
            
            {cloudStatus === 'connected' && (
              <span
                title="Banco de dados em nuvem sincronizado em tempo real"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <CloudCheck className="w-3 h-3 text-emerald-600" />
                Nuvem Ativa
              </span>
            )}

            {cloudStatus === 'quota_exceeded' && (
              <button
                type="button"
                onClick={onOpenRecovery}
                title="Cota gratuita do Firestore atingida no momento. Seus dados estão preservados no modo local do navegador."
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
              >
                <CloudAlert className="w-3 h-3 text-amber-600" />
                Modo Local (Cota)
              </button>
            )}

            {cloudStatus === 'offline' && (
              <span
                title="Operando em cache local offline"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-300"
              >
                <Cloud className="w-3 h-3 text-slate-500" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
        {/* Recuperação de Dados */}
        <button
          id="btn-header-recovery"
          type="button"
          onClick={onOpenRecovery}
          title="Central de Recuperação, Backups e Restauração de Dados"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300/80 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Recuperar / Backups</span>
        </button>

        {/* + Nova Ocorrência */}
        <button
          id="btn-add-record"
          type="button"
          onClick={onOpenNewRecord}
          title="Registrar novo apontamento de Blitz"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Ocorrência</span>
        </button>

        {/* Exportar XLS */}
        <button
          id="btn-header-export-xls"
          type="button"
          onClick={onExportReport}
          title="Exportar dados filtrados para Excel (.xlsx)"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar XLS</span>
        </button>

        {/* Importar */}
        <button
          id="btn-header-import"
          type="button"
          onClick={onOpenImport}
          title="Importar planilha Excel ou CSV"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Importar</span>
        </button>

        {/* Tools Menu (Farol, Zerar, Exemplo) */}
        <div className="relative" ref={toolsRef}>
          <button
            type="button"
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            title="Mais ferramentas e configurações"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-700 transition cursor-pointer shadow-2xs"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isToolsOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-semibold text-slate-700 text-left animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  onOpenRecovery();
                  setIsToolsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition text-amber-800 font-bold"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Central de Recuperação</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenThresholds();
                  setIsToolsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>Configurar Farol</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenRawData();
                  setIsToolsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2.5 transition"
              >
                <TableProperties className="w-3.5 h-3.5 text-blue-600" />
                <span>Tabela Geral da Base</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              {totalRecords > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    onClearAllData();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar Base de Dados</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onLoadDemoData();
                    setIsToolsOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-indigo-700 flex items-center gap-2.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carregar Dados Demo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
