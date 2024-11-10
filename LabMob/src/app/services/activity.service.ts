import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  public _storage: Storage | null = null;
  private currentId = 0;
  public user: any;


  constructor(private storage: Storage, private afAuth: AngularFireAuth) {
    this.init();
    this.afAuth.authState.subscribe(user => {
          if (user) {
            this.user = user;
          } else {
            this.user = null;
          }
        });

  }

    async init() {
      const storage = await this.storage.create();
      this._storage = storage;
      this.currentId = (await this._storage.get('lastActivityId')) || 0; // Carica l'ultimo ID salvato
    }

  async saveTime(time: string) {
    if (this._storage) {
      // Ottiene l'elenco esistente degli orari salvati
      let savedTimes = (await this._storage.get('savedTimes')) || [];
      savedTimes.push(time);

      // Salva l'elenco aggiornato nella memoria
      await this._storage.set('savedTimes', savedTimes);

      console.log('Orari salvati:', savedTimes);
    }
  }


  async getSavedTimes(): Promise<string[]> {
    if (this._storage) {
      // Ottiene l'elenco esistente degli orari salvati
      const savedTimes = await this._storage.get('savedTimes') || [];

      console.log('Orari salvati:', savedTimes);

      return savedTimes;
    }
    return [];
  }

  async removeTime(time: string) {
    if (this._storage) {
      // Ottiene l'elenco esistente degli orari salvati
      let savedTimes: string[] = await this._storage.get('savedTimes') || [];

      // Filtra per rimuovere l'orario specificato
      savedTimes = savedTimes.filter((savedTime: string) => savedTime !== time);

      // Salva l'elenco aggiornato nella memoria
      await this._storage.set('savedTimes', savedTimes);

      console.log('Orari salvati dopo la rimozione:', savedTimes);
    }
  }

  // Salva i geofence
  async saveGeofence(geofence: {lat: number, lng: number, radius: number}) {
    if (this._storage) {
      let geofences = (await this._storage.get('geofences')) || [];
      const newId = geofences.length > 0 ? geofences[geofences.length - 1].id + 1 : 1;
       geofences.push({ id: newId, ...geofence });
      await this._storage.set('geofences', geofences);
      console.log('Geofence salvato:', geofence);
    }
  }

   // Carica i geofence salvati
   async loadGeofences(): Promise<{id: number, lat: number, lng: number, radius: number}[]> {
     if (this._storage) {
       const geofences = await this._storage.get('geofences') || [];
       console.log('Geofences caricati:', geofences);
       return geofences;
     }
     return [];
   }

  async deleteGeofence(index: number) {
    if (this._storage) {
      let geofences = await this._storage.get('geofences') || [];
      if (index >= 0 && index < geofences.length) {
        geofences.splice(index, 1); // Rimuove il geofence dall'array
        await this._storage.set('geofences', geofences); // Salva l'array aggiornato
        console.log('Geofence rimosso:', index);
      }
    }
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


    async deleteActivity(activityId: number) {
      if (this._storage) {
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
