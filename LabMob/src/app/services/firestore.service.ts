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
       return 'Utente non autenticato';
     }

     const userId = user.uid; // Usa l'UID dell'utente
     const activityHistory = await this.activityService.getActivityHistory();

     if (activityHistory.length === 0) {
       return 'Nessuna attività presente';  // Nessuna attività da caricare
     }

     let activitiesUploaded = 0;

     for (const activity of activityHistory) {
       // Controlla se l'attività esiste già
       const activityExists = await this.checkIfActivityExists(userId, activity);
       if (activityExists) {
         console.log('Attività già caricata:', activity);
         continue;  // Salta questa attività se è già stata caricata
       }

       try {
         await this.firestore
           .collection('users')
           .doc(userId) // Usa l'UID come documento
           .collection('activities')
           .add(activity);
         activitiesUploaded++;
         console.log(`Attività salvata per l'utente: ${userId}`);
       } catch (error) {
         console.error("Errore durante il salvataggio dell'attività:", error);
       }
     }

     if (activitiesUploaded > 0) {
       return `Attività caricate: ${activitiesUploaded}`;  // Ritorna il numero di attività caricate
     } else {
       return 'Attività già caricate';  // Se non ci sono nuove attività da caricare
     }
   }

   // Metodo per controllare se un'attività esiste già nel database
   private async checkIfActivityExists(userId: string, activity: any): Promise<boolean> {
     const activitiesSnapshot = await this.firestore
       .collection('users')
       .doc(userId)
       .collection('activities', ref => ref.where('id', '==', activity.id))  // Supponendo che 'id' sia l'identificatore unico dell'attività
       .get().toPromise();

     // Verifica se activitiesSnapshot è definito prima di accedere alla proprietà 'empty'
     return activitiesSnapshot ? !activitiesSnapshot.empty : false;  // Restituisce true se l'attività esiste già
   }







}
