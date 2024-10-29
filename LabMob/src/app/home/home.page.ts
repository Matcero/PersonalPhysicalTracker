/// <reference types="@types/google.maps" />
import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Importa ChangeDetectorRef
import { GoogleMap } from '@capacitor/google-maps';
import { ActivityService } from '../services/activity.service';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { App } from '@capacitor/app';

import { AngularFirestore } from '@angular/fire/compat/firestore';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  toggleForegroundService(event: any) {
    if (event.detail.checked) {
      // Controlla se il plugin è accessibile
      App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          console.log('App in foreground');
        }
      });
    } else {
      console.log("Disabilita servizio foreground");
    }
  }




  isServiceEnabled: boolean = false; // Variabile per tenere traccia dello stato della checkbox
  customTime: string = '00:00'; // Orario impostabile manualmente, inizializzato a mezzanotte
   selectedTime: string = '12:00'; // Orario di default visualizzato all'avvio
savedTimes: string[] = [];
  activityHistory: any[] = [];
  map!: GoogleMap;
  isActivityStarted: boolean = false;
  currentActivity: any = null;
  intervalId: any = null;
  elapsedTime: number = 0;
  lastAcceleration: { x: number, y: number, z: number } | null = { x: 0, y: 0, z: 0 };
  showBlinkingDot: boolean = false;
  steps: number = 0;
  distance: number = 0; // Distance in kilometers
  calories: number = 0; // Calories burned
  stepLength: number = 0.00078; // Average step length in kilometers (approx. 0.78 meters)
  weight: number = 70; // User's weight in kg (adjust this value)

  constructor(
    private activityService: ActivityService,
    private router: Router,
    private platform: Platform,
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef // Aggiungi ChangeDetectorRef al costruttore
  ) {}


  async ngOnInit() {
    this.loadActivities();
    this.savedTimes = await this.activityService.getSavedTimes();
    this.createMap();
    this.setupPlatformListeners();
    this.platform.pause.subscribe(() => this.onAppBackground());
    this.platform.resume.subscribe(() => this.onAppForeground());


    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notifica cliccata:', notification);
      if (notification.notification.id === 1) {
        this.router.navigate(['/home']);
      }
    });

    // Assicurati di avviare il servizio quando l'attività è in corso

  }

  async showSavedTimes() {
      // Recupera gli orari salvati dal servizio
      this.savedTimes = await this.activityService.getSavedTimes();
    }




  async removeTime(time: string) {
      await this.activityService.removeTime(time);
      // Aggiorna la lista degli orari salvati
      this.savedTimes = await this.activityService.getSavedTimes();
    }


  setCustomTime() {
      this.activityService.saveTime(this.customTime); // Salva l'orario impostato
    }

  setupPlatformListeners() {
      this.platform.pause.subscribe(() => this.onAppBackground());
      this.platform.resume.subscribe(() => this.onAppForeground());
    }

  async onAppBackground() {
    if (this.isActivityStarted) { // Cambiato a 'if (this.isActivityStarted)'
      console.log("App in background, non avvio foreground service.");

    } else {
      console.log("App in background, l'attività non è iniziata. Non avvio il servizio.");
    }
  }


  async onAppForeground() {
    console.log("App in primo piano, cancello la notifica persistente.");
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  async createMap() {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.map = await GoogleMap.create({
        id: 'my-map',
        element: mapElement,
        apiKey: 'AIzaSyCBIR0J-OcK2q_QxzsrzB73PlYucVopYz0',
        config: {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 8,
        },
      });
      console.log("Mappa creata.");
    }
  }

  // Funzione per controllare i permessi delle notifiche
  async checkNotificationPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  }

  // Avvia un'attività e richiede la geolocalizzazione
  async startActivity(activityType: string) {
    // Resetta i contatori e lo stato

    this.resetCounters();

    this.isActivityStarted = true;
    this.showBlinkingDot = true;

    // Ferma il servizio se l'attività inizia
     // Aggiungi questa linea

    this.currentActivity = {
      type: activityType,
      distance: 0,
      calories: 0,
      startTime: new Date(),
      startLocation: { lat: 0, lng: 0 },
    };

    console.log("Avvio attività:", activityType);

    // Verifica la piattaforma e la geolocalizzazione
    if (Capacitor.getPlatform() === 'web') {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log('Posizione attuale dal browser:', position);
            this.startTracking(activityType, position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error('Errore nella geolocalizzazione del browser:', error);
          }
        );
      } else {
        console.log('Geolocalizzazione non supportata nel browser');
      }
      return;
    }

    try {
      const notificationGranted = await this.checkNotificationPermissions();
      if (!notificationGranted) {
        console.error('Permessi per le notifiche non concessi.');
        return;
      }

      const geoPermission = await Geolocation.requestPermissions();
      if (geoPermission.location === 'granted') {
        const coordinates = await Geolocation.getCurrentPosition();
        console.log('Posizione attuale:', coordinates);
        this.startTracking(activityType, coordinates.coords.latitude, coordinates.coords.longitude);
      } else {
        console.log('Permesso di geolocalizzazione negato');
      }
    } catch (error) {
      console.error('Errore durante la richiesta dei permessi o l\'ottenimento della posizione:', error);
    }
  }

  async startTracking(activityType: string, lat: number, lng: number) {
    this.isActivityStarted = true;
    this.elapsedTime = 0;
    this.showBlinkingDot = true;

    this.currentActivity = {
      type: activityType,
      distance: 0,
      calories: 0,
      startTime: new Date(),
      startLocation: {
        lat: lat,
        lng: lng,
      },
    };

    if (activityType === 'walking') {
      this.startStepCounting();
    }



    this.intervalId = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.currentActivity.startTime.getTime()) / 1000);
      this.showBlinkingDot = !this.showBlinkingDot;
      this.updateActivityData();
    }, 20000);

    /*await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: `Attività ${activityType} in corso`,
          body: `L'attività di ${activityType} è in corso`,
          ongoing: true,
          autoCancel: false,
        },
      ],
    });*/

    console.log("Notifica persistente inviata.");
    this.activityService.startActivity(activityType);
  }

async stopActivity() {
  console.log("Fermando attività");
  this.isActivityStarted = false;

  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  this.showBlinkingDot = false;

  // Assicurati che tutti i dati siano raccolti prima di impostare `currentActivity` a null
  const activity = {
    id: await this.activityService.getNextId(),
    type: this.currentActivity?.type,
    startTime: this.currentActivity?.startTime,
    endTime: new Date(),
    distance: this.distance || 0,
    calories: this.calories || 0,
    duration: this.formatTime(this.elapsedTime),
    steps: this.steps || 0,
  };

  await this.activityService.saveActivity(activity); // Salva in un unico punto

  this.resetCounters();
  this.currentActivity = null; // Resetta l'attività corrente
  await this.loadActivities(); // Aggiorna la lista delle attività salvate

  // Riavvia il servizio ora che l'attività è finita
   // Aggiungi questa linea
}



  formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(remainingSeconds)}`;
  }

  resetCounters() {
    this.steps = 0;
    this.distance = 0;
    this.calories = 0;
    this.elapsedTime = 0;
  }

  startStepCounting() {
    let validMovementCount = 0;
    Motion.removeAllListeners();
    Motion.addListener('accel', (event: any) => {
      const acceleration = event.accelerationIncludingGravity;

      if (this.lastAcceleration) {
        const deltaX = acceleration.x - this.lastAcceleration.x;
        const deltaY = acceleration.y - this.lastAcceleration.y;
        const deltaZ = acceleration.z - this.lastAcceleration.z;
        const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        if (delta > 4.0) {
          validMovementCount++;
          if (validMovementCount >= 8) {
            this.steps += 1;
            validMovementCount = 0;
           this.distance = parseFloat((this.steps * this.stepLength).toFixed(3)); // Distanza in km a 3 decimali
           this.calories = parseFloat(this.calculateCalories(this.steps, this.weight).toFixed(3)); // Calorie a 3 decimali
            this.cdr.detectChanges(); // Forza l'aggiornamento dell'interfaccia
          }
        }
      }

      this.lastAcceleration = acceleration;
    });
  }

  stopStepCounting() {
    Motion.removeAllListeners();
  }

calculateCalories(steps: number, weight: number): number {
  const met = 3.8; // MET per camminata a ritmo moderato
  const distanceKm = steps * this.stepLength; // Distanza in chilometri
  const hours = distanceKm / 5; // Tempo approssimato basato su una velocità di camminata di 5 km/h
  const calories = met * weight * hours;
  return parseFloat(calories.toFixed(3)); // Ritorna il valore arrotondato a 3 decimali
}


  pad(value: number) {
    return value < 10 ? '0' + value : value;
  }

  updateActivityData() {
    console.log("Steps:", this.steps, "Distance:", this.distance, "Calories:", this.calories);
    this.currentActivity.distance = this.distance;
    this.currentActivity.calories = this.calories;
    this.cdr.markForCheck(); // Usa markForCheck invece di detectChanges per aggiornamenti più leggeri
  }






goToHome() {
  this.router.navigate(['/home']);
}

goToStatistics() {
  this.router.navigate(['/statistics']);
}

goToCalendar() {
  this.router.navigate(['/calendar']);
}

goToCommunity() {
  this.router.navigate(['/community']);
}

// Ricarica la cronologia attività per visualizzarla nella schermata
  async loadActivities() {
    const history = await this.activityService.getActivityHistory();
    // Qui aggiorni l'interfaccia con la cronologia attività
    console.log("Cronologia attività:", history);
  }



}
