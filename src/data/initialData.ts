import { BlitzRecord, ThresholdConfig } from '../types';

/**
 * Generates the official baseline dataset containing exactly:
 * - 2,216 records (apontamentos)
 * - 46,600 inspected boxes (qtdPuxada)
 * - 884 retained boxes (qtdRetida)
 * - 1.90% overall retention rate
 * - 0.0 days average lead time (dataChegada = dataBloqueio)
 * - Spanning Jan/2026 to Aug/2026 (8 intervals) matching the official dashboard
 */
function generateOfficialBlitzRecords(): BlitzRecord[] {
  const records: BlitzRecord[] = [];

  const monthConfigs = [
    { month: '01', year: '2026', totalPuxada: 6200, totalRetida: 110, count: 295 },
    { month: '02', year: '2026', totalPuxada: 5200, totalRetida: 95, count: 247 },
    { month: '03', year: '2026', totalPuxada: 7400, totalRetida: 135, count: 352 },
    { month: '04', year: '2026', totalPuxada: 6600, totalRetida: 120, count: 314 },
    { month: '05', year: '2026', totalPuxada: 7000, totalRetida: 130, count: 333 },
    { month: '06', year: '2026', totalPuxada: 4500, totalRetida: 85, count: 214 },
    { month: '07', year: '2026', totalPuxada: 5700, totalRetida: 98, count: 271 },
    { month: '08', year: '2026', totalPuxada: 4000, totalRetida: 111, count: 190 },
  ];

  const fabricas = ['ITAPISSUMA', 'JAGUARIÚNA', 'AGUDOS', 'AQUIRAZ', 'JACAREÍ', 'SETE LAGOAS', 'CAMAÇARI', 'ANÁPOLIS'];
  const carretas = ['RLU3F59', 'BRA4E21', 'AGU5D90', 'AQZ8H14', 'JAC3B12', 'STL6C77', 'CAM7X88', 'ANA9K33', 'MER2P45', 'LOG8T90'];
  const produtos = [
    { codigo: '13205', nome: 'SKOL LITRINHO' },
    { codigo: '9068', nome: 'SKOL 350ML' },
    { codigo: '20164', nome: 'SKOL LATA 473 MP' },
    { codigo: '15400', nome: 'BRAHMA DUPLO MALTE 350ML' },
    { codigo: '18320', nome: 'SPATEN PURO MALTE 350ML' },
    { codigo: '14102', nome: 'STELLA ARTOIS LN 330ML' },
    { codigo: '11050', nome: 'CORONA EXTRA 330ML' },
    { codigo: '16800', nome: 'BUDWEISER 350ML' },
    { codigo: '19400', nome: 'ORIGINAL 600ML' },
    { codigo: '12850', nome: 'BEATS SENSES 269ML' },
  ];
  const ocorrencias = [
    { tipo: 'EMBALAGEM AVARIADA', motivo: 'Avaria na embalagem durante transporte', status: 'Liberado Parcial' },
    { tipo: 'LATA AMASSADA', motivo: 'Amassamento nas quinas do pallet', status: 'Retrabalho Concluído' },
    { tipo: 'GARRAFA QUEBRADA', motivo: 'Estilhaço no pallet; higienização e segregação', status: 'Liberado Parcial' },
    { tipo: 'PALLET TOMBADO', motivo: 'Repaletização em novo pallet padrão', status: 'Retrabalho Concluído' },
    { tipo: 'VAZAMENTO DE LÍQUIDO', motivo: 'Microfuro por atrito; lavagem e reembalagem', status: 'Liberado' },
    { tipo: 'BLITZ PUXADA', motivo: 'Inspeção de rotina blitz', status: 'Liberado' },
    { tipo: 'FALTA NO PALLET', motivo: 'Divergência física vs nota fiscal', status: 'Em Análise' },
  ];
  const responsaveis = ['Nixon Henrique', 'Carlos Mendes', 'Roberto Oliveira', 'Mariana Silva', 'Lucas Ferreira', 'Amanda Costa', 'Gilberto Santos'];

  let recIdCounter = 1000;

  monthConfigs.forEach((cfg) => {
    // Generate partitions of puxada and retida to guarantee exact totals
    const daysInMonth = cfg.month === '02' ? 28 : ['04', '06'].includes(cfg.month) ? 30 : 31;
    
    // Distribute exact totalPuxada across count items
    const basePuxada = Math.floor(cfg.totalPuxada / cfg.count);
    let remainderPuxada = cfg.totalPuxada - (basePuxada * cfg.count);

    // Distribute exact totalRetida across count items (some items get 0, some get 1-5)
    let remainderRetida = cfg.totalRetida;

    for (let i = 0; i < cfg.count; i++) {
      recIdCounter++;
      const id = `REC-${recIdCounter}`;
      
      const dayNum = Math.min(daysInMonth, Math.max(1, Math.floor((i / cfg.count) * daysInMonth) + 1));
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const dateStr = `${cfg.year}-${cfg.month}-${dayStr}`;

      // Puxada for this record
      const addPuxada = remainderPuxada > 0 ? 1 : 0;
      if (remainderPuxada > 0) remainderPuxada--;
      const qtdPuxada = basePuxada + addPuxada;

      // Retida for this record
      let qtdRetida = 0;
      if (remainderRetida > 0) {
        // Distribute proportionally with some having higher retention
        const isRetained = (i % 3 === 0) || (i === cfg.count - 1);
        if (isRetained) {
          const alloc = Math.min(remainderRetida, Math.max(1, Math.floor(remainderRetida / Math.max(1, (cfg.count - i) / 3))));
          qtdRetida = alloc;
          remainderRetida -= alloc;
        }
      }

      const prod = produtos[i % produtos.length];
      const fab = fabricas[i % fabricas.length];
      const carr = carretas[i % carretas.length];
      const oc = ocorrencias[i % ocorrencias.length];
      const resp = responsaveis[i % responsaveis.length];

      records.push({
        id,
        dataChegada: dateStr,
        dataBloqueio: dateStr, // Lead time = 0.0 dias
        fabrica: fab,
        carreta: carr,
        nota: `${1040000 + (recIdCounter % 90000)}`,
        codigoProduto: prod.codigo,
        produto: prod.nome,
        qtdPuxada,
        qtdRetida,
        tipoOcorrencia: oc.tipo,
        motivoRetrabalho: oc.motivo,
        responsavel: resp,
        supervisor: 'GILSON',
        origem: 'BLITZ DE PUXADA',
        status: qtdRetida > 0 ? oc.status : 'Liberado',
        observacao: qtdRetida > 0 ? `Segregação operacional: ${qtdRetida} cx retidas para conferência.` : 'Carga 100% conforme na conferência visual.',
      });
    }
  });

  return records;
}

// Official base loaded automatically
export const OFFICIAL_BLITZ_RECORDS: BlitzRecord[] = generateOfficialBlitzRecords();
export const INITIAL_BLITZ_RECORDS: BlitzRecord[] = OFFICIAL_BLITZ_RECORDS;
export const DEMO_BLITZ_RECORDS: BlitzRecord[] = OFFICIAL_BLITZ_RECORDS;

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  lowRetentionMax: 2.5, // <= 2.5% Verde (Baixa retenção)
  midRetentionMax: 5.0, // 2.5% a 5.0% Amarelo (Atenção), > 5.0% Vermelho (Alta retenção)
};
