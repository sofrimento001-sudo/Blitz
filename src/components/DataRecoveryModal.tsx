import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  Sparkles,
  CloudUpload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  History,
  Info,
  Clock,
} from 'lucide-react';
import { BlitzRecord } from '../types';
import {
  BackupSnapshot,
  getAvailableBackups,
  exportBackupJson,
  importBackupJson,
} from '../services/backupService';
import { DEMO_BLITZ_RECORDS } from '../data/initialData';
import { formatDateBR } from '../utils/formatters';

interface DataRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecords: BlitzRecord[];
  onRestoreRecords: (records: BlitzRecord[], sourceName: string) => Promise<void> | void;
  onOpenExcelImport: () => void;
  cloudStatus: string;
  cloudErrorMessage?: string;
}

export const DataRecoveryModal: React.FC<DataRecoveryModalProps> = ({
  isOpen,
  onClose,
  currentRecords,
  onRestoreRecords,
  onOpenExcelImport,
  cloudStatus,
  cloudErrorMessage,
}) => {
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<BackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backups whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const available = getAvailableBackups();
      setBackups(available);
      if (available.length > 0) {
        setSelectedSnapshot(available[0]);
      }
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (records: BlitzRecord[], name: string) => {
    setIsRestoring(true);
    setErrorMessage(null);
    try {
      await onRestoreRecords(records, name);
      setSuccessMessage(`Base restaurada com sucesso: ${records.length} registros recuperados.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(`Erro ao restaurar dados: ${err.message || 'Falha desconhecida'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importBackupJson(file);
      await handleRestore(imported, `Arquivo JSON (${file.name})`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Arquivo de backup inválido.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight uppercase flex items-center gap-2">
                Central de Recuperação & Segurança
              </h2>
              <p className="text-xs text-slate-300">
                Restaure dados a partir de backups automáticos, planilhas ou arquivos de segurança
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* Status Alert Banner */}
          {cloudErrorMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aviso da Conexão em Nuvem:</span>
                <p className="mt-0.5">{cloudErrorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seção 1: Backups Automáticos Detectados no Navegador */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-800 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                Backups Automáticos Encontrados no Dispositivo
              </h3>
              <span className="text-[11px] text-slate-500">
                {backups.length} snapshot{backups.length === 1 ? '' : 's'} disponível{backups.length === 1 ? '' : 'is'}
              </span>
            </div>

            {backups.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {backups.map((snap, idx) => {
                  const dateFormatted = new Date(snap.timestamp).toLocaleString('pt-BR');
                  return (
                    <div
                      key={snap.id || idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/60 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {snap.count}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {snap.source || 'Cópia de Segurança Local'}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dateFormatted} ({snap.count} registros preservados)
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={isRestoring}
                        onClick={() => handleRestore(snap.records, snap.source)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs hover:shadow transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        Restaurar Este
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs text-center">
                Nenhum snapshot automático prévio foi encontrado no armazenamento deste navegador. Utilize as opções abaixo para repopular ou reimportar.
              </div>
            )}
          </div>

          <div className="border-t border-slate-200" />

          {/* Seção 2: Outros Métodos de Recuperação / Reimportação */}
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-800 mb-2.5 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              Outras Fontes de Recuperação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botão Importar Planilha do Computador */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExcelImport();
                }}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-emerald-950 group-hover:text-emerald-800">
                    Reimportar Planilha (.xlsx)
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Envie novamente o arquivo original do Excel ou ERP.
                  </div>
                </div>
              </button>

              {/* Botão Carregar Exemplo de Demonstração */}
              <button
                type="button"
                onClick={() => handleRestore(DEMO_BLITZ_RECORDS, 'Base de Demonstração Oficial')}
                className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-left transition flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-indigo-950 group-hover:text-indigo-800">
                    Base Demonstrativa
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    Restaurar 21 registros de teste padrão da Blitz.
                  </div>
                </div>
              </button>

              {/* Botão Importar Arquivo de Backup JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-slate-700">
                    Importar Backup (.json)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Carregar arquivo de backup salvo anteriormente.
                  </div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                className="hidden"
              />

              {/* Botão Exportar Backup JSON Atual */}
              <button
                type="button"
                disabled={currentRecords.length === 0}
                onClick={() => exportBackupJson(currentRecords)}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-start gap-3 cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-slate-700">
                    Baixar Backup Atual (.json)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Salvar cópia de segurança dos {currentRecords.length} registros atuais.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Os backups automáticos são salvos localmente no navegador após cada alteração.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
