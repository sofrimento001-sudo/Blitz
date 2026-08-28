import {
  BlitzRecord,
  DateEvolution,
  ExecutiveInsights,
  FactoryDistribution,
  FilterState,
  KpiSummary,
  ProductRanking,
  StatusDistribution,
  TypeDistribution,
} from '../types';
import { calculateDaysBetween, formatDateBR, formatDateShortBR, normalizeDateToIso } from './formatters';

const normalizeStr = (val: string | null | undefined): string => {
  if (!val) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export function filterRecords(
  records: BlitzRecord[],
  filters: FilterState,
  metaThreshold: number = 5.0
): BlitzRecord[] {
  // Pre-calculate daily retention rates across all base records
  const dailyRetentionMap = new Map<string, { puxada: number; retida: number }>();
  records.forEach((r) => {
    const dayIso = normalizeDateToIso(r.dataChegada || r.dataBloqueio) || 'S/D';
    const cur = dailyRetentionMap.get(dayIso) || { puxada: 0, retida: 0 };
    cur.puxada += Number(r.qtdPuxada) || 0;
    cur.retida += Number(r.qtdRetida) || 0;
    dailyRetentionMap.set(dayIso, cur);
  });

  // Normalize and sanitize start and end filter dates
  let startIso = normalizeDateToIso(filters.dataInicio);
  let endIso = normalizeDateToIso(filters.dataFim);

  // If user selected dates in reverse order, normalize bounds
  if (startIso && endIso && startIso > endIso) {
    const temp = startIso;
    startIso = endIso;
    endIso = temp;
  }

  return records.filter((rec) => {
    // Standardize record arrival date (or fallback to lock date)
    const recDate = normalizeDateToIso(rec.dataChegada || rec.dataBloqueio) || 'S/D';

    // Meta status filter (Dentro da Meta vs Fora da Meta)
    if (filters.metaStatus && filters.metaStatus !== 'all') {
      const dayTotals = dailyRetentionMap.get(recDate);
      const dayPct = dayTotals && dayTotals.puxada > 0 ? (dayTotals.retida / dayTotals.puxada) * 100 : 0;

      if (filters.metaStatus === 'outside') {
        // Fora da meta: > metaThreshold (ex: > 5%)
        if (dayPct <= metaThreshold) return false;
      } else if (filters.metaStatus === 'inside') {
        // Dentro da meta: <= metaThreshold (ex: <= 5%)
        if (dayPct > metaThreshold) return false;
      }
    }

    // Date filter (by normalized arrival date)
    if (startIso) {
      if (!recDate || recDate < startIso) {
        return false;
      }
    }
    if (endIso) {
      if (!recDate || recDate > endIso) {
        return false;
      }
    }

    // Factory filter (accent and case insensitive)
    if (filters.fabrica && filters.fabrica.length > 0) {
      const recFabNorm = normalizeStr(rec.fabrica);
      const match = filters.fabrica.some((f) => normalizeStr(f) === recFabNorm);
      if (!match) return false;
    }

    // Carreta / Truck filter (accent and case insensitive)
    if (filters.carreta && filters.carreta.length > 0) {
      const recCarNorm = normalizeStr(rec.carreta);
      const match = filters.carreta.some((c) => normalizeStr(c) === recCarNorm);
      if (!match) return false;
    }

    // Status filter (accent and case insensitive)
    if (filters.status && filters.status.length > 0) {
      const recStNorm = normalizeStr(rec.status);
      const match = filters.status.some((s) => normalizeStr(s) === recStNorm);
      if (!match) return false;
    }

    // Type filter (accent and case insensitive)
    if (filters.tipoOcorrencia && filters.tipoOcorrencia.length > 0) {
      const recTpNorm = normalizeStr(rec.tipoOcorrencia);
      const match = filters.tipoOcorrencia.some((t) => normalizeStr(t) === recTpNorm);
      if (!match) return false;
    }

    // Product filter (accent and case insensitive)
    if (filters.produto && filters.produto.length > 0) {
      const recProdNorm = normalizeStr(rec.produto);
      const match = filters.produto.some((p) => normalizeStr(p) === recProdNorm);
      if (!match) return false;
    }

    // Search term (accent and case insensitive)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = normalizeStr(filters.searchTerm);
      const match =
        normalizeStr(rec.produto).includes(term) ||
        normalizeStr(rec.codigoProduto).includes(term) ||
        normalizeStr(rec.fabrica).includes(term) ||
        normalizeStr(rec.carreta).includes(term) ||
        normalizeStr(rec.nota).includes(term) ||
        normalizeStr(rec.tipoOcorrencia).includes(term) ||
        normalizeStr(rec.responsavel).includes(term) ||
        normalizeStr(rec.status).includes(term) ||
        normalizeStr(rec.motivoRetrabalho).includes(term) ||
        normalizeStr(rec.observacao).includes(term);
      if (!match) return false;
    }

    return true;
  });
}

export function calculateKpis(records: BlitzRecord[]): KpiSummary {
  const totalOcorrencias = records.length;
  if (totalOcorrencias === 0) {
    return {
      totalOcorrencias: 0,
      totalQtdPuxada: 0,
      totalQtdRetida: 0,
      percentualRetencao: 0,
      mediaDiasAteBloqueio: 0,
    };
  }

  const totalQtdPuxada = records.reduce((acc, r) => acc + (Number(r.qtdPuxada) || 0), 0);
  const totalQtdRetida = records.reduce((acc, r) => acc + (Number(r.qtdRetida) || 0), 0);
  const percentualRetencao = totalQtdPuxada > 0 ? (totalQtdRetida / totalQtdPuxada) * 100 : 0;

  const totalDias = records.reduce((acc, r) => {
    return acc + calculateDaysBetween(r.dataChegada, r.dataBloqueio);
  }, 0);

  const mediaDiasAteBloqueio = totalDias / totalOcorrencias;

  return {
    totalOcorrencias,
    totalQtdPuxada,
    totalQtdRetida,
    percentualRetencao,
    mediaDiasAteBloqueio,
  };
}

export function getTypeDistribution(records: BlitzRecord[]): TypeDistribution[] {
  const totalOcorrencias = records.length;
  if (totalOcorrencias === 0) return [];

  const map = new Map<string, { count: number; qtdRetida: number }>();

  records.forEach((r) => {
    const key = r.tipoOcorrencia || 'OUTROS';
    const current = map.get(key) || { count: 0, qtdRetida: 0 };
    current.count += 1;
    current.qtdRetida += Number(r.qtdRetida) || 0;
    map.set(key, current);
  });

  const result: TypeDistribution[] = [];
  map.forEach((value, key) => {
    result.push({
      tipo: key,
      quantidade: value.count,
      qtdRetida: value.qtdRetida,
      percentual: (value.count / totalOcorrencias) * 100,
    });
  });

  return result.sort((a, b) => b.quantidade - a.quantidade);
}

export function getFactoryDistribution(records: BlitzRecord[]): FactoryDistribution[] {
  const totalOcorrencias = records.length;
  if (totalOcorrencias === 0) return [];

  const map = new Map<string, { ocorrencias: number; qtdPuxada: number; qtdRetida: number }>();

  records.forEach((r) => {
    const key = r.fabrica || 'Não Informada';
    const current = map.get(key) || { ocorrencias: 0, qtdPuxada: 0, qtdRetida: 0 };
    current.ocorrencias += 1;
    current.qtdPuxada += Number(r.qtdPuxada) || 0;
    current.qtdRetida += Number(r.qtdRetida) || 0;
    map.set(key, current);
  });

  const result: FactoryDistribution[] = [];
  map.forEach((val, key) => {
    result.push({
      fabrica: key,
      ocorrencias: val.ocorrencias,
      qtdPuxada: val.qtdPuxada,
      qtdRetida: val.qtdRetida,
      percentual: (val.ocorrencias / totalOcorrencias) * 100,
    });
  });

  return result.sort((a, b) => b.ocorrencias - a.ocorrencias);
}

export function getStatusDistribution(records: BlitzRecord[]): StatusDistribution[] {
  const totalOcorrencias = records.length;
  if (totalOcorrencias === 0) return [];

  const map = new Map<string, { ocorrencias: number; qtdRetida: number }>();

  records.forEach((r) => {
    const key = r.status || 'Não Informado';
    const current = map.get(key) || { ocorrencias: 0, qtdRetida: 0 };
    current.ocorrencias += 1;
    current.qtdRetida += Number(r.qtdRetida) || 0;
    map.set(key, current);
  });

  const result: StatusDistribution[] = [];
  map.forEach((val, key) => {
    result.push({
      status: key,
      ocorrencias: val.ocorrencias,
      qtdRetida: val.qtdRetida,
      percentual: (val.ocorrencias / totalOcorrencias) * 100,
    });
  });

  return result.sort((a, b) => b.ocorrencias - a.ocorrencias);
}

export function getDateEvolution(records: BlitzRecord[]): DateEvolution[] {
  if (records.length === 0) return [];

  const map = new Map<string, { qtdPuxada: number; qtdRetida: number; ocorrencias: number }>();

  records.forEach((r) => {
    const dateKey = normalizeDateToIso(r.dataChegada || r.dataBloqueio) || 'S/D';
    const current = map.get(dateKey) || { qtdPuxada: 0, qtdRetida: 0, ocorrencias: 0 };
    current.qtdPuxada += Number(r.qtdPuxada) || 0;
    current.qtdRetida += Number(r.qtdRetida) || 0;
    current.ocorrencias += 1;
    map.set(dateKey, current);
  });

  // Sort dates chronologically
  const sortedDates = Array.from(map.keys()).filter((k) => k !== 'S/D').sort();
  if (map.has('S/D')) sortedDates.push('S/D');

  return sortedDates.map((dateIso) => {
    const val = map.get(dateIso)!;
    const percentualRetida = val.qtdPuxada > 0 ? (val.qtdRetida / val.qtdPuxada) * 100 : 0;
    return {
      dataIso: dateIso,
      data: dateIso === 'S/D' ? 'S/D' : formatDateShortBR(dateIso),
      qtdPuxada: val.qtdPuxada,
      qtdRetida: val.qtdRetida,
      percentualRetida,
      ocorrencias: val.ocorrencias,
    };
  });
}

export function getTopRegisteredProducts(records: BlitzRecord[]): ProductRanking[] {
  if (records.length === 0) return [];

  const map = new Map<string, { codigo: string; produto: string; qtdPuxada: number; qtdRetida: number; ocorrencias: number }>();

  records.forEach((r) => {
    const key = r.produto || r.codigoProduto || 'Produto Não Especificado';
    const current = map.get(key) || {
      codigo: r.codigoProduto || '-',
      produto: key,
      qtdPuxada: 0,
      qtdRetida: 0,
      ocorrencias: 0,
    };
    current.qtdPuxada += Number(r.qtdPuxada) || 0;
    current.qtdRetida += Number(r.qtdRetida) || 0;
    current.ocorrencias += 1;
    map.set(key, current);
  });

  const list: ProductRanking[] = Array.from(map.values()).map((item) => ({
    ...item,
    percentualRetida: item.qtdPuxada > 0 ? (item.qtdRetida / item.qtdPuxada) * 100 : 0,
  }));

  // Sort descending by occurrences (most registered products)
  return list.sort((a, b) => b.ocorrencias - a.ocorrencias || b.qtdRetida - a.qtdRetida).slice(0, 10);
}

export function getProductRanking(records: BlitzRecord[]): ProductRanking[] {
  if (records.length === 0) return [];

  const map = new Map<string, { codigo: string; produto: string; qtdPuxada: number; qtdRetida: number; ocorrencias: number }>();

  records.forEach((r) => {
    const key = r.produto || r.codigoProduto || 'Produto Não Especificado';
    const current = map.get(key) || {
      codigo: r.codigoProduto || '-',
      produto: key,
      qtdPuxada: 0,
      qtdRetida: 0,
      ocorrencias: 0,
    };
    current.qtdPuxada += Number(r.qtdPuxada) || 0;
    current.qtdRetida += Number(r.qtdRetida) || 0;
    current.ocorrencias += 1;
    map.set(key, current);
  });

  const list: ProductRanking[] = Array.from(map.values()).map((item) => ({
    ...item,
    percentualRetida: item.qtdPuxada > 0 ? (item.qtdRetida / item.qtdPuxada) * 100 : 0,
  }));

  // Sort descending by QTD Retida
  return list.sort((a, b) => b.qtdRetida - a.qtdRetida).slice(0, 10);
}

export function generateExecutiveInsights(
  records: BlitzRecord[],
  kpis: KpiSummary,
  typeDist: TypeDistribution[],
  factoryDist: FactoryDistribution[],
  productRanking: ProductRanking[],
  dateEvolution: DateEvolution[]
): ExecutiveInsights {
  if (records.length === 0) {
    return {
      principalTipoOcorrencia: { tipo: '-', count: 0, percentual: 0 },
      fabricaMaiorOcorrencias: { fabrica: '-', count: 0, percentual: 0 },
      produtoMaiorRetencao: { produto: '-', qtdRetida: 0, percentual: 0 },
      maiorPercentualRetencao: { produto: '-', percentual: 0, qtdRetida: 0, qtdPuxada: 0 },
      diaMaiorRetencao: { data: '-', qtdRetida: 0, qtdPuxada: 0 },
      qtdTotalRetida: 0,
      percentualGeralRetencao: 0,
      mediaDiasBloqueio: 0,
      pontosDeAtencao: [
        'Base de dados zerada e pronta para novas inserções.',
        'Utilize o botão "Importar" no topo para carregar sua planilha de Blitz (.xlsx ou .csv) ou adicione ocorrências manualmente.',
      ],
    };
  }

  const principalTipo = typeDist[0]
    ? { tipo: typeDist[0].tipo, count: typeDist[0].quantidade, percentual: typeDist[0].percentual }
    : { tipo: 'Nenhum', count: 0, percentual: 0 };

  const fabricaMaior = factoryDist[0]
    ? { fabrica: factoryDist[0].fabrica, count: factoryDist[0].ocorrencias, percentual: factoryDist[0].percentual }
    : { fabrica: 'Nenhuma', count: 0, percentual: 0 };

  const produtoMaior = productRanking[0]
    ? { produto: productRanking[0].produto, qtdRetida: productRanking[0].qtdRetida, percentual: productRanking[0].percentualRetida }
    : { produto: 'Nenhum', qtdRetida: 0, percentual: 0 };

  // Find product with highest % Retida (with at least some minimum volume or highest overall)
  const productHighestPct = [...productRanking].sort((a, b) => b.percentualRetida - a.percentualRetida)[0] || {
    produto: 'Nenhum',
    percentualRetida: 0,
    qtdRetida: 0,
    qtdPuxada: 0,
  };

  // Find day with highest retained quantity
  const dayHighestRetained = [...dateEvolution].sort((a, b) => b.qtdRetida - a.qtdRetida)[0] || {
    dataIso: '',
    qtdRetida: 0,
    qtdPuxada: 0,
  };

  // Generate actionable bullet points
  const pontosDeAtencao: string[] = [];

  if (principalTipo.percentual > 30) {
    pontosDeAtencao.push(
      `Ocorrência crítica: "${principalTipo.tipo}" representa ${principalTipo.percentual.toFixed(1)}% de todos os desvios registrados.`
    );
  }

  if (fabricaMaior.percentual > 35) {
    pontosDeAtencao.push(
      `Concentração de origem: Fábrica ${fabricaMaior.fabrica} concentra ${fabricaMaior.percentual.toFixed(1)}% das ocorrências registradas na base.`
    );
  }

  if (kpis.mediaDiasAteBloqueio > 1.5) {
    pontosDeAtencao.push(
      `Lead time de contenção elevado: Média de ${kpis.mediaDiasAteBloqueio.toFixed(1)} dias até o bloqueio físico/sistêmico após a chegada.`
    );
  } else {
    pontosDeAtencao.push(
      `Tempo de reação ágil: Bloqueios realizados em média com ${kpis.mediaDiasAteBloqueio.toFixed(1)} dia(s) da chegada.`
    );
  }

  if (produtoMaior.qtdRetida > 0) {
    pontosDeAtencao.push(
      `Impacto em SKU líder: "${produtoMaior.produto}" totaliza ${produtoMaior.qtdRetida.toLocaleString('pt-BR')} unidades retidas para retrabalho.`
    );
  }

  return {
    principalTipoOcorrencia: principalTipo,
    fabricaMaiorOcorrencias: fabricaMaior,
    produtoMaiorRetencao: produtoMaior,
    maiorPercentualRetencao: {
      produto: productHighestPct.produto,
      percentual: productHighestPct.percentualRetida,
      qtdRetida: productHighestPct.qtdRetida,
      qtdPuxada: productHighestPct.qtdPuxada,
    },
    diaMaiorRetencao: {
      data: dayHighestRetained.dataIso ? formatDateBR(dayHighestRetained.dataIso) : '-',
      qtdRetida: dayHighestRetained.qtdRetida,
      qtdPuxada: dayHighestRetained.qtdPuxada,
    },
    qtdTotalRetida: kpis.totalQtdRetida,
    percentualGeralRetencao: kpis.percentualRetencao,
    mediaDiasBloqueio: kpis.mediaDiasAteBloqueio,
    pontosDeAtencao,
  };
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_SHORT_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function getMonthSummaries(records: BlitzRecord[]) {
  if (records.length === 0) return [];

  const groups = new Map<
    string,
    {
      records: BlitzRecord[];
      qtdPuxada: number;
      qtdRetida: number;
      diasBloqueioTotal: number;
      notasSet: Set<string>;
      carretasSet: Set<string>;
      tiposMap: Map<string, number>;
      fabricasMap: Map<string, number>;
      produtosRetidosMap: Map<string, number>;
      distinctDaysSet: Set<number>;
    }
  >();

  records.forEach((rec) => {
    const cleanDate = normalizeDateToIso(rec.dataChegada || rec.dataBloqueio);
    if (!cleanDate) return;
    const monthKey = cleanDate.slice(0, 7); // "YYYY-MM"
    if (!monthKey || monthKey.length < 7) return;

    let group = groups.get(monthKey);
    if (!group) {
      group = {
        records: [],
        qtdPuxada: 0,
        qtdRetida: 0,
        diasBloqueioTotal: 0,
        notasSet: new Set(),
        carretasSet: new Set(),
        tiposMap: new Map(),
        fabricasMap: new Map(),
        produtosRetidosMap: new Map(),
        distinctDaysSet: new Set(),
      };
      groups.set(monthKey, group);
    }

    group.records.push(rec);
    group.qtdPuxada += Number(rec.qtdPuxada) || 0;
    group.qtdRetida += Number(rec.qtdRetida) || 0;
    group.diasBloqueioTotal += calculateDaysBetween(rec.dataChegada, rec.dataBloqueio);

    const dayNum = parseInt(cleanDate.slice(8, 10), 10);
    if (!isNaN(dayNum) && dayNum > 0) {
      group.distinctDaysSet.add(dayNum);
    }

    if (rec.nota) group.notasSet.add(rec.nota);
    if (rec.carreta) group.carretasSet.add(rec.carreta);

    if (rec.tipoOcorrencia) {
      group.tiposMap.set(rec.tipoOcorrencia, (group.tiposMap.get(rec.tipoOcorrencia) || 0) + 1);
    }
    if (rec.fabrica) {
      group.fabricasMap.set(rec.fabrica, (group.fabricasMap.get(rec.fabrica) || 0) + 1);
    }
    if (rec.produto) {
      group.produtosRetidosMap.set(
        rec.produto,
        (group.produtosRetidosMap.get(rec.produto) || 0) + (Number(rec.qtdRetida) || 0)
      );
    }
  });

  const sortedMonthKeys = Array.from(groups.keys()).sort().reverse(); // Most recent months first

  return sortedMonthKeys.map((monthKey) => {
    const data = groups.get(monthKey)!;
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const monthIndex = month - 1;

    const monthName = `${MONTH_NAMES_PT[monthIndex] || monthStr}/${year}`;
    const shortName = `${MONTH_SHORT_PT[monthIndex] || monthStr}/${String(year).slice(-2)}`;

    // Top tipo
    let principalTipo = '-';
    let maxTipoCount = 0;
    data.tiposMap.forEach((count, tipo) => {
      if (count > maxTipoCount) {
        maxTipoCount = count;
        principalTipo = tipo;
      }
    });

    // Top fabrica
    let principalFabrica = '-';
    let maxFabricaCount = 0;
    data.fabricasMap.forEach((count, fab) => {
      if (count > maxFabricaCount) {
        maxFabricaCount = count;
        principalFabrica = fab;
      }
    });

    // Top produto retido
    let produtoMaisRetido = '-';
    let maxProdRetido = 0;
    data.produtosRetidosMap.forEach((qtd, prod) => {
      if (qtd > maxProdRetido) {
        maxProdRetido = qtd;
        produtoMaisRetido = prod;
      }
    });

    const totalOcorrencias = data.records.length;
    const percentualRetida = data.qtdPuxada > 0 ? (data.qtdRetida / data.qtdPuxada) * 100 : 0;
    const mediaDiasBloqueio = totalOcorrencias > 0 ? data.diasBloqueioTotal / totalOcorrencias : 0;

    // Trend & Projection calculation
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const daysArr = Array.from(data.distinctDaysSet).sort((a, b) => a - b);
    const daysRecorded = daysArr.length;
    const lastRecordedDay = daysArr.length > 0 ? daysArr[daysArr.length - 1] : totalDaysInMonth;
    
    // Effective days elapsed for projection: use last recorded day (or distinct days if sparse)
    const effectiveDays = Math.max(lastRecordedDay, daysRecorded, 1);
    const daysRemaining = Math.max(0, totalDaysInMonth - effectiveDays);
    const percentMonthElapsed = Math.min(100, (effectiveDays / totalDaysInMonth) * 100);
    const isMonthClosed = daysRemaining === 0 || effectiveDays >= totalDaysInMonth;

    const dailyAvgPuxada = effectiveDays > 0 ? data.qtdPuxada / effectiveDays : 0;
    const dailyAvgRetida = effectiveDays > 0 ? data.qtdRetida / effectiveDays : 0;

    const projectedPuxada = isMonthClosed
      ? data.qtdPuxada
      : Math.round(data.qtdPuxada + dailyAvgPuxada * daysRemaining);

    const projectedRetida = isMonthClosed
      ? data.qtdRetida
      : Math.round(data.qtdRetida + dailyAvgRetida * daysRemaining);

    const projectedPercentualRetida =
      projectedPuxada > 0 ? (projectedRetida / projectedPuxada) * 100 : percentualRetida;

    // Scenarios for remaining days
    const optimisticRemainingRetida = dailyAvgRetida * daysRemaining * 0.7; // 30% reduction in errors
    const optimisticPuxada = projectedPuxada;
    const optimisticPercentualRetida =
      optimisticPuxada > 0
        ? ((data.qtdRetida + optimisticRemainingRetida) / optimisticPuxada) * 100
        : percentualRetida;

    const pessimisticRemainingRetida = dailyAvgRetida * daysRemaining * 1.3; // 30% increase in errors
    const pessimisticPercentualRetida =
      projectedPuxada > 0
        ? ((data.qtdRetida + pessimisticRemainingRetida) / projectedPuxada) * 100
        : percentualRetida;

    return {
      monthKey,
      monthName,
      shortName,
      year,
      month,
      qtdPuxada: data.qtdPuxada,
      qtdRetida: data.qtdRetida,
      percentualRetida,
      totalOcorrencias,
      notasCount: data.notasSet.size,
      carretasCount: data.carretasSet.size,
      mediaDiasBloqueio,
      principalTipo,
      principalFabrica,
      produtoMaisRetido,
      projection: {
        totalDaysInMonth,
        daysRecorded,
        lastRecordedDay,
        daysRemaining,
        percentMonthElapsed,
        dailyAvgPuxada,
        dailyAvgRetida,
        projectedPuxada,
        projectedRetida,
        projectedPercentualRetida,
        isMonthClosed,
        optimisticPercentualRetida,
        pessimisticPercentualRetida,
      },
    };
  });
}
