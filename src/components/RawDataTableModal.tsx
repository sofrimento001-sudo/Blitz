import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Search,
  Download,
  Edit2,
  Trash2,
  Table,
  ArrowUpDown,
  Filter,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { BlitzRecord } from '../types';
import { calculateDaysBetween, formatDateBR, formatNumber, formatPercent } from '../utils/formatters';

interface RawDataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: BlitzRecord[];
  onEditRecord: (record: BlitzRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenNewRecord: () => void;
  onOpenImport?: () => void;
}

export const RawDataTableModal: React.FC<RawDataTableModalProps> = ({
  isOpen,
  onClose,
  records,
  onEditRecord,
  onDeleteRecord,
  onOpenNewRecord,
  onOpenImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BlitzRecord | 'percentualRetida' | 'diasBloqueio'>('dataChegada');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleSort = (field: keyof BlitzRecord | 'percentualRetida' | 'diasBloqueio') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered and Sorted Records
  const processedRecords = useMemo(() => {
    let result = records.filter((r) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.produto.toLowerCase().includes(term) ||
        r.codigoProduto.toLowerCase().includes(term) ||
        r.fabrica.toLowerCase().includes(term) ||
        r.carreta.toLowerCase().includes(term) ||
        r.nota.toLowerCase().includes(term) ||
        r.tipoOcorrencia.toLowerCase().includes(term) ||
        r.responsavel.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term) ||
        r.dataChegada.includes(term) ||
        (r.motivoRetrabalho && r.motivoRetrabalho.toLowerCase().includes(term))
      );
    });

    result.sort((a, b) => {
      let valA: any = a[sortField as keyof BlitzRecord];
      let valB: any = b[sortField as keyof BlitzRecord];

      if (sortField === 'percentualRetida') {
        valA = a.qtdPuxada > 0 ? (a.qtdRetida / a.qtdPuxada) * 100 : 0;
        valB = b.qtdPuxada > 0 ? (b.qtdRetida / b.qtdPuxada) * 100 : 0;
      } else if (sortField === 'diasBloqueio') {
        valA = calculateDaysBetween(a.dataChegada, a.dataBloqueio);
        valB = calculateDaysBetween(b.dataChegada, b.dataBloqueio);
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    return result;
  }, [records, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;
  const paginatedRecords = processedRecords.slice((page - 1) * pageSize, page * pageSize);

  // Export to Excel (exact standard columns)
  const handleExportExcel = () => {
    const rows = processedRecords.map((r) => ({
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
    XLSX.writeFile(wb, `base_blitz_puxada_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-[#0b192e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Base Operacional de Ocorrências | Blitz de Puxada
              </h3>
              <p className="text-xs text-slate-300">
                Visualização detalhada, edição e exportação de todos os registros da base
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por qualquer coluna (produto, NF, fábrica, responsável)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenImport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow-sm transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Importar Planilha
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar para Excel (.xlsx)
            </button>
            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + Nova Ocorrência
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10 select-none text-[11px] uppercase">
              <tr>
                <th
                  onClick={() => handleSort('dataChegada')}
                  className="py-2.5 px-2.5 hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>Chegada</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dataBloqueio')}
                  className="py-2.5 px-2 hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>Bloqueio</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('diasBloqueio')}
                  className="py-2.5 px-2 hover:bg-slate-200 cursor-pointer text-center"
                >
                  <span>Dias</span>
                </th>
                <th
                  onClick={() => handleSort('fabrica')}
                  className="py-2.5 px-2.5 hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>Fábrica</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-2">Carreta / NF</th>
                <th
                  onClick={() => handleSort('produto')}
                  className="py-2.5 px-2.5 hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>Produto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qtdPuxada')}
                  className="py-2.5 px-2 text-right hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>QTD Puxada</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qtdRetida')}
                  className="py-2.5 px-2 text-right hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>QTD Retida</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('percentualRetida')}
                  className="py-2.5 px-2 text-right hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Retida</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tipoOcorrencia')}
                  className="py-2.5 px-2.5 hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>Tipo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-2.5 hover:bg-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => {
                  const pct = r.qtdPuxada > 0 ? (r.qtdRetida / r.qtdPuxada) * 100 : 0;
                  const dias = calculateDaysBetween(r.dataChegada, r.dataBloqueio);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2.5 whitespace-nowrap text-slate-700">
                        {formatDateBR(r.dataChegada)}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-500">
                        {formatDateBR(r.dataBloqueio)}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-600">
                        {dias}d
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap text-slate-800 font-semibold">
                        {r.fabrica}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-600 text-[11px]">
                        <div>{r.carreta}</div>
                        <div className="text-slate-400">{r.nota}</div>
                      </td>
                      <td className="py-2 px-2.5 max-w-[200px] truncate" title={r.produto}>
                        <div className="font-semibold text-slate-800 truncate">{r.produto}</div>
                        <div className="text-[10px] text-slate-400">{r.codigoProduto}</div>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-700">
                        {formatNumber(r.qtdPuxada)}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-rose-600">
                        {formatNumber(r.qtdRetida)}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-800">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            pct > 5
                              ? 'bg-rose-100 text-rose-800'
                              : pct > 2.5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {formatPercent(pct, 1)}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-200">
                          {r.tipoOcorrencia}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'Liberado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Bloqueado'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              onClose();
                              onEditRecord(r);
                            }}
                            title="Editar registro"
                            className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir o registro ${r.nota}?`)) {
                                onDeleteRecord(r.id);
                              }
                            }}
                            title="Excluir registro"
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Nenhum registro encontrado com os critérios pesquisados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Mostrando <strong>{(page - 1) * pageSize + 1}</strong> a{' '}
            <strong>{Math.min(page * pageSize, processedRecords.length)}</strong> de{' '}
            <strong>{processedRecords.length}</strong> registros
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-2 text-slate-700 font-semibold">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
