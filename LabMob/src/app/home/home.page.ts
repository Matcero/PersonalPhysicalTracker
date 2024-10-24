/// <reference types="@types/google.maps" />7
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
  //items: any[] = [];

  map!: GoogleMap;
  isActivityStarted: boolean = false;
  currentActivity: any = null;
  intervalId: any = null;
  elapsedTime: number = 0;
  showBlinkingDot: boolean = false;
  steps: number = 0;
  lastAcceleration: { x: number, y: number, z: number } | null = { x: 0, y: 0, z: 0 };
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
    this.createMap();
    this.platform.pause.subscribe(() => this.onAppBackground());
    this.platform.resume.subscribe(() => this.onAppForeground());

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notifica cliccata:', notification);
      if (notification.notification.id === 1) {
        this.router.navigate(['/home']);
      }
    });
  }
  // Funzione per gestire quando l'app va in background
  async onAppBackground() {
    if (this.isActivityStarted && this.currentActivity) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: 'Attività in corso',
            body: `L'attività di ${this.currentActivity.type} è in corso - Tempo: ${this.formatTime(this.elapsedTime)}`,
            ongoing: true,
            autoCancel: false,
          },
        ],
      });
      console.log("App in background: notifica programmata."); // Log per app in background
    }
  }

  // Funzione per gestire quando l'app ritorna in primo piano
  async onAppForeground() {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    console.log("App in primo piano: notifica cancellata."); // Log per app in primo piano
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
      console.log("Mappa creata."); // Log per mappa creata
    }
  }

  // Funzione per controllare i permessi delle notifiche
  async checkNotificationPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  }

  // Avvia un'attività e richiede la geolocalizzazione
  async startActivity(activityType: string) {
    this.steps = 0;
        this.distance = 0;
        this.calories = 0;
    console.log("Avvio attività:", activityType); // Log per avvio attività
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
      // Richiedi i permessi per le notifiche locali
      const notificationGranted = await this.checkNotificationPermissions();
      if (!notificationGranted) {
        console.error('Permessi per le notifiche non concessi.');
        return;
      }

      // Richiedi permesso di geolocalizzazione
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

  // Funzione per avviare il tracking dell'attività
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

     this.startStepCounting();

    // Avvia il conteggio del tempo e il punto lampeggiante (mantieni una sola chiamata a setInterval)
    this.intervalId = setInterval(() => {
        this.elapsedTime = Math.floor((Date.now() - this.currentActivity.startTime.getTime()) / 1000); // Calcola il tempo trascorso in secondi
        this.showBlinkingDot = !this.showBlinkingDot;
        // Update activity data (distance and calories) every second
        this.updateActivityData();
    }, 1000);


    // Invia la notifica persistente
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: 'Attività in corso',
          body: `L'attività di ${activityType} è in corso`,
          ongoing: true, // Impedisce la cancellazione automatica
          autoCancel: false, // Evita la cancellazione automatica al clic
          //smallIcon: 'res://ic_stat_name',
          //iconColor: '#488AFF',
        },
      ],
    });
    console.log("Notifica persistente inviata."); // Log per notifica inviata

    // Avvia l'attività nel servizio
    this.activityService.startActivity(activityType);
  }

  // Ferma l'attività
  async stopActivity() {
    console.log("Fermando attività"); // Log per fermo attività
    this.isActivityStarted = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.showBlinkingDot = false;
    this.activityService.stopActivity();
    this.currentActivity = null;

  // Stop step counting
  this.stopStepCounting();

    // Cancella la notifica persistente
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(remainingSeconds)}`;
  }
startStepCounting() {
    let validMovementCount = 0; // Contatore per movimenti validi

    Motion.addListener('accel', (event: any) => {
        const acceleration = event.accelerationIncludingGravity;

        if (this.lastAcceleration) {
            const deltaX = acceleration.x - this.lastAcceleration.x;
            const deltaY = acceleration.y - this.lastAcceleration.y;
            const deltaZ = acceleration.z - this.lastAcceleration.z;
            const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

            // Aumenta la soglia di rilevamento
            if (delta > 3.0) { // Soglia di rilevamento aumentata
                validMovementCount++;

                // Registra un passo ogni 5 movimenti validi
                if (validMovementCount >= 5) {
                    this.steps += 1; // Incremento minore per ridurre il conteggio
                    this.distance = this.steps * this.stepLength; // Aggiorna la distanza
                    validMovementCount = 0; // Resetta il contatore
                }
            }
        }

        this.lastAcceleration = acceleration;
    });
}



 stopStepCounting() {
    Motion.removeAllListeners();
  }


  // Update distance and calories every second
  updateActivityData() {
    this.calories = this.steps * 0.05 * this.weight / 70;
    this.distance = this.steps * this.stepLength; // Assicurati che la distanza sia aggiornata qui

    this.currentActivity.calories = this.calories;
    this.currentActivity.distance = this.distance;

    console.log(`Steps: ${this.steps}, Distance: ${this.distance.toFixed(2)} km, Calories: ${this.calories.toFixed(2)} kcal`);

    // Forza l'aggiornamento del template
    this.cdr.detectChanges();
  }


  pad(value: number) {
    return value < 10 ? '0' + value : value;
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToCalendar() {
    this.router.navigate(['/calendar']);
  }

  goToStatistics() {
    this.router.navigate(['/statistics']);
  }

  goToCommunity() {
    this.router.navigate(['/community']);
  }
}
