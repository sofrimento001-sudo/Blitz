import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlitzRecord, ThresholdConfig } from '../types';

const RECORDS_COLLECTION = 'blitz_records';
const SETTINGS_COLLECTION = 'app_settings';
const THRESHOLD_DOC_ID = 'thresholds';

/**
 * Subscribe to real-time updates for Blitz Records
 */
export function subscribeBlitzRecords(
  onData: (records: BlitzRecord[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, RECORDS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const records: BlitzRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: docSnap.id,
          dataChegada: data.dataChegada || '',
          dataBloqueio: data.dataBloqueio || '',
          fabrica: data.fabrica || '',
          carreta: data.carreta || '',
          nota: data.nota || '',
          codigoProduto: data.codigoProduto || '',
          produto: data.produto || '',
          qtdPuxada: Number(data.qtdPuxada) || 0,
          qtdRetida: Number(data.qtdRetida) || 0,
          tipoOcorrencia: data.tipoOcorrencia || 'OUTROS',
          motivoRetrabalho: data.motivoRetrabalho || '',
          responsavel: data.responsavel || '',
          supervisor: data.supervisor || '',
          origem: data.origem || '',
          status: data.status || 'Bloqueado',
          observacao: data.observacao || '',
        });
      });
      onData(records);
    },
    (err) => {
      console.error('Firestore blitz_records subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a single Blitz Record in Cloud Firestore
 */
export async function saveCloudRecord(record: BlitzRecord): Promise<void> {
  const docRef = doc(db, RECORDS_COLLECTION, record.id);
  await setDoc(docRef, {
    ...record,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Delete a single Blitz Record in Cloud Firestore
 */
export async function deleteCloudRecord(recordId: string): Promise<void> {
  const docRef = doc(db, RECORDS_COLLECTION, recordId);
  await deleteDoc(docRef);
}

/**
 * Save multiple Blitz Records in batch (for xlsx import or seed)
 */
export async function saveCloudRecordsBatch(records: BlitzRecord[]): Promise<void> {
  const batchSize = 400; // Firestore batch limit is 500
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    const batch = writeBatch(db);
    
    chunk.forEach((rec) => {
      const docRef = doc(db, RECORDS_COLLECTION, rec.id);
      batch.set(docRef, {
        ...rec,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    await batch.commit();
  }
}

/**
 * Clear all Blitz Records in Cloud Firestore
 */
export async function clearAllCloudRecords(): Promise<void> {
  const colRef = collection(db, RECORDS_COLLECTION);
  const snapshot = await getDocs(colRef);
  
  const batchSize = 400;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * Subscribe to Threshold settings in Cloud Firestore
 */
export function subscribeThresholdConfig(
  onData: (config: ThresholdConfig) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, THRESHOLD_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onData({
        lowRetentionMax: typeof data.lowRetentionMax === 'number' ? data.lowRetentionMax : 2.5,
        midRetentionMax: typeof data.midRetentionMax === 'number' ? data.midRetentionMax : 5.0,
      });
    }
  });
}

/**
 * Save Threshold settings to Cloud Firestore
 */
export async function saveThresholdConfig(config: ThresholdConfig): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, THRESHOLD_DOC_ID);
  await setDoc(docRef, {
    ...config,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
