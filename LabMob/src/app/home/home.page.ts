/// <reference types="@types/google.maps" />
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivityService } from '../services/activity.service';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Plugins } from '@capacitor/core';
import { Motion, AccelListenerEvent } from '@capacitor/motion';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';

const { App, Device } = Plugins;
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  isGeofenceListVisible: boolean = false;
  geofenceModeActive: boolean = false;
  geofenceCenter: { lat: number, lng: number } | null = null;
  geofenceRadius: number = 100;
  geofences: { lat: number, lng: number, radius: number }[] = [];
  isPeriodicNotificationEnabled: boolean = false;
  activityHistory: any[] = [];
  intervalId: any;
  isActivityStarted: boolean = false;
  currentActivity: any = {};
  elapsedTime: number = 0;
  timerInterval: any;
  showBlinkingDot: boolean = false;
  steps: number = 0;
  distance: number = 0;
  calories: number = 0;
  stepLength: number = 0.00078;
  weight: number = 70;
  lastAcceleration: { x: number, y: number, z: number } | null = { x: 0, y: 0, z: 0 };
  motionListener: any;
  positionWatchInterval: any;
  marker: any;

  constructor(
    private activityService: ActivityService,
    private router: Router,
    private platform: Platform,
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,

  ) {
    }

  async ngOnInit() {

     setInterval(() => {
       this.monitorGeofence(); // Esegui controllo GeoFence ogni 30 secondi
     }, 30000);
     this.loadMap();
     App['addListener']('appOnStart', async () => {
       await this.stopForegroundService();
       console.log("Foreground service interrotto a causa dell'evento appOnStart.");
     });

   App['addListener']('appOnStart', async () => {
          await this.loadMap();
        });

   App['addListener']('appOnStop', async () => {
          await this.monitorGeofence();
          console.log("geofence control");
        });
   App['addListener']('appOnStop', async () => {
       await this.startForegroundService();
       console.log("Foreground service avviato a causa dell'evento appOnStop.");
     });
    this.loadActivities();
    this.setupPlatformListeners();
    this.setupAccelerometer();

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notifica cliccata:', notification);
      if (notification.notification.id === 1) {
        this.router.navigate(['/home']);
      }
    });

    // Esegui aggiornamenti periodici dell'interfaccia
    setInterval(() => {
      if (this.isActivityStarted) {
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      }
    }, 1000);
  }

  setupAccelerometer() {
    Device['getInfo']().then((info: any) => {
      if (info.platform === 'android' || info.platform === 'ios') {
        this.motionListener = Motion.addListener('accel', (event: AccelListenerEvent) => {
          this.handleAcceleration(event);
        }).catch((error: any) => {
          console.error('Error adding listener for acceleration:', error);
        });
      }
    });
  }

  shouldIncrementSteps(deltaX: number, deltaY: number, deltaZ: number, threshold: number): boolean {
    // Definisce un intervallo ragionevole per la variabilità dei movimenti
    const maxVariation = threshold * 1.2;  // Fattore di tolleranza per ridurre la sensibilità
    const minVariation = threshold * 0.5;  // Fattore per ignorare movimenti troppo piccoli

    const isStepLikeMovement =
      (deltaX >= minVariation && deltaX <= maxVariation) &&
      (deltaY >= minVariation && deltaY <= maxVariation) &&
      (deltaZ >= minVariation && deltaZ <= maxVariation);

    return isStepLikeMovement;
  }


handleAcceleration(event: AccelListenerEvent) {
  if (this.isActivityStarted && (this.currentActivity.type === 'walking' || this.currentActivity.type === 'sport')) {
    const walkingThreshold = 5.0;
    const sportThreshold = 3.0;
    const threshold = this.currentActivity.type === 'walking' ? walkingThreshold : sportThreshold;

    if (this.lastAcceleration) {
      const deltaX = Math.abs(event.acceleration.x - this.lastAcceleration.x);
      const deltaY = Math.abs(event.acceleration.y - this.lastAcceleration.y);
      const deltaZ = Math.abs(event.acceleration.z - this.lastAcceleration.z);

      if (this.shouldIncrementSteps(deltaX, deltaY, deltaZ, threshold)) {
        this.steps++;
        this.distance = this.steps * this.stepLength;
        this.calories = this.calculateCalories(this.steps);

        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      }
    }

    // Aggiorna lastAcceleration solo se il movimento è superiore alla soglia
    this.lastAcceleration = {
      x: event.acceleration.x,
      y: event.acceleration.y,
      z: event.acceleration.z
    };
  }
}


  setupPlatformListeners() {
      this.platform.pause.subscribe(() => this.onAppBackground());
      this.platform.resume.subscribe(() => this.onAppForeground());
    }

    async onAppBackground() {
        if (this.isActivityStarted) {
        this.startForegroundService();
        }
      }

    async onAppForeground() {
          await this.stopForegroundService();
      console.log("App in primo piano, cancello la notifica persistente.");
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    }

 async showGeofences() {
   this.isGeofenceListVisible = !this.isGeofenceListVisible;

   if (this.isGeofenceListVisible) {
     this.geofences = await this.activityService.loadGeofences();
     console.log('Geofences caricati:', this.geofences);
   }
 }

  // Metodo per rimuovere un geofence
  async removeGeofence(index: number) {
    await this.activityService.deleteGeofence(index);
    this.geofences.splice(index, 1);
    console.log('Geofence rimosso');
    this.loadMap();
    this.isGeofenceListVisible = false;
    location.reload();
  }



  // Metodo per monitorare il geofence
  async monitorGeofence() {
    try {
      const position = await Geolocation.getCurrentPosition();
      const geofences = await this.activityService.loadGeofences(); // Carica tutti i geofence salvati
      // Controlla per ogni geofence se l'utente è dentro o fuori
      for (const geofence of geofences) {
        const distance = this.calculateDistance(
          geofence.lat,
          geofence.lng,
          position.coords.latitude,
          position.coords.longitude
        );
        // Se la distanza è inferiore al raggio del geofence, l'utente è dentro
        if (distance <= geofence.radius) {
          console.log(`L'utente è all'interno del geofence con centro a (${geofence.lat}, ${geofence.lng}).`);
          // Invia una notifica che l'utente è entrato nel geofence
          await LocalNotifications.schedule({
            notifications: [{
              id: 2,
              title: "Sei dentro ad un geofence",
              body: `Sei entrato nell'area con centro a (${geofence.lat}, ${geofence.lng}).`,
              ongoing: false,
              autoCancel: true,
            }]
          });

        } else {
          console.log(`L'utente è all'esterno del geofence con centro a (${geofence.lat}, ${geofence.lng}).`);
        }
      }

    } catch (error) {
      console.error("Errore nel recupero della posizione", error);
    }
  }

  // Funzione di utilità per calcolare la distanza tra due punti geografici
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

 activateGeofenceMode() {
   this.geofenceModeActive = true;
   console.log('Modalità Geofence attivata. Clicca sulla mappa per impostare il geofence.');
 }

 // Carica la mappa e aggiungi il geofence
   async loadMap() {
       const mapElement = document.getElementById('map') as HTMLElement;
       if (!mapElement) {
         console.error('Contenitore della mappa non trovato');
         return;
       }

       // Ottieni la posizione attuale
       const position = await Geolocation.getCurrentPosition();
       const currentLat = position.coords.latitude;
       const currentLng = position.coords.longitude;

       // Crea la mappa centrata sulla posizione attuale
       const map = await GoogleMap.create({
         id: 'my-map',
         element: mapElement,
         apiKey: 'AIzaSyCBIR0J-OcK2q_QxzsrzB73PlYucVopYz0',
         config: {
           center: { lat: currentLat, lng: currentLng },
           zoom: 15,
         }
       });

       // Aggiungi un marker per la posizione attuale
       this.marker = await map.addMarker({
         coordinate: { lat: currentLat, lng: currentLng },
         title: 'La mia posizione',
       });

       // Carica tutti i geofences salvati
       const geofences = await this.activityService.loadGeofences();

       // Aggiungi i geofences sulla mappa
       for (const geofence of geofences) {
         await map.addCircles([{
           center: { lat: geofence.lat, lng: geofence.lng },
           radius: geofence.radius,
           strokeColor: '#FF0000',
           fillColor: '#FF0000',
           fillOpacity: 0.3,
         }]);
       }
       console.log('Geofences caricati sulla mappa:', geofences);

       // Logica per aggiungere un nuovo geofence
       map.setOnMapClickListener(async (event) => {
         if (this.geofenceModeActive) {
           this.geofenceCenter = { lat: event.latitude, lng: event.longitude };
           this.geofenceRadius = 100;

           // Aggiungi un cerchio sulla mappa per il geofence appena creato
           await map.addCircles([{
             center: this.geofenceCenter,
             radius: this.geofenceRadius,
             strokeColor: '#FF0000',
             fillColor: '#FF0000',
             fillOpacity: 0.3,
          }]);

           // Salva il geofence in locale usando il servizio che si trova in ActivityService
           await this.activityService.saveGeofence({ lat: this.geofenceCenter.lat, lng: this.geofenceCenter.lng, radius: this.geofenceRadius });
           console.log('Nuovo geofence aggiunto alle coordinate:', this.geofenceCenter);
           this.geofenceModeActive = false;
         }
       });



      // Aggiorna la posizione del marker in base ai movimenti dell'utente
       this.positionWatchInterval = setInterval(async () => {
         try {
           // Ottieni la nuova posizione
           const updatedPosition = await Geolocation.getCurrentPosition();
           const newLat = updatedPosition.coords.latitude;
           const newLng = updatedPosition.coords.longitude;

           // Aggiorna la posizione della mappa e del marker
           await map.setCamera({
             coordinate: { lat: newLat, lng: newLng },
             zoom: 15,
           });
           await this.marker.setPosition({ lat: newLat, lng: newLng });

           console.log(`Posizione aggiornata: ${newLat}, ${newLng}`);
         } catch (error) {
           console.error('Errore nel recupero della posizione durante l’aggiornamento', error);
         }
       }, 20000);

       // Ferma l'intervallo quando la pagina va in background
       this.platform.pause.subscribe(() => {
         clearInterval(this.positionWatchInterval);
       });
     }

  // Avvia un'attività
  async startActivity(activityType: string) {
    await this.stopForegroundService();
    this.isPeriodicNotificationEnabled = false;
    this.isActivityStarted = true;
    this.resetCounters();

    this.showBlinkingDot = true;
    this.currentActivity = {
      type: activityType,
      distance: 0,
      calories: 0,
      startTime: new Date(),
    };
      this.startForegroundService();
      this.startTimer();
          switch (activityType) {
      case 'walking':
        this.steps = 0;
        this.startWalking();
        break;
      case 'sport':
        this.steps = 0;
        this.startSport();
        break;
      default:
        break;
    }
  await LocalNotifications.schedule({
        notifications: [{
          id: 1,
          title: `Attività ${activityType} in corso`,
          body: `L'attività di ${activityType} è in corso`,
          ongoing: true,
          autoCancel: false,
        }]
      });
  }

 startTimer() {
    this.elapsedTime = 0;
    this.timerInterval = setInterval(() => this.elapsedTime++, 1000);
  }

 stopTimer() {
    clearInterval(this.timerInterval);
  }


async startWalking() {
    this.steps = 0;
    this.lastAcceleration = { x: 0, y: 0, z: 0 };
    this.setupAccelerometer();
    console.log("Inizio camminata");
}

async startSport() {
    this.steps = 0;
    this.lastAcceleration = { x: 0, y: 0, z: 0 };
    this.setupAccelerometer();
    console.log("Inizio sport");
}

async stopActivity() {
    this.isActivityStarted = false;
    this.stopTimer();
    await this.stopForegroundService();
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
   this.showBlinkingDot = false;

      const durationInSeconds = this.elapsedTime;
      let shouldSaveActivity = true;

      // Controlla se la durata è maggiore di 2 secondi
      shouldSaveActivity &&= durationInSeconds > 2;

      // Aggiungi condizione per 'walking' e 'sport'
      if (this.currentActivity?.type === 'walking' || this.currentActivity?.type === 'sport') {
          shouldSaveActivity &&= this.steps > 2; // Aggiungi condizione sui passi
      }

    // Salva solo se le condizioni sono soddisfatte
    if (shouldSaveActivity) {
        const activity = {
            id: await this.activityService.getNextId(), // Genera un ID incrementale univoco
            type: this.currentActivity?.type,
            distance: this.distance,
            calories: this.calories,
            duration: this.formatTime(this.elapsedTime),
            steps: this.steps,
            date: this.currentActivity.startTime.toDateString(), // Giorno in cui è stata fatta l'attività
            startTime: this.currentActivity?.startTime,
            endTime: new Date(),
        };
       await this.activityService.saveActivity(activity);
         } else {
             console.log("Attività non salvata: durata insufficiente o passi insufficienti.");
         }

    this.resetCounters();
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

calculateCalories(steps: number): number {
    const met = 3.5;
    const stepLengthKm = 0.00078;
    const distanceKm = steps * stepLengthKm;
    const hours = distanceKm / 5;
  return parseFloat((met * this.weight * hours).toFixed(2));
}


  pad(value: number) {
    return value < 10 ? '0' + value : value;
  }

  // Reminder sulla staticità dell'utente
  async startForegroundService() {
      if (Capacitor.getPlatform() === 'android') {
          // Solo se l'attività non è già avviata
          if (!this.isActivityStarted) {
              this.intervalId = setInterval(async () => {
                  await LocalNotifications.schedule({
                      notifications: [
                          {
                              id: 1,
                              title: "Remainder Attività",
                              body: "Siamo statici qua? Bisogna fare un pò di attività!",
                              ongoing: true,
                          },
                      ],
                  });
              }, 20000);

               if (!this.motionListener) {
                      this.motionListener = Motion.addListener('accel', (event: AccelListenerEvent) => {
                        this.handleAcceleration(event);
                      }).catch((error: any) => {
                        console.error('Errore nel listener per accelerazione:', error);
                      });
                    }

          } else {
              console.log("L'attività è già in corso. La notifica non verrà inviata.");
          }
      }
  }

  async stopForegroundService() {
    if (Capacitor.getPlatform() === 'android') {
      // Cancella la notifica persistente
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      console.log("Notifica persistente rimossa e foreground service fermato.");
      // Interrompe il ciclo di notifiche
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  togglePeriodicNotification(event: any) {
      this.isPeriodicNotificationEnabled = event.detail.checked;
      if (this.isPeriodicNotificationEnabled) {
        // Avvia la notifica periodica
        this.startForegroundService();
      } else {
        // Ferma la notifica periodica
        this.stopForegroundService();
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

  async loadActivities() {
        const history = await this.activityService.getActivityHistory();

  }

}
