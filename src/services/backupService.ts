import { BlitzRecord } from '../types';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  source: string;
  count: number;
  records: BlitzRecord[];
}

const EMERGENCY_BACKUP_KEY = 'blitz_puxada_emergency_backup_v1';
const HISTORY_BACKUPS_KEY = 'blitz_puxada_snapshots_history_v1';
const LEGACY_STORAGE_KEYS = [
  'blitz_puxada_records_v2',
  'blitz_puxada_records',
  'blitz_records',
  'blitz_puxada_data',
  'blitz_puxada_cache',
];

/**
 * Automatically persists an emergency snapshot whenever valid records exist.
 * Keeps the last known non-empty state safe from accidental cloud/cache wipes.
 */
export function saveEmergencyBackup(records: BlitzRecord[], source = 'Auto-Save'): void {
  if (!records || records.length === 0) return;

  try {
    const snapshot: BackupSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source,
      count: records.length,
      records,
    };

    // Always update emergency latest
    localStorage.setItem(EMERGENCY_BACKUP_KEY, JSON.stringify(snapshot));

    // Maintain a rolling history of up to 5 unique snapshots
    const historyRaw = localStorage.getItem(HISTORY_BACKUPS_KEY);
    let history: BackupSnapshot[] = [];
    if (historyRaw) {
      try {
        history = JSON.parse(historyRaw);
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }
    }

    // Avoid duplicate rapid saves if count and first item id are identical
    const isDuplicate = history.some(
      (h) => h.count === snapshot.count && h.records[0]?.id === snapshot.records[0]?.id
    );

    if (!isDuplicate) {
      history = [snapshot, ...history.slice(0, 4)];
      localStorage.setItem(HISTORY_BACKUPS_KEY, JSON.stringify(history));
    }
  } catch (err) {
    console.warn('Could not save emergency backup snapshot:', err);
  }
}

/**
 * Searches all available local storage keys and snapshots to find recoverable data.
 */
export function getAvailableBackups(): BackupSnapshot[] {
  const found: BackupSnapshot[] = [];
  const seenFingerprints = new Set<string>();

  // 1. Check emergency snapshot
  try {
    const emergencyRaw = localStorage.getItem(EMERGENCY_BACKUP_KEY);
    if (emergencyRaw) {
      const parsed = JSON.parse(emergencyRaw) as BackupSnapshot;
      if (parsed && Array.isArray(parsed.records) && parsed.records.length > 0) {
        const fp = `${parsed.count}_${parsed.records[0]?.id}`;
        if (!seenFingerprints.has(fp)) {
          seenFingerprints.add(fp);
          found.push(parsed);
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Check snapshot history
  try {
    const historyRaw = localStorage.getItem(HISTORY_BACKUPS_KEY);
    if (historyRaw) {
      const history = JSON.parse(historyRaw) as BackupSnapshot[];
      if (Array.isArray(history)) {
        history.forEach((snap) => {
          if (snap && Array.isArray(snap.records) && snap.records.length > 0) {
            const fp = `${snap.count}_${snap.records[0]?.id}`;
            if (!seenFingerprints.has(fp)) {
              seenFingerprints.add(fp);
              found.push(snap);
            }
          }
        });
      }
    }
  } catch {
    // ignore
  }

  // 3. Scan legacy keys
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fp = `${parsed.length}_${parsed[0]?.id}`;
          if (!seenFingerprints.has(fp)) {
            seenFingerprints.add(fp);
            found.push({
              id: `legacy_${key}`,
              timestamp: new Date().toISOString(),
              source: `Cache Local (${key})`,
              count: parsed.length,
              records: parsed,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  });

  return found;
}

/**
 * Exports current records as a downloadable JSON backup file.
 */
export function exportBackupJson(records: BlitzRecord[]): void {
  const dataStr = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      appName: 'Blitz de Puxada',
      count: records.length,
      records,
    },
    null,
    2
  );
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_blitz_puxada_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a JSON backup file.
 */
export function importBackupJson(file: File): Promise<BlitzRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          resolve(parsed);
        } else if (parsed && Array.isArray(parsed.records)) {
          resolve(parsed.records);
        } else {
          reject(new Error('Formato de backup inválido. Não foram encontrados registros válidos.'));
        }
      } catch (err) {
        reject(new Error('Erro ao ler arquivo JSON: ' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Falha na leitura do arquivo.'));
    reader.readAsText(file);
  });
}
