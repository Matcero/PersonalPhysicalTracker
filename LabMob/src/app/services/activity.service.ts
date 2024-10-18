import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) { // Inietta lo storage
    this.init();
  }

  // Inizializza lo storage
  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
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

  // Ottieni lo storico delle attività
  async getActivityHistory() {
    return await this._storage?.get('activityHistory') || [];
  }
}
