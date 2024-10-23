import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: AngularFirestore) { }

  // Esempio di funzione per aggiungere dati
  addItem(collection: string, data: any) {
    return this.firestore.collection(collection).add(data);
  }

  // Esempio di funzione per ottenere dati
  getItems(collection: string) {
    return this.firestore.collection(collection).snapshotChanges();
  }
}
