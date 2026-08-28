import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  ClipboardPaste,
  Info,
  Layers,
  RotateCcw,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BlitzRecord } from '../types';
import { normalizeDateToIso } from '../utils/formatters';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (records: BlitzRecord[], mode: 'replace' | 'append') => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'schema'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<BlitzRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear preview and reset file input
  const handleResetPreview = () => {
    setParsedPreview([]);
    setFileName(null);
    setErrorMessage(null);
    setPasteContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset state when modal is opened afresh
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Helper to normalize header keys (removes accents, spaces, special chars)
  const normalizeKey = (key: string): string => {
    return String(key || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Helper for formatting status neatly
  const formatStatus = (val: string): string => {
    const clean = String(val || '').trim();
    const upper = clean.toUpperCase();
    if (upper === 'LIBERADO') return 'Liberado';
    if (upper.includes('PARCIAL')) return 'Liberado Parcial';
    if (upper.includes('BLOQUE')) return 'Bloqueado';
    if (upper.includes('ANALIS')) return 'Em Análise';
    if (upper.includes('CONCLUID') || upper.includes('RETRABALHO')) return 'Retrabalho Concluído';
    if (upper.includes('DESCART')) return 'Descarte';
    return clean || 'Liberado';
  };

  // Helper for dates (handle Excel numeric dates, DD/MM/AAAA or YYYY-MM-DD)
  const parseDate = (val: any, defaultVal = '2026-08-28'): string => {
    if (!val) return defaultVal;
    if (typeof val === 'number') {
      // Excel serial date (origin: 1899-12-30)
      const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      return !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : defaultVal;
    }
    const iso = normalizeDateToIso(val);
    return iso || defaultVal;
  };

  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = String(val)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Check if a string looks like a date
  const isDateValue = (val: any): boolean => {
    if (!val) return false;
    if (typeof val === 'number' && val > 40000 && val < 60000) return true; // Excel date serial range 2010-2064
    const str = String(val).trim();
    return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(str) || /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(str);
  };

  // Check if a string looks like a vehicle plate
  const isPlateValue = (val: any): boolean => {
    if (!val) return false;
    const str = String(val).trim().toUpperCase();
    return /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/.test(str) || /^[A-Z]{3}[0-9]{4}$/.test(str);
  };

  // Known Beverage keywords to identify Product description column
  const BEVERAGE_KEYWORDS = [
    'SKOL', 'BRAHMA', 'STELLA', 'PEPSI', 'GUARANA', 'GUARANÁ', 'CORONA', 'BUDWEISER',
    'SPATEN', 'ANTARCTICA', 'BEATS', 'BOHEMIA', 'FUSION', 'TONICA', 'TÔNICA', 'SUKITA',
    'H2OH', 'GATORADE', 'LATA', 'PET', 'LONG NECK', 'SLEEK', 'GARRAFA', 'CX', 'CARTAO',
    'CARTÃO', 'RET', 'RGB', 'CHOPP', 'ZERO', 'PURE GOLD', 'LITRINHO', 'MP', 'C/', 'CX/6', 'CX/12'
  ];

  const isBeverageDescription = (val: any): boolean => {
    if (!val) return false;
    const upper = String(val).toUpperCase();
    return BEVERAGE_KEYWORDS.some((kw) => upper.includes(kw));
  };

  // Known Breweries / Factories
  const FACTORY_KEYWORDS = [
    'ITAPISSUMA', 'AGUDOS', 'JAGUARIUNA', 'JAGUARIÚNA', 'JUNDIAI', 'JUNDIAÍ',
    'CAMACARI', 'CAMAÇARI', 'UBERLANDIA', 'UBERLÂNDIA', 'ANAPOLIS', 'ANÁPOLIS',
    'PONTAGROSSA', 'PONTA GROSSA', 'ARARAQUARA', 'CURITIBA', 'BRASILIA', 'BRASÍLIA',
    'MANAUS', 'ELDORADO', 'PERNAMBUCO', 'SETE LAGOAS', 'JACAREI', 'JACAREÍ',
    'TAUBATE', 'TAUBATÉ', 'TERESINA', 'MARITUBA', 'LAGES', 'RIO DE JANEIRO',
    'BELEM', 'BELÉM', 'AQUIRAZ', 'SAPUCAIA', 'GUARULHOS', 'MONTENEGRO', 'JOINVILLE',
    'CORONEL FABRICIANO', 'VIDRARIA', 'CEBRASA', 'CDD', 'FABRICA', 'FÁBRICA', 'AMBEV'
  ];

  const isFactoryName = (val: any): boolean => {
    if (!val) return false;
    const upper = String(val).toUpperCase();
    return FACTORY_KEYWORDS.some((kw) => upper.includes(kw));
  };

  // Check if string looks like an occurrence type
  const OCCURRENCE_KEYWORDS = [
    'EMBALAGEM AVARIADA', 'AVARIA', 'QUALIDADE', 'DATA CRITICA', 'DATA CRÍTICA',
    'VAZAMENTO', 'QUEBRA', 'ROTULO', 'RÓTULO', 'SUJIDADE', 'FALTA', 'AMASSADO',
    'ESTUFADO', 'PALETE', 'BLOQUEIO', 'GARRAFA QUEBRADA', 'LATA FURADA', 'ODOR'
  ];

  const isOccurrenceType = (val: any): boolean => {
    if (!val) return false;
    const upper = String(val).toUpperCase();
    return OCCURRENCE_KEYWORDS.some((kw) => upper.includes(kw));
  };

  // Check if string looks like a Status
  const STATUS_KEYWORDS = ['LIBERADO', 'PARCIAL', 'BLOQUEADO', 'ANALISE', 'ANÁLISE', 'DESCARTE', 'CONCLUIDO', 'CONCLUÍDO'];
  const isStatusValue = (val: any): boolean => {
    if (!val) return false;
    const upper = String(val).toUpperCase();
    return STATUS_KEYWORDS.some((kw) => upper.includes(kw));
  };

  /**
   * Universal Smart Parser: Takes raw 2D array of rows (either from Excel or Textarea paste)
   * and maps them with high precision to BlitzRecord schema.
   */
  const parseRowsSmart = (rawGrid: any[][]): BlitzRecord[] => {
    if (!rawGrid || rawGrid.length === 0) return [];

    // Filter out completely blank lines
    const validRows = rawGrid.filter(
      (r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== '')
    );

    if (validRows.length === 0) return [];

    // Step 1: Detect Header Row among the first 10 rows
    const headerKeywords = [
      'cod', 'produto', 'descricao', 'descri', 'fabrica', 'unidade', 'planta', 'filial',
      'cervejaria', 'nota', 'nf', 'danfe', 'carret', 'placa', 'frota', 'chegada', 'recebimento',
      'bloqueio', 'bloque', 'responsavel', 'origem', 'qt', 'qtd', 'volume', 'retrabalho',
      'motivo', 'supervisor', 'status', 'situacao', 'retida', 'retic', 'avaria', 'ocorrencia'
    ];

    let headerRowIdx = -1;
    let maxHeaderMatches = 0;

    const maxSearchRows = Math.min(10, validRows.length);
    for (let rIdx = 0; rIdx < maxSearchRows; rIdx++) {
      const candidateRow = validRows[rIdx];
      let matches = 0;
      candidateRow.forEach((cell) => {
        const norm = normalizeKey(String(cell));
        if (norm && headerKeywords.some((kw) => norm.includes(kw))) {
          matches++;
        }
      });
      if (matches >= 2 && matches > maxHeaderMatches) {
        maxHeaderMatches = matches;
        headerRowIdx = rIdx;
      }
    }

    const isHeaderRow = headerRowIdx !== -1;
    const headers: string[] = isHeaderRow ? validRows[headerRowIdx].map((c) => String(c || '').trim()) : [];
    const dataRows = isHeaderRow ? validRows.slice(headerRowIdx + 1) : validRows;

    if (dataRows.length === 0) return [];

    // Step 2: Intelligent Column Role Classifier based on Samples
    const numCols = Math.max(...validRows.map((r) => r.length));
    const sampleRows = dataRows.slice(0, 50);

    const colRoles: Record<number, string> = {};

    // First check if headers give exact clues
    if (isHeaderRow) {
      headers.forEach((h, colIdx) => {
        const norm = normalizeKey(h);
        if (norm.includes('codprodu') || norm.includes('cod_prod') || norm === 'codigo' || norm === 'sku' || norm === 'cod' || norm.includes('codmat')) {
          colRoles[colIdx] = 'codProduto';
        } else if (norm.includes('descri') || norm.includes('produto') || norm === 'item' || norm === 'material' || norm.includes('nome')) {
          colRoles[colIdx] = 'descricao';
        } else if (norm.includes('fabrica') || norm.includes('unidade') || norm.includes('planta') || norm.includes('filial') || norm.includes('cervejaria') || norm.includes('fab') || norm.includes('cdd') || norm.includes('site') || norm.includes('produtora')) {
          colRoles[colIdx] = 'fabrica';
        } else if (norm.includes('nota') || norm.includes('danfe') || norm === 'nf' || norm.includes('nfe') || norm.includes('doc')) {
          colRoles[colIdx] = 'nota';
        } else if (norm.includes('carret') || norm.includes('placa') || norm.includes('frota') || norm.includes('veiculo') || norm.includes('cavalo')) {
          colRoles[colIdx] = 'carreta';
        } else if (norm.includes('chegad') || norm.includes('recebimento') || (norm.includes('data') && !norm.includes('bloque'))) {
          colRoles[colIdx] = 'chegada';
        } else if (norm.includes('bloque')) {
          colRoles[colIdx] = 'bloqueio';
        } else if (norm.includes('avaria') || norm.includes('ocorrencia') || norm.includes('desvio') || norm.includes('tipo') || norm.includes('anomalia')) {
          colRoles[colIdx] = 'tipoOcorrencia';
        } else if (norm.includes('responsavel') || norm.includes('inspetor') || norm.includes('conferente') || norm.includes('analista') || norm.includes('operador')) {
          colRoles[colIdx] = 'responsavel';
        } else if (norm.includes('blitz') || norm.includes('origem') || norm.includes('processo') || norm.includes('setor')) {
          colRoles[colIdx] = 'origem';
        } else if (norm === 'qt' || norm === 'qtd' || norm.includes('qtdpuxada') || norm.includes('volume') || norm.includes('total') || norm.includes('puxada') || norm.includes('quantidade')) {
          colRoles[colIdx] = 'qtdPuxada';
        } else if (norm.includes('retrabalho') || norm.includes('motivo') || norm.includes('acao') || norm.includes('obs')) {
          colRoles[colIdx] = 'motivoRetrabalho';
        } else if (norm.includes('gilso') || norm.includes('supervisor') || norm.includes('lider') || norm.includes('gestor') || norm.includes('coordenador')) {
          colRoles[colIdx] = 'supervisor';
        } else if (norm.includes('status') || norm.includes('situacao') || norm.includes('liberad') || norm.includes('estado')) {
          colRoles[colIdx] = 'status';
        } else if (norm.includes('retic') || norm.includes('retida') || norm.includes('retenc') || norm.includes('quebra') || norm.includes('cxret')) {
          colRoles[colIdx] = 'qtdRetida';
        } else if (norm === 'id' || norm === 'item' || norm === 'seq' || norm === 'num') {
          colRoles[colIdx] = 'idIndex';
        }
      });
    }

    // Step 3: Heuristic content-based classifier for unassigned columns or headerless pastes
    const dateColIndexes: number[] = [];
    const numColIndexes: { colIdx: number; avg: number; max: number }[] = [];

    for (let c = 0; c < numCols; c++) {
      if (colRoles[c]) continue; // already identified by header

      let beverageCount = 0;
      let factoryCount = 0;
      let plateCount = 0;
      let dateCount = 0;
      let statusCount = 0;
      let occurrenceCount = 0;
      let numberCount = 0;
      let numberSum = 0;
      let numberMax = 0;

      sampleRows.forEach((row) => {
        const val = row[c];
        if (val === undefined || val === null || String(val).trim() === '') return;

        if (isBeverageDescription(val)) beverageCount++;
        if (isFactoryName(val)) factoryCount++;
        if (isPlateValue(val)) plateCount++;
        if (isDateValue(val)) dateCount++;
        if (isStatusValue(val)) statusCount++;
        if (isOccurrenceType(val)) occurrenceCount++;

        const parsed = parseNum(val);
        if (!isNaN(parsed) && String(val).trim() !== '' && typeof val !== 'boolean') {
          numberCount++;
          numberSum += parsed;
          numberMax = Math.max(numberMax, parsed);
        }
      });

      const sampleLen = sampleRows.length || 1;

      if (dateCount / sampleLen > 0.4) {
        dateColIndexes.push(c);
      } else if (plateCount / sampleLen > 0.3) {
        colRoles[c] = 'carreta';
      } else if (factoryCount / sampleLen > 0.4) {
        colRoles[c] = 'fabrica';
      } else if (beverageCount / sampleLen > 0.3) {
        colRoles[c] = 'descricao';
      } else if (statusCount / sampleLen > 0.4) {
        colRoles[c] = 'status';
      } else if (occurrenceCount / sampleLen > 0.4) {
        colRoles[c] = 'tipoOcorrencia';
      } else if (numberCount / sampleLen > 0.7) {
        numColIndexes.push({
          colIdx: c,
          avg: numberSum / (numberCount || 1),
          max: numberMax,
        });
      }
    }

    // Assign Dates (First date is chegada, Second date is bloqueio)
    if (dateColIndexes.length >= 2) {
      if (!Object.values(colRoles).includes('chegada')) colRoles[dateColIndexes[0]] = 'chegada';
      if (!Object.values(colRoles).includes('bloqueio')) colRoles[dateColIndexes[1]] = 'bloqueio';
    } else if (dateColIndexes.length === 1) {
      if (!Object.values(colRoles).includes('chegada')) colRoles[dateColIndexes[0]] = 'chegada';
    }

    // Assign Numeric Columns (NF, CodProduto, QTD Puxada, QTD Retida)
    numColIndexes.forEach(({ colIdx, avg, max }) => {
      if (colRoles[colIdx]) return;

      // NF: large number (usually 6-8 digits, e.g. 1000000-9999999)
      if (avg >= 100000 && !Object.values(colRoles).includes('nota')) {
        colRoles[colIdx] = 'nota';
      }
      // CodProduto: medium number (e.g. 500-99999)
      else if (avg >= 300 && avg < 100000 && !Object.values(colRoles).includes('codProduto')) {
        colRoles[colIdx] = 'codProduto';
      }
      // QTD Puxada: typical box count (50-2000)
      else if (avg >= 30 && !Object.values(colRoles).includes('qtdPuxada')) {
        colRoles[colIdx] = 'qtdPuxada';
      }
      // QTD Retida: typical retention count (0-30)
      else if (avg < 30 && !Object.values(colRoles).includes('qtdRetida')) {
        colRoles[colIdx] = 'qtdRetida';
      }
    });

    // Step 4: Fallback to standard 15-column positional mapping if still unmapped
    // Standard 15 columns:
    // 0: CodProduto, 1: Descricao, 2: FABRICA, 3: NOTA, 4: CARRETA, 5: Chegada, 6: Bloqueio,
    // 7: Tipo, 8: Responsavel, 9: Origem, 10: QT Puxada, 11: Motivo Retrabalho, 12: Supervisor, 13: Status, 14: QTD Retida
    const standardOrder = [
      'codProduto',
      'descricao',
      'fabrica',
      'nota',
      'carreta',
      'chegada',
      'bloqueio',
      'tipoOcorrencia',
      'responsavel',
      'origem',
      'qtdPuxada',
      'motivoRetrabalho',
      'supervisor',
      'status',
      'qtdRetida',
    ];

    // Build the final records
    return dataRows.map((row, rowIdx) => {
      const getValByRole = (role: string): any => {
        // Find which column has this role
        const colIdx = Object.keys(colRoles).find((k) => colRoles[Number(k)] === role);
        if (colIdx !== undefined) {
          const val = row[Number(colIdx)];
          if (val !== undefined && val !== null && String(val).trim() !== '') return val;
        }
        return undefined;
      };

      const getFallbackPositional = (pos: number): any => {
        if (row[pos] !== undefined && row[pos] !== null && String(row[pos]).trim() !== '') {
          return row[pos];
        }
        return undefined;
      };

      // Search for cell matching known factory or vehicle plate
      let rowFactoryCandidate = '';
      let rowPlateCandidate = '';
      row.forEach((cell) => {
        if (!rowFactoryCandidate && isFactoryName(cell)) {
          rowFactoryCandidate = String(cell).trim().toUpperCase();
        }
        if (!rowPlateCandidate && isPlateValue(cell)) {
          rowPlateCandidate = String(cell).trim().toUpperCase();
        }
      });

      // CodProduto
      const codProduto = String(
        getValByRole('codProduto') ??
        getFallbackPositional(0) ??
        `SKU-${rowIdx + 1}`
      ).trim();

      // Descricao
      const descricao = String(
        getValByRole('descricao') ??
        getFallbackPositional(1) ??
        'PRODUTO NÃO IDENTIFICADO'
      ).trim();

      // Fabrica
      const rawFab = getValByRole('fabrica') ?? (rowFactoryCandidate || undefined) ?? getFallbackPositional(2);
      const fabrica = rawFab ? String(rawFab).trim().toUpperCase() : 'AMBEV';

      // Nota
      const nota = String(
        getValByRole('nota') ??
        getFallbackPositional(3) ??
        `${1042968 + rowIdx}`
      ).trim();

      // Carreta
      const rawCarreta = getValByRole('carreta') ?? (rowPlateCandidate || undefined) ?? getFallbackPositional(4);
      const carreta = rawCarreta ? String(rawCarreta).trim().toUpperCase() : 'RLU3F59';

      // Chegada & Bloqueio dates
      const rawChegada = getValByRole('chegada') ?? getFallbackPositional(5);
      const chegada = parseDate(rawChegada, '2026-08-28');

      const rawBloqueio = getValByRole('bloqueio') ?? getFallbackPositional(6);
      const bloqueio = parseDate(rawBloqueio, chegada);

      // Tipo Ocorrencia
      const tipoOcorrencia = String(
        getValByRole('tipoOcorrencia') ??
        getFallbackPositional(7) ??
        'EMBALAGEM AVARIADA'
      ).trim().toUpperCase();

      // Responsavel
      const responsavel = String(
        getValByRole('responsavel') ??
        getFallbackPositional(8) ??
        'Gilso Rosa'
      ).trim();

      // Origem
      const origem = String(
        getValByRole('origem') ??
        getFallbackPositional(9) ??
        'BLITZ DE PUXADA'
      ).trim().toUpperCase();

      // QTD Puxada
      const rawPuxada = getValByRole('qtdPuxada') ?? getFallbackPositional(10);
      const qtdPuxada = parseNum(rawPuxada);

      // Motivo Retrabalho
      const motivoRetrabalho = String(
        getValByRole('motivoRetrabalho') ??
        getFallbackPositional(11) ??
        'REALIZAR RETRABALHO'
      ).trim();

      // Supervisor
      const supervisor = String(
        getValByRole('supervisor') ??
        getFallbackPositional(12) ??
        'GILSON'
      ).trim().toUpperCase();

      // Status
      const rawStatus = String(
        getValByRole('status') ??
        getFallbackPositional(13) ??
        'Liberado Parcial'
      );
      const status = formatStatus(rawStatus);

      // QTD Retida
      const rawRetida = getValByRole('qtdRetida') ?? getFallbackPositional(14);
      const qtdRetida = parseNum(rawRetida);

      return {
        id: `IMP-${Date.now()}-${rowIdx + 1}`,
        dataChegada: chegada,
        dataBloqueio: bloqueio,
        fabrica: fabrica || 'ITAPISSUMA',
        carreta: carreta || 'RLU3F59',
        nota: nota || `NF-${rowIdx + 1000}`,
        codigoProduto: codProduto || `SKU-${rowIdx + 1}`,
        produto: descricao || 'PRODUTO',
        qtdPuxada: qtdPuxada > 0 ? qtdPuxada : 100,
        qtdRetida: qtdRetida >= 0 ? qtdRetida : 0,
        tipoOcorrencia: tipoOcorrencia || 'EMBALAGEM AVARIADA',
        motivoRetrabalho: motivoRetrabalho || 'REALIZAR RETRABALHO',
        responsavel: responsavel || 'Gilso Rosa',
        supervisor: supervisor || 'GILSON',
        origem: origem || 'BLITZ DE PUXADA',
        status: status,
        observacao: motivoRetrabalho ? `Ação: ${motivoRetrabalho} | Resp: ${responsavel}` : '',
      };
    });
  };

  // Handle Excel/CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to 2D array grid to maintain accurate column index and auto-detect headers
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawGrid || rawGrid.length === 0) {
          throw new Error('A planilha selecionada está vazia ou ilegível.');
        }

        const mapped = parseRowsSmart(rawGrid);
        if (mapped.length === 0) {
          throw new Error('Nenhum registro válido foi encontrado na planilha.');
        }

        setParsedPreview(mapped);
      } catch (err: any) {
        setErrorMessage(
          err.message || 'Erro ao processar arquivo. Verifique se o formato é XLSX ou CSV válido.'
        );
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro de leitura do arquivo no navegador.');
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  // Handle Direct Paste from Excel / TSV / CSV
  const handleProcessPaste = () => {
    if (!pasteContent.trim()) {
      setErrorMessage('Cole os dados no campo de texto para processar.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setFileName('Dados Colados do Excel');

      // Split into lines
      const rawLines = pasteContent.trim().split(/\r?\n/);
      if (rawLines.length === 0) {
        throw new Error('Nenhum dado encontrado para processar.');
      }

      // Convert each line to array of cell values
      const rawGrid: string[][] = [];

      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;

        let delimiter = '\t';
        if (line.includes('\t')) {
          delimiter = '\t';
        } else if (line.includes(';') && (line.match(/;/g) || []).length >= 3) {
          delimiter = ';';
        } else if (line.includes(',') && (line.match(/,/g) || []).length >= 3) {
          delimiter = ',';
        } else {
          // If copied without tabs (e.g. multi spaces), split by 2 or more spaces or tab
          delimiter = '\t';
        }

        let cells = line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''));

        // If line didn't split (single string with spaces instead of tabs)
        if (cells.length === 1 && line.includes('  ')) {
          cells = line.split(/\s{2,}/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
        }

        if (cells.some((c) => c !== '')) {
          rawGrid.push(cells);
        }
      }

      if (rawGrid.length === 0) {
        throw new Error('Não foi possível reconhecer as colunas do texto colado.');
      }

      const mapped = parseRowsSmart(rawGrid);
      if (mapped.length === 0) {
        throw new Error('Não foi possível identificar registros válidos a partir do texto informado.');
      }

      setParsedPreview(mapped);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar texto colado.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Exact Standard Template matching user standard
  const handleDownloadTemplate = () => {
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
      {
        CodProduto: '20164',
        Descricao: 'SKOL LATA 473 MP',
        FABRICA: 'ITAPISSUMA',
        NOTA: '1042971',
        CARRETA: 'RLU3F59',
        'Data da chegada': '02/01/2026',
        'Data do bloqueio': '02/01/2026',
        'EMBALAGEM AVARIADA': 'EMBALAGEM AVARIADA',
        Responsável: 'Nixon Henrique',
        'BLITZ DE PUXADA': 'BLITZ DE PUXADA',
        QT: 220,
        'Motivo Retrabalho': 'Realizar Retrabalho',
        GILSON: 'GILSON',
        Status: 'LIBERADO',
        'QTD Retida': 4,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(standardTemplate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BLITZ_PUXADA');
    XLSX.writeFile(wb, 'padrao_base_blitz_puxada.xlsx');
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportData(parsedPreview, importMode);
    handleResetPreview();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-[#0b192e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Importação da Base de Dados | Padrão Blitz de Puxada
              </h3>
              <p className="text-xs text-slate-300">
                Compatível com o layout padrão de 15 colunas operacionais da Blitz
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetPreview();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Template Download Prompt */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="text-blue-950 font-bold block">
                  Planilha Modelo Oficial (Padrão Exato da Base)
                </span>
                <span className="text-blue-700 text-[11px]">
                  Baixe o modelo pré-configurado com as 15 colunas operacionais (CodProduto, Descricao, Fabrica, Nota, Carreta, Chegada, Bloqueio, etc.)
                </span>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-md transition shadow-xs cursor-pointer shrink-0 ml-2 text-xs"
            >
              Baixar .xlsx
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab('upload');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar Arquivo (Excel/CSV)
            </button>
            <button
              onClick={() => {
                setActiveTab('paste');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Colar Linhas do Excel
            </button>
            <button
              onClick={() => {
                setActiveTab('schema');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'schema'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Padrão de Colunas da Base
            </button>
          </div>

          {/* Tab 1: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <span className="font-bold text-slate-800 text-sm block">
                  {fileName ? `Arquivo selecionado: ${fileName}` : 'Clique ou arraste o arquivo Excel (.xlsx, .xls) ou .csv'}
                </span>
                <span className="text-slate-500 text-[11px] block mt-1">
                  Reconhece automaticamente as colunas da sua planilha de Blitz de Puxada
                </span>
              </label>
            </div>
          )}

          {/* Tab 2: Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">
                Copie as linhas da sua planilha (incluindo o cabeçalho) e cole abaixo:
              </label>
              <textarea
                rows={5}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="CodProduto	Descricao	FABRICA	NOTA	CARRETA	Data da chegada	Data do bloqueio	EMBALAGEM AVARIADA	Responsável	BLITZ DE PUXADA	QT	Motivo Retrabalho	GILSON	Status	QTD Retida&#10;13205	SKOL LITRINHO	ITAPISSUMA	1042968	RLU3F59	02/01/2026	02/01/2026	EMBALAGEM AVARIADA	Nixon Henrique	BLITZ DE PUXADA	90	REALIZAR RETRABALHO	GILSON	LIBERADO PARCIAL	4"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleProcessPaste}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Processar Dados Colados
                </button>
                {pasteContent && (
                  <button
                    onClick={() => setPasteContent('')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium cursor-pointer text-xs"
                  >
                    Limpar Texto
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Schema / Standard layout reference */}
          {activeTab === 'schema' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Padrão das 15 Colunas Reconhecidas pela Importação:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">1. CodProduto / CodProdu</span>
                  <span className="text-slate-500">Ex: 13205, 9068, 20164</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">2. Descrição</span>
                  <span className="text-slate-500">Ex: SKOL LITRINHO, SKOL 350ML</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">3. FABRICA</span>
                  <span className="text-slate-500">Ex: ITAPISSUMA, AGUDOS</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">4. NOTA</span>
                  <span className="text-slate-500">Ex: 1042968, 1042970</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">5. CARRET / CARRETA</span>
                  <span className="text-slate-500">Ex: RLU3F59, BRA4E21</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">6. Data da chegada</span>
                  <span className="text-slate-500">Ex: 02/01/2026 (DD/MM/AAAA)</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">7. Data do bloqueio</span>
                  <span className="text-slate-500">Ex: 02/01/2026</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">8. EMBALAGEM AVARIADA / Tipo</span>
                  <span className="text-slate-500">Ex: EMBALAGEM AVARIADA</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">9. Responsável</span>
                  <span className="text-slate-500">Ex: Nixon Henrique</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">10. BLITZ DE PUXADA / Origem</span>
                  <span className="text-slate-500">Ex: BLITZ DE PUXADA</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">11. QT / QTD Puxada</span>
                  <span className="text-slate-500">Ex: 90, 286, 220</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">12. Motivo Retrabalho / Ação</span>
                  <span className="text-slate-500">Ex: REALIZAR RETRABALHO</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">13. Supervisor / GILSON</span>
                  <span className="text-slate-500">Ex: GILSON</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">14. Status / LIBERADO PARCIAL</span>
                  <span className="text-slate-500">Ex: LIBERADO PARCIAL, LIBERADO</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block">15. QTD Retida / QTD Retic</span>
                  <span className="text-slate-500">Ex: 4, 12, 36</span>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parsedPreview.length} registros reconhecidos e prontos para importar</span>
                  {fileName && (
                    <span className="text-slate-500 text-[11px] font-normal hidden md:inline">
                      ({fileName})
                    </span>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {/* Trocar Arquivo / Limpar Seleção button */}
                  <button
                    type="button"
                    onClick={handleResetPreview}
                    title="Limpar seleção atual para escolher outro arquivo"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold cursor-pointer text-[11px] transition shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-700" />
                    <span>Trocar Arquivo / Importar Outro</span>
                  </button>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300">
                    <span className="text-slate-600 font-medium">Modo:</span>
                    <select
                      value={importMode}
                      onChange={(e: any) => setImportMode(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700 cursor-pointer text-[11px]"
                    >
                      <option value="replace">Substituir Base Completa</option>
                      <option value="append">Adicionar aos Existentes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-48 overflow-auto border border-slate-200 rounded bg-white shadow-inner">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-1.5">Cód</th>
                      <th className="p-1.5">Produto</th>
                      <th className="p-1.5">Fábrica</th>
                      <th className="p-1.5">NF</th>
                      <th className="p-1.5">Carreta</th>
                      <th className="p-1.5">Chegada</th>
                      <th className="p-1.5 text-right">QTD Puxada</th>
                      <th className="p-1.5 text-right">QTD Retida</th>
                      <th className="p-1.5">Tipo</th>
                      <th className="p-1.5">Supervisor</th>
                      <th className="p-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreview.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-1.5 font-mono text-slate-500">{r.codigoProduto}</td>
                        <td className="p-1.5 font-semibold text-slate-800 truncate max-w-[130px]" title={r.produto}>{r.produto}</td>
                        <td className="p-1.5">{r.fabrica}</td>
                        <td className="p-1.5 text-slate-600">{r.nota}</td>
                        <td className="p-1.5 text-slate-600">{r.carreta}</td>
                        <td className="p-1.5">{r.dataChegada}</td>
                        <td className="p-1.5 text-right font-medium">{r.qtdPuxada.toLocaleString('pt-BR')}</td>
                        <td className="p-1.5 text-right font-bold text-rose-600">
                          {r.qtdRetida.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-1.5 text-slate-600 truncate max-w-[100px]">{r.tipoOcorrencia}</td>
                        <td className="p-1.5 text-slate-600">{r.supervisor || 'GILSON'}</td>
                        <td className="p-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'Liberado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Bloqueado'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleResetPreview();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>

            {parsedPreview.length > 0 && (
              <button
                type="button"
                onClick={handleResetPreview}
                className="px-3 py-1.5 rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-medium cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-amber-700" />
                <span>Escolher Outro Arquivo</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={parsedPreview.length === 0}
            onClick={handleConfirmImport}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold shadow-sm transition ${
              parsedPreview.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer ring-2 ring-emerald-600/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluir Importação ({parsedPreview.length} registros)
          </button>
        </div>
      </div>
    </div>
  );
};

