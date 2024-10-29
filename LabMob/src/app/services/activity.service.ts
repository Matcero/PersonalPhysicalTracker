import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Importa AngularFireAuth qui


@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  public _storage: Storage | null = null;
  private currentId = 0; // Contatore per ID incrementale
  public user: any; // Aggiungi una proprietà per l'utente corrente


  constructor(private storage: Storage, private afAuth: AngularFireAuth) { // Inietta lo storage
    this.init();
    this.afAuth.authState.subscribe(user => {
          if (user) {
            this.user = user; // Salva l'utente corrente
          } else {
            this.user = null;
          }
        });

  }

  // Inizializza lo storage e carica l'ultimo ID
    async init() {
      const storage = await this.storage.create();
      this._storage = storage;
      this.currentId = (await this._storage.get('lastActivityId')) || 0; // Carica l'ultimo ID salvato
    }

  async saveTime(time: string) {
    if (this._storage) {
      // Ottiene l'elenco esistente degli orari salvati oppure crea un array vuoto
      let savedTimes = (await this._storage.get('savedTimes')) || [];
      savedTimes.push(time);

      // Salva l'elenco aggiornato nella memoria
      await this._storage.set('savedTimes', savedTimes);

      // Logga l'elenco completo degli orari salvati
      console.log('Orari salvati:', savedTimes);
    }
  }


  async getSavedTimes(): Promise<string[]> {
    if (this._storage) {
      // Ottiene l'elenco esistente degli orari salvati
      const savedTimes = await this._storage.get('savedTimes') || [];

      // Logga l'elenco degli orari salvati
      console.log('Orari salvati:', savedTimes);

      // Restituisce l'elenco degli orari
      return savedTimes;
    }
    return [];
  }


  // Avvia un'attività
  async startActivity(activityType: string) {
    const activity = {
      type: activityType,
      startTime: new Date(),
    };
    await this._storage?.set('currentActivity', activity);
  }

  // Ferma l'attività corrente
  async stopActivity() {
    const currentActivity = await this._storage?.get('currentActivity');
    if (currentActivity) {
      const endTime = new Date();
      currentActivity.endTime = endTime;
      let activityHistory = await this._storage?.get('activityHistory') || [];
      activityHistory.push(currentActivity);
      await this._storage?.set('activityHistory', activityHistory);
      await this._storage?.remove('currentActivity');
    }
  }

   // Salva un'attività con un ID univoco e i dati necessari
    async saveActivity(activity: any) {
        if (this._storage) {
          this.currentId++;
          activity.id = this.currentId;
          const activityHistory = (await this._storage.get('activityHistory')) || [];
          activityHistory.push(activity);

          // Salva l'attività e aggiorna l'ultimo ID
          await this._storage.set('activityHistory', activityHistory);
          await this._storage.set('lastActivityId', this.currentId);
        }
      }

      // Ottieni lo storico delle attività
      async getActivityHistory() {
        return this._storage ? await this._storage.get('activityHistory') || [] : [];
      }

    // Aggiungi il seguente metodo alla classe ActivityService
async deleteActivity(activityId: number) {
  if (this._storage) {
    // Ottieni lo storico delle attività
    let activityHistory = await this._storage.get('activityHistory') || [];
    // Filtra per eliminare solo l'attività con l'ID specifico
    activityHistory = activityHistory.filter((activity: any) => activity.id !== activityId);
    // Aggiorna lo storico
    await this._storage.set('activityHistory', activityHistory);
  }
}

async getNextId() {
    this.currentId++;
    await this._storage?.set('lastActivityId', this.currentId);
    return this.currentId;
}



}
