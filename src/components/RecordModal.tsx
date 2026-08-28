import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Save, Calendar, Building2, Truck, FileText, Package, AlertTriangle } from 'lucide-react';
import { BlitzRecord } from '../types';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: BlitzRecord) => void;
  initialRecord?: BlitzRecord | null;
}

const COMMON_OCCURRENCE_TYPES = [
  'EMBALAGEM AVARIADA',
  'BLITZ PUXADA',
  'FALTA NO PALLET',
  'GARRAFA QUEBRADA',
  'VAZAMENTO DE LÍQUIDO',
  'LATA AMASSADA',
  'PALLET TOMBADO',
  'CODIFICAÇÃO ILEGÍVEL',
  'PRODUTO VENCIDO',
  'OUTROS',
];

const COMMON_STATUSES = [
  'Liberado',
  'Liberado Parcial',
  'Bloqueado',
  'Em Análise',
  'Retrabalho Concluído',
  'Descarte',
];

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
}) => {
  const [formData, setFormData] = useState<Partial<BlitzRecord>>({
    dataChegada: new Date().toISOString().split('T')[0],
    dataBloqueio: new Date().toISOString().split('T')[0],
    fabrica: '',
    carreta: '',
    nota: '',
    codigoProduto: '',
    produto: '',
    qtdPuxada: 10000,
    qtdRetida: 200,
    tipoOcorrencia: 'EMBALAGEM AVARIADA',
    motivoRetrabalho: '',
    responsavel: '',
    status: 'Bloqueado',
    observacao: '',
  });

  useEffect(() => {
    if (initialRecord) {
      setFormData(initialRecord);
    } else {
      setFormData({
        dataChegada: '2026-08-27',
        dataBloqueio: '2026-08-27',
        fabrica: 'Ambev Jaguariúna',
        carreta: '',
        nota: '',
        codigoProduto: '',
        produto: '',
        qtdPuxada: 15000,
        qtdRetida: 300,
        tipoOcorrencia: 'EMBALAGEM AVARIADA',
        motivoRetrabalho: '',
        responsavel: '',
        status: 'Bloqueado',
        observacao: '',
      });
    }
  }, [initialRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.produto || !formData.fabrica) {
      alert('Por favor, preencha os campos obrigatórios (Fábrica e Produto).');
      return;
    }

    const record: BlitzRecord = {
      id: initialRecord?.id || `REC-${Date.now()}`,
      dataChegada: formData.dataChegada || '2026-08-27',
      dataBloqueio: formData.dataBloqueio || formData.dataChegada || '2026-08-27',
      fabrica: formData.fabrica || 'Não Informada',
      carreta: formData.carreta || 'S/P',
      nota: formData.nota || 'S/N',
      codigoProduto: formData.codigoProduto || 'SKU-000',
      produto: formData.produto || 'Produto Não Informado',
      qtdPuxada: Number(formData.qtdPuxada) || 0,
      qtdRetida: Number(formData.qtdRetida) || 0,
      tipoOcorrencia: formData.tipoOcorrencia || 'OUTROS',
      motivoRetrabalho: formData.motivoRetrabalho || '',
      responsavel: formData.responsavel || 'Operação',
      status: formData.status || 'Bloqueado',
      observacao: formData.observacao || '',
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-[#0b192e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {initialRecord ? 'Editar Ocorrência | Blitz de Puxada' : 'Registrar Nova Ocorrência | Blitz de Puxada'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Data da Chegada */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Data da Chegada *</label>
              <input
                type="date"
                required
                value={formData.dataChegada}
                onChange={(e) => setFormData({ ...formData, dataChegada: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Data do Bloqueio */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Data do Bloqueio *</label>
              <input
                type="date"
                required
                value={formData.dataBloqueio}
                onChange={(e) => setFormData({ ...formData, dataBloqueio: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fábrica */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fábrica *</label>
              <input
                type="text"
                required
                list="breweries-list"
                placeholder="Ex: ITAPISSUMA, JAGUARIÚNA, AGUDOS..."
                value={formData.fabrica}
                onChange={(e) => setFormData({ ...formData, fabrica: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase"
              />
              <datalist id="breweries-list">
                <option value="ITAPISSUMA" />
                <option value="JAGUARIÚNA" />
                <option value="AGUDOS" />
                <option value="JUNDIAÍ" />
                <option value="CAMAÇARI" />
                <option value="UBERLÂNDIA" />
                <option value="ANÁPOLIS" />
                <option value="PONTA GROSSA" />
                <option value="ARARAQUARA" />
                <option value="SETE LAGOAS" />
                <option value="JACAREÍ" />
                <option value="AQUIRAZ" />
                <option value="TERESINA" />
                <option value="MANAUS" />
                <option value="BRASÍLIA" />
                <option value="ELDORADO" />
                <option value="LAGES" />
              </datalist>
            </div>

            {/* Carreta */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Carreta / Placa</label>
              <input
                type="text"
                placeholder="Ex: BRA-4E21 (Carreta 104)"
                value={formData.carreta}
                onChange={(e) => setFormData({ ...formData, carreta: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Nota Fiscal */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nota Fiscal (NF)</label>
              <input
                type="text"
                placeholder="Ex: NF-449102"
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Produto */}
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Produto / Descrição *</label>
              <input
                type="text"
                required
                placeholder="Ex: Cerveja Skol Pilsen 350ml Cx 12"
                value={formData.produto}
                onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Código do Produto */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Código / SKU</label>
              <input
                type="text"
                placeholder="Ex: SKU-0012"
                value={formData.codigoProduto}
                onChange={(e) => setFormData({ ...formData, codigoProduto: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantidade Puxada */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantidade Puxada (cx) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.qtdPuxada}
                onChange={(e) => setFormData({ ...formData, qtdPuxada: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            {/* Quantidade Retida */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantidade Retida (cx) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.qtdRetida}
                onChange={(e) => setFormData({ ...formData, qtdRetida: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-rose-700 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Tipo de Ocorrência */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tipo de Ocorrência *</label>
              <select
                value={formData.tipoOcorrencia}
                onChange={(e) => setFormData({ ...formData, tipoOcorrencia: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
              >
                {COMMON_OCCURRENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Responsável</label>
              <input
                type="text"
                placeholder="Ex: Nixon Henrique"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Supervisor / Aprovador */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Supervisor (Aprovador)</label>
              <input
                type="text"
                placeholder="Ex: GILSON"
                value={formData.supervisor || ''}
                onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>

            {/* Status */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
              >
                {COMMON_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Motivo / Ação de Retrabalho */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Motivo / Ação de Retrabalho
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o motivo do desvio e o procedimento de retrabalho realizado ou recomendado..."
              value={formData.motivoRetrabalho}
              onChange={(e) => setFormData({ ...formData, motivoRetrabalho: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Ocorrência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
