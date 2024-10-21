/// <reference types="@types/google.maps" />
import { Component, OnInit } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { ActivityService } from '../services/activity.service'; // Importa il service
import { Router } from '@angular/router'; // Importa il Router
import { Geolocation } from '@capacitor/geolocation'; // Importa il plugin di geolocalizzazione
import { Capacitor } from '@capacitor/core'; // Importa Capacitor per controllare la piattaforma
import { LocalNotifications } from '@capacitor/local-notifications'; // Importa il plugin per le notifiche locali
import { Platform } from '@ionic/angular'; // Verifica se sei su Android
import { Plugins } from '@capacitor/core';
const { App } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  map!: GoogleMap;
  isActivityStarted: boolean = false;
  currentActivity: any = null;
  intervalId: any = null; // ID per il setInterval
  elapsedTime: number = 0; // Tempo trascorso in secondi
  steps: number = 0; // Numero di passi
  showBlinkingDot: boolean = false; // Controlla la visibilità del punto lampeggiante

  constructor(private activityService: ActivityService, private router: Router, private platform: Platform) {}

  async ngOnInit() {
    this.createMap();
    this.platform.pause.subscribe(() => this.onAppBackground()); // Gestisce l'evento di background
    this.platform.resume.subscribe(() => this.onAppForeground()); // Gestisce l'evento di foreground

    // Gestisci il click sulla notifica
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
    this.steps = 0;
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

    // Avvia il conteggio del tempo e il punto lampeggiante (mantieni una sola chiamata a setInterval)
    this.intervalId = setInterval(() => {
      this.elapsedTime++;
      this.showBlinkingDot = !this.showBlinkingDot;
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
          smallIcon: 'res://ic_stat_name',
          iconColor: '#488AFF',
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

    // Cancella la notifica persistente
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(remainingSeconds)}`;
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
