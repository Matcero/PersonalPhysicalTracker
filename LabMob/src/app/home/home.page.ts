import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivityService } from '../services/activity.service';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Plugins } from '@capacitor/core';
import { Motion, AccelListenerEvent } from '@capacitor/motion';
const { App, Device } = Plugins;
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  isPeriodicNotificationEnabled: boolean = false;
  activityHistory: any[] = [];
  intervalId: any;
  isActivityStarted: boolean = false;
  currentActivity: any = {};
  elapsedTime: number = 0;
  timerInterval: any;
  showBlinkingDot: boolean = false;
  steps: number = 0;
  distance: number = 0; // Distance in kilometers
  calories: number = 0; // Calories burned
  stepLength: number = 0.00078; // Average step length in kilometers (approx. 0.78 meters)
  weight: number = 70; // User's weight in kg (adjust this value)
  lastAcceleration: { x: number, y: number, z: number } | null = { x: 0, y: 0, z: 0 };
  motionListener: any; // Aggiungi questa dichiarazione

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
     App['addListener']('appOnStart', async () => {
       await this.stopForegroundService();
       console.log("Foreground service interrotto a causa dell'evento appOnStart.");
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

    // Esegui aggiornamenti periodici dell'interfaccia ogni secondo
    setInterval(() => {
      if (this.isActivityStarted) {
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      }
    }, 1000); // Esegue ogni secondo
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

   handleAcceleration(event: AccelListenerEvent) {
       if (this.isActivityStarted && this.currentActivity.type === 'walking' || this.currentActivity.type === 'sport') {
         const threshold = 3.0; // Adjust this value based on testing

         if (this.lastAcceleration && (
             Math.abs(event.acceleration.x - this.lastAcceleration.x) > threshold ||
             Math.abs(event.acceleration.y - this.lastAcceleration.y) > threshold ||
             Math.abs(event.acceleration.z - this.lastAcceleration.z) > threshold)) {
             // Incrementa i passi e calcola calorie e distanza
                       this.steps++;
                         this.distance = this.steps * this.stepLength;
                         this.calories = this.calculateCalories(this.steps);

                          this.ngZone.run(() => {
                                this.cdr.detectChanges(); // Forza l'aggiornamento anche in background
                              });
             }
         // Update lastAcceleration
         this.lastAcceleration = { x: event.acceleration.x, y: event.acceleration.y, z: event.acceleration.z }; // Use acceleration properties
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

  // Avvia un'attività e richiede la geolocalizzazione
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

      const durationInSeconds = this.elapsedTime; // Durata già in secondi
      let shouldSaveActivity = true; // Assume che l'attività debba essere salvata

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
       await this.activityService.saveActivity(activity); // Salva in un unico punto
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
    const met = 3.5; // MET medio per la camminata
    const stepLengthKm = 0.00078; // Lunghezza media del passo in km
    const distanceKm = steps * stepLengthKm; // Calcola la distanza in km
    const hours = distanceKm / 5; // Velocità media di camminata di 5 km/h
  return parseFloat((met * this.weight * hours).toFixed(2)); // Limit to 2 decimal places
}


  pad(value: number) {
    return value < 10 ? '0' + value : value;
  }

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
              }, 20000); // Esegue ogni 20 secondi

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

// Ricarica la cronologia attività per visualizzarla nella schermata
  async loadActivities() {
        const history = await this.activityService.getActivityHistory();

  }

}
