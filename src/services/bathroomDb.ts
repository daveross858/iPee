// Firestore CRUD for bathrooms
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Bathroom } from '../types/bathroom';

const BATHROOMS_COLLECTION = 'bathrooms';

export async function addBathroom(bathroom: Bathroom) {
  const docRef = await addDoc(collection(db, BATHROOMS_COLLECTION), bathroom);
  return docRef.id;
}

export async function getBathrooms(): Promise<Bathroom[]> {
  const snapshot = await getDocs(collection(db, BATHROOMS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bathroom));
}

export async function getBathroomById(id: string): Promise<Bathroom | null> {
  const docRef = doc(db, BATHROOMS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Bathroom;
  }
  return null;
}

export async function updateBathroom(id: string, data: Partial<Bathroom>) {
  const docRef = doc(db, BATHROOMS_COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function deleteBathroom(id: string) {
  const docRef = doc(db, BATHROOMS_COLLECTION, id);
  await deleteDoc(docRef);
}

// Example: search by name
export async function searchBathroomsByName(name: string): Promise<Bathroom[]> {
  const q = query(collection(db, BATHROOMS_COLLECTION), where('name', '>=', name), where('name', '<=', name + '\uf8ff'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bathroom));
}
