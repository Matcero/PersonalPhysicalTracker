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

    // Nuovo metodo per ottenere gli utenti seguiti dall'utente corrente
     async getFollowedUsers(userId: string): Promise<string[]> {
       try {
         const usersSnapshot = await this.firestore.collection('users', ref =>
           ref.where('followers', 'array-contains', userId) // Ricerca utenti che contengono `userId` nei loro follower
         ).get().toPromise();

         if (!usersSnapshot) {
           console.log("Nessun utente trovato con follower:", userId);
           return [];
         }

         console.log("Snapshot utenti seguiti:", usersSnapshot.docs.map(doc => doc.data())); // Controlla i documenti ricevuti

         return usersSnapshot.docs.map(doc => (doc.data() as { email: string }).email);
       } catch (error) {
         console.error("Errore durante il recupero dei follower:", error);
         return [];
       }
     }

  async getUserActivitiesByEmail(email: string): Promise<any[]> {
    try {
      // Recupera l'utente tramite l'email
      const userSnapshot = await this.firestore.collection('users', ref =>
        ref.where('email', '==', email)
      ).get().toPromise();

      // Controlla se userSnapshot è definito e se è vuoto
      if (!userSnapshot || userSnapshot.empty) {
        console.log("Nessun utente trovato con l'email:", email);
        return [];
      }

      // Prendi l'ID dell'utente trovato
      const userId = userSnapshot.docs[0].id;

      // Recupera le attività dell'utente
      const activitiesSnapshot = await this.firestore.collection('users').doc(userId).collection('activities').get().toPromise();

      // Controlla se activitiesSnapshot è definito prima di accedere ai suoi documenti
      if (!activitiesSnapshot) {
        console.log("Nessuna attività trovata per l'utente:", userId);
        return [];
      }

      const activities = activitiesSnapshot.docs.map(doc => doc.data());
      return activities;

    } catch (error) {
      console.error("Errore durante il recupero delle attività per email:", error);
      return [];
    }
  }


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
