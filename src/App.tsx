import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  PlusCircle,
  Download,
  Sparkles,
  Inbox,
  CheckCircle2,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { BlitzRecord, FilterState, ThresholdConfig } from './types';
import { DEFAULT_THRESHOLDS, DEMO_BLITZ_RECORDS } from './data/initialData';
import {
  calculateKpis,
  filterRecords,
  getDateEvolution,
  getFactoryDistribution,
  getProductRanking,
  getTopRegisteredProducts,
  getStatusDistribution,
  getTypeDistribution,
  getMonthSummaries,
} from './utils/calculations';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { OccurrenceCharts } from './components/OccurrenceCharts';
import { MonthlyConsolidation } from './components/MonthlyConsolidation';
import { Footer } from './components/Footer';
import { ThresholdModal } from './components/ThresholdModal';
import { DataImportModal } from './components/DataImportModal';
import { RecordModal } from './components/RecordModal';
import { RawDataTableModal } from './components/RawDataTableModal';
import { calculateDaysBetween, formatDateBR } from './utils/formatters';
import {
  subscribeBlitzRecords,
  subscribeThresholdConfig,
  saveCloudRecord,
  deleteCloudRecord,
  saveCloudRecordsBatch,
  clearAllCloudRecords,
  saveThresholdConfig,
} from './services/cloudDataService';

const STORAGE_KEY_RECORDS = 'blitz_puxada_records_v2';
const STORAGE_KEY_THRESHOLDS = 'blitz_puxada_thresholds_v2';

const INITIAL_FILTERS: FilterState = {
  dataInicio: '',
  dataFim: '',
  fabrica: [],
  carreta: [],
  status: [],
  tipoOcorrencia: [],
  produto: [],
  searchTerm: '',
};

export default function App() {
  // State for raw records with Cloud Sync & local fallback
  const [records, setRecords] = useState<BlitzRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // State for Farol thresholds
  const [thresholds, setThresholds] = useState<ThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_THRESHOLDS;
  });

  // Cloud status
  const [isCloudSynced, setIsCloudSynced] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Modal visibility states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BlitzRecord | null>(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);

  // Real-time Cloud Firestore subscription for records
  useEffect(() => {
    const unsubscribeRecords = subscribeBlitzRecords(
      (cloudRecords) => {
        setRecords(cloudRecords);
        setIsCloudSynced(true);
        try {
          localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(cloudRecords));
        } catch {
          // ignore
        }
      },
      (err) => {
        console.warn('Could not sync with Firestore in realtime, using local cache:', err);
        setIsCloudSynced(false);
      }
    );

    const unsubscribeThresholds = subscribeThresholdConfig((cloudThresholds) => {
      setThresholds(cloudThresholds);
      try {
        localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(cloudThresholds));
      } catch {
        // ignore
      }
    });

    return () => {
      unsubscribeRecords();
      unsubscribeThresholds();
    };
  }, []);

  // Computed filtered records with dynamic thresholds
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters, thresholds.midRetentionMax || 5.0);
  }, [records, filters, thresholds.midRetentionMax]);

  // Computed KPIs and Analytics
  const totalBaseKpis = useMemo(() => calculateKpis(records), [records]);
  const kpis = useMemo(() => calculateKpis(filteredRecords), [filteredRecords]);
  const typeData = useMemo(() => getTypeDistribution(filteredRecords), [filteredRecords]);
  const factoryData = useMemo(() => getFactoryDistribution(filteredRecords), [filteredRecords]);
  const statusData = useMemo(() => getStatusDistribution(filteredRecords), [filteredRecords]);
  const dateEvolution = useMemo(() => getDateEvolution(filteredRecords), [filteredRecords]);
  const productRanking = useMemo(() => getProductRanking(filteredRecords), [filteredRecords]);
  const topProductsData = useMemo(() => getTopRegisteredProducts(filteredRecords), [filteredRecords]);

  // Check if any filter is active
  const isFiltered = useMemo(() => {
    return (
      Boolean(filters.dataInicio || filters.dataFim) ||
      filters.fabrica.length > 0 ||
      filters.carreta.length > 0 ||
      filters.status.length > 0 ||
      filters.tipoOcorrencia.length > 0 ||
      filters.produto.length > 0 ||
      Boolean(filters.searchTerm && filters.searchTerm.trim()) ||
      Boolean(filters.metaStatus && filters.metaStatus !== 'all')
    );
  }, [filters]);

  // Month summaries calculated from all stored records
  const monthSummaries = useMemo(() => {
    return getMonthSummaries(records);
  }, [records]);

  // Handle applying a monthly filter (from "YYYY-MM")
  const handleApplyMonthFilter = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${monthKey}-01`;
    const endDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
    setFilters((prev) => ({
      ...prev,
      dataInicio: startDate,
      dataFim: endDate,
    }));
  };

  // Handle clearing monthly filter
  const handleClearMonthFilter = () => {
    setFilters((prev) => ({
      ...prev,
      dataInicio: '',
      dataFim: '',
    }));
  };

  // Handle record creation / update in Cloud Firestore
  const handleSaveRecord = async (savedRecord: BlitzRecord) => {
    // Optimistic local update
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === savedRecord.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedRecord;
        return updated;
      }
      return [savedRecord, ...prev];
    });
    setEditingRecord(null);

    // Save to Cloud Firestore
    try {
      await saveCloudRecord(savedRecord);
    } catch (err) {
      console.error('Error saving record to cloud:', err);
    }
  };

  // Handle record deletion in Cloud Firestore
  const handleDeleteRecord = async (id: string) => {
    // Optimistic local update
    setRecords((prev) => prev.filter((r) => r.id !== id));

    // Delete in Cloud Firestore
    try {
      await deleteCloudRecord(id);
    } catch (err) {
      console.error('Error deleting record from cloud:', err);
    }
  };

  // Handle Import from Excel / CSV (Batch Cloud Upload)
  const handleImportData = async (newRecords: BlitzRecord[], mode: 'replace' | 'append') => {
    setIsSyncing(true);
    let nextList: BlitzRecord[] = [];
    if (mode === 'replace') {
      nextList = newRecords;
      setRecords(newRecords);
    } else {
      nextList = [...newRecords, ...records];
      setRecords(nextList);
    }
    setFilters(INITIAL_FILTERS);

    try {
      if (mode === 'replace') {
        await clearAllCloudRecords();
      }
      await saveCloudRecordsBatch(newRecords);
    } catch (err) {
      console.error('Error saving batch records to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Clear All Data (Zerar base na nuvem)
  const handleClearAllData = async () => {
    if (window.confirm('Atenção: Deseja realmente zerar todos os dados da plataforma? Todos os registros na nuvem serão removidos para todos os usuários.')) {
      setRecords([]);
      setFilters(INITIAL_FILTERS);
      try {
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify([]));
        await clearAllCloudRecords();
      } catch (err) {
        console.error('Error clearing cloud records:', err);
      }
    }
  };

  // Handle Load Demo Data to Cloud
  const handleLoadDemoData = async () => {
    setIsSyncing(true);
    setRecords(DEMO_BLITZ_RECORDS);
    setFilters(INITIAL_FILTERS);
    try {
      await saveCloudRecordsBatch(DEMO_BLITZ_RECORDS);
    } catch (err) {
      console.error('Error loading demo records to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle saving thresholds
  const handleSaveThresholds = async (newConfig: ThresholdConfig) => {
    setThresholds(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(newConfig));
      await saveThresholdConfig(newConfig);
    } catch (err) {
      console.error('Error saving thresholds to cloud:', err);
    }
  };

  // Handle download of official blank Excel template
  const handleDownloadStandardTemplate = () => {
    const standardTemplate = [
      {
        CodProduto: '13205',
        Descricao: 'SKOL LITRINHO',
        FABRICA: 'ITAPISSUMA',
        NOTA: '1042968',
        CARRETA: 'RLU3F59',
        'Data da chegada': '02/01/2026',
        'Data do bloqueio': '02/01/2026',
        'EMBALAGEM AVARIADA': 'EMBALAGEM AVARIADA',
        Responsável: 'Nixon Henrique',
        'BLITZ DE PUXADA': 'BLITZ DE PUXADA',
        QT: 90,
        'Motivo Retrabalho': 'REALIZAR RETRABALHO',
        GILSON: 'GILSON',
        Status: 'LIBERADO PARCIAL',
        'QTD Retida': 4,
      },
      {
        CodProduto: '9068',
        Descricao: 'SKOL 350ML',
        FABRICA: 'ITAPISSUMA',
        NOTA: '1042970',
        CARRETA: 'RLU3F59',
        'Data da chegada': '02/01/2026',
        'Data do bloqueio': '02/01/2026',
        'EMBALAGEM AVARIADA': 'EMBALAGEM AVARIADA',
        Responsável: 'Nixon Henrique',
        'BLITZ DE PUXADA': 'BLITZ DE PUXADA',
        QT: 286,
        'Motivo Retrabalho': 'Retrabalho devido alta quantidade de avarias',
        GILSON: 'GILSON',
        Status: 'LIBERADO PARCIAL',
        'QTD Retida': 4,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(standardTemplate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BLITZ_PUXADA');
    XLSX.writeFile(wb, 'modelo_planilha_blitz_puxada.xlsx');
  };

  // Handle Export of current filtered view to Excel (standard 15 columns)
  const handleExportFilteredExcel = () => {
    if (filteredRecords.length === 0) {
      alert('Não há registros na base para exportar.');
      return;
    }

    const rows = filteredRecords.map((r) => ({
      CodProduto: r.codigoProduto,
      Descricao: r.produto,
      FABRICA: r.fabrica,
      NOTA: r.nota,
      CARRETA: r.carreta,
      'Data da chegada': formatDateBR(r.dataChegada),
      'Data do bloqueio': formatDateBR(r.dataBloqueio),
      'EMBALAGEM AVARIADA': r.tipoOcorrencia,
      Responsável: r.responsavel,
      'BLITZ DE PUXADA': r.origem || 'BLITZ DE PUXADA',
      QT: r.qtdPuxada,
      'Motivo Retrabalho': r.motivoRetrabalho,
      GILSON: r.supervisor || 'GILSON',
      Status: r.status.toUpperCase(),
      'QTD Retida': r.qtdRetida,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BLITZ_PUXADA');
    XLSX.writeFile(
      wb,
      `blitz_puxada_relatorio_executivo_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Quick filter by clicking a product in top 10 ranking
  const handleSelectProduct = (productName: string) => {
    setFilters((prev) => ({
      ...prev,
      produto: prev.produto.includes(productName) ? [] : [productName],
    }));
  };

  return (
    <div className="min-h-screen bg-pau-brasil-ambient text-slate-800 font-sans flex flex-col relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Pau Brasil Signature Background Ambient Waves & Vector Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Ambient Light Glow */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-3xl" />
        {/* Top-Right Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/25 rounded-full blur-3xl" />
        
        {/* Bottom Left Flowing Corporate Wave */}
        <svg
          className="absolute -bottom-10 -left-10 w-[700px] h-[450px] opacity-40 md:opacity-50"
          viewBox="0 0 700 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 450 C 120 400, 200 250, 420 320 C 580 370, 680 200, 720 120 L 720 450 Z"
            fill="url(#wave-grad-1)"
          />
          <path
            d="M-20 450 C 80 360, 240 380, 360 270 C 480 160, 620 220, 700 180"
            stroke="url(#line-grad-1)"
            strokeWidth="3"
            strokeDasharray="8 6"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Right Fluid Corporate Wave */}
        <svg
          className="absolute -bottom-12 -right-12 w-[850px] h-[500px] opacity-45 md:opacity-60"
          viewBox="0 0 850 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M850 500 L 0 500 C 150 420, 280 440, 420 340 C 560 240, 680 260, 850 150 Z"
            fill="url(#wave-grad-2)"
          />
          <path
            d="M850 420 C 720 350, 580 380, 460 260 C 340 140, 200 200, 50 180"
            stroke="url(#line-grad-2)"
            strokeWidth="3.5"
            opacity="0.7"
          />
          <path
            d="M850 480 C 690 410, 520 420, 390 320 C 260 220, 180 260, 0 300"
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <defs>
            <linearGradient id="wave-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#1e3a8a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="line-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Unified Executive Header & Filters Card */}
      <header id="dashboard-header-filters" className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-1 relative z-30">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)] border border-white/80 p-4 sm:p-5 flex flex-col gap-3.5 relative">
          <Header
            totalRecords={records.length}
            filteredCount={filteredRecords.length}
            isCloudSynced={isCloudSynced}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenNewRecord={() => {
              setEditingRecord(null);
              setIsRecordModalOpen(true);
            }}
            onOpenThresholds={() => setIsThresholdModalOpen(true)}
            onOpenRawData={() => setIsRawDataOpen(true)}
            onClearAllData={handleClearAllData}
            onLoadDemoData={handleLoadDemoData}
            onExportReport={handleExportFilteredExcel}
          />

          {/* Divider between Header and FilterBar */}
          <div className="border-t border-slate-200/80 -mx-1" />

          {/* Interactive Filter Bar */}
          <FilterBar
            records={records}
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={() => setFilters(INITIAL_FILTERS)}
            thresholds={thresholds}
          />
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 relative z-10">
        {/* Empty State Banner when platform is zeroed */}
        {records.length === 0 && (
          <div
            id="zero-data-empty-banner"
            className="mb-4 bg-gradient-to-r from-slate-900 via-[#0e213d] to-slate-900 text-white rounded-xl border border-blue-500/30 p-5 shadow-lg relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white uppercase tracking-wide">
                      Plataforma Zerada e Pronta
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      0 Registros
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    A base de dados está limpa. Importe sua planilha da operação ou realize novos lançamentos manuais.
                  </p>
                </div>
              </div>

              {/* Action buttons on Zero State */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Importar Planilha (.xlsx)</span>
                </button>

                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setIsRecordModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Nova Ocorrência</span>
                </button>

                <button
                  onClick={handleDownloadStandardTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Baixar Modelo</span>
                </button>

                <button
                  onClick={handleLoadDemoData}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 font-medium transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Carregar Exemplo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primeira Linha — 4 Cartões Grandes de Indicadores (KPIs) */}
        <KpiCards
          kpis={kpis}
          totalBaseKpis={totalBaseKpis}
          thresholds={thresholds}
          onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
          isFiltered={Boolean(isFiltered)}
          totalRecordsCount={records.length}
          filteredRecordsCount={filteredRecords.length}
        />

        {/* Consolidado do Mês / Período em Questão (Síntese, Gráficos de Retenção & Caixas, Histórico Mensal) */}
        <MonthlyConsolidation
          records={records}
          filteredRecords={filteredRecords}
          monthSummaries={monthSummaries}
          thresholds={thresholds}
          filters={filters}
          onFilterChange={setFilters}
          activeDateFilter={{ dataInicio: filters.dataInicio, dataFim: filters.dataFim }}
          onApplyMonthFilter={handleApplyMonthFilter}
          onClearMonthFilter={handleClearMonthFilter}
        />

        {/* Análise Detalhada das Ocorrências (4 Gráficos: Tipo, Fábrica, Status e Top 10 Produtos) */}
        <OccurrenceCharts
          typeData={typeData}
          factoryData={factoryData}
          statusData={statusData}
          topProductsData={topProductsData}
        />
      </main>

      {/* Corporate Footer */}
      <Footer />

      {/* Modal: Configurar Limites do Farol */}
      <ThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
      />

      {/* Modal: Importar Dados (Excel/CSV) */}
      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportData={handleImportData}
      />

      {/* Modal: Adicionar / Editar Ocorrência */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
      />

      {/* Modal: Tabela de Dados Completa */}
      <RawDataTableModal
        isOpen={isRawDataOpen}
        onClose={() => setIsRawDataOpen(false)}
        records={filteredRecords}
        onEditRecord={(record) => {
          setEditingRecord(record);
          setIsRecordModalOpen(true);
        }}
        onDeleteRecord={handleDeleteRecord}
        onOpenNewRecord={() => {
          setEditingRecord(null);
          setIsRecordModalOpen(true);
        }}
        onOpenImport={() => setIsImportOpen(true)}
      />
    </div>
  );
}
