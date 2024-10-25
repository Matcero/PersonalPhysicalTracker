import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private _storage: Storage | null = null;
  private currentId = 0; // Contatore per ID incrementale

  constructor(private storage: Storage) { // Inietta lo storage
    this.init();
  }

  // Inizializza lo storage e carica l'ultimo ID
    async init() {
      const storage = await this.storage.create();
      this._storage = storage;
      this.currentId = (await this._storage.get('lastActivityId')) || 0; // Carica l'ultimo ID salvato
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
}
