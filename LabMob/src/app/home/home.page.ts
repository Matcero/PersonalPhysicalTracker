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
import { AngularFirestore } from '@angular/fire/compat/firestore';
const { App } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

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

  // Esempio di funzione per aggiungere dati
  addItem() {
    const item = { name: 'Sample Item', created: new Date() };
    this.firestore.collection('items').add(item).then(() => {
      console.log('Item aggiunto con successo!');
    });
  }

  // Esempio di funzione per leggere dati
  getItems() {
    this.firestore.collection('items').snapshotChanges().subscribe(data => {
      data.forEach(item => {
        console.log(item.payload.doc.data());
      });
    });
  }

  async ngOnInit() {
    this.loadActivities();
    this.createMap();
    this.platform.pause.subscribe(() => this.onAppBackground());
    this.platform.resume.subscribe(() => this.onAppForeground());

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notifica cliccata:', notification);
      if (notification.notification.id === 1) {
        this.router.navigate(['/home']);
      }
    });

    // Assicurati di avviare il servizio quando l'attività è in corso
    if (this.isActivityStarted && this.currentActivity) {
      this.startForegroundService();
    }
  }

  async onAppBackground() {
    console.log("App in background, avvio foreground service.");
    if (this.isActivityStarted) {
      await this.startForegroundService();
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

    await this.startForegroundService();

    this.intervalId = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.currentActivity.startTime.getTime()) / 1000);
      this.showBlinkingDot = !this.showBlinkingDot;
      this.updateActivityData();
    }, 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: `Attività ${activityType} in corso`,
          body: `L'attività di ${activityType} è in corso`,
          ongoing: true,
          autoCancel: false,
        },
      ],
    });

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
        id: await this.activityService.getNextId(), // Genera un ID incrementale univoco
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
      this.cdr.detectChanges(); // O markForCheck()
  }

  async startForegroundService() {
    if (Capacitor.getPlatform() === 'android') {
    App['addListener']('appStateChange', (state: { isActive: boolean }) => {
        const isActive = state.isActive;
        if (!isActive) {
          LocalNotifications.schedule({
            notifications: [
              {
                id: 1,
                title: "Attività in corso",
                body: "L'attività è ancora in esecuzione in background.",
                ongoing: true,
              },
            ],
          });
        }
      });
    }
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
