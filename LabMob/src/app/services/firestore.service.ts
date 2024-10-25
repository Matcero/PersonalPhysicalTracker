import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivityService } from './activity.service'; // Assicurati di avere un ActivityService per ottenere le attività locali

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(
      private firestore: AngularFirestore,
      private afAuth: AngularFireAuth,
      private activityService: ActivityService
    ) {}

  // Esempio di funzione per aggiungere dati
  addItem(collection: string, data: any) {
    return this.firestore.collection(collection).add(data);
  }

  // Esempio di funzione per ottenere dati
  getItems(collection: string) {
    return this.firestore.collection(collection).snapshotChanges();
  }

   // Metodo per caricare le attività dell'utente attualmente loggato
    async uploadUserActivity() {
      const user = await this.afAuth.currentUser;
      if (!user) {
        console.error('Utente non autenticato');
        return;
      }

      const userId = user.uid;
      const activityHistory = await this.activityService.getActivityHistory();

      for (const activity of activityHistory) {
        const activityId = activity.id; // Assicurati che `activity` contenga un ID univoco per l'attività

        try {
          // Controlla se esiste già un'attività con lo stesso ID
          const existingActivity = await this.firestore
            .collection('users')
            .doc(userId)
            .collection('activities')
            .ref.where('id', '==', activityId)
            .get();

          if (!existingActivity.empty) {
            console.log(`Attività con ID ${activityId} già presente, upload ignorato.`);
            continue;
          }

          // Se non esiste, aggiungila
          await this.firestore
            .collection('users')
            .doc(userId)
            .collection('activities')
            .add(activity);

          console.log(`Attività con ID ${activityId} salvata per l'utente: ${userId}`);
        } catch (error) {
          console.error("Errore durante il salvataggio dell'attività:", error);
        }
      }
    }



}
