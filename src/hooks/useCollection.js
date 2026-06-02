import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export function useCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionName) return;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [collectionName]);

  const add = async (item) => {
    const ref = await addDoc(collection(db, collectionName), { ...item, createdAt: serverTimestamp() });
    return ref.id;
  };

  const update = async (id, item) => {
    await updateDoc(doc(db, collectionName, id), { ...item, updatedAt: serverTimestamp() });
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return { data, loading, add, update, remove };
}
