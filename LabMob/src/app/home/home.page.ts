/// <reference types="@types/google.maps" />
import { Component, OnInit } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { ActivityService } from '../services/activity.service'; // Importa il service
import { Router } from '@angular/router'; // Importa il Router
import { Geolocation } from '@capacitor/geolocation'; // Importa il plugin di geolocalizzazione
import { Capacitor } from '@capacitor/core'; // Importa Capacitor per controllare la piattaforma
import { LocalNotifications } from '@capacitor/local-notifications'; // Importa il plugin per le notifiche locali

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

  constructor(private activityService: ActivityService, private router: Router) {}

  async ngOnInit() {
    this.createMap();
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
    }
  }

  // Funzione per controllare i permessi delle notifiche
  async checkNotificationPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  }

  // Funzione per controllare i permessi delle notifiche web
  async checkWebNotificationPermissions(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('Le notifiche non sono supportate dal browser.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.error('Permessi per le notifiche web negati.');
      return false;
    }

    // Richiedi il permesso per le notifiche
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Funzione per mostrare una notifica web
  showWebNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  // Avvia un'attività e richiede la geolocalizzazione
  async startActivity(activityType: string) {
    // Controlla se la piattaforma è Web
    if (Capacitor.getPlatform() === 'web') {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log('Posizione attuale dal browser:', position);

            // Controlla i permessi per le notifiche web
            const notificationGranted = await this.checkWebNotificationPermissions();
            if (notificationGranted) {
              this.showWebNotification('Attività in corso', `L'attività di ${activityType} è in corso`);
            }

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
    // Imposta lo stato dell'attività
    this.isActivityStarted = true;
    this.elapsedTime = 0; // Resetta il cronometro
    this.steps = 0; // Imposta i passi a 0 solo per "walking"
    this.showBlinkingDot = true; // Attiva il lampeggio del punto

    // Salva i dati dell'attività corrente
    this.currentActivity = {
      type: activityType,
      distance: 0, // Km
      calories: 0, // Kcal
      startTime: new Date(), // Tempo di inizio
      startLocation: {
        lat: lat,
        lng: lng
      }
    };

    // Invia la notifica persistente
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: 'Attività in corso',
          body: `L'attività di ${activityType} è in corso`,
          ongoing: true, // Rende la notifica persistente
          smallIcon: 'res://ic_stat_name',
          iconColor: '#488AFF'
        }
      ]
    });

    // Imposta un intervallo per aggiornare il tempo trascorso e il punto lampeggiante
    this.intervalId = setInterval(() => {
      this.elapsedTime++;
      this.showBlinkingDot = !this.showBlinkingDot; // Cambia la visibilità del punto ogni secondo
    }, 1000);

    // Avvia l'attività nel service
    this.activityService.startActivity(activityType);
  }

  // Ferma l'attività
  async stopActivity() {
    this.isActivityStarted = false;

    // Ferma il cronometro
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.showBlinkingDot = false; // Ferma il lampeggio del punto
    this.activityService.stopActivity();
    this.currentActivity = null;

    // Cancella la notifica persistente
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  // Funzione per formattare il tempo trascorso in ore, minuti e secondi
  formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600); // Calcola le ore
    const minutes = Math.floor((seconds % 3600) / 60); // Calcola i minuti
    const remainingSeconds = seconds % 60; // Calcola i secondi rimanenti
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(remainingSeconds)}`;
  }

  // Funzione per aggiungere uno zero iniziale se necessario
  pad(value: number) {
    return value < 10 ? '0' + value : value;
  }

  // Funzione per andare alla home
  goToHome() {
    this.router.navigate(['/home']); // Naviga verso la home
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
