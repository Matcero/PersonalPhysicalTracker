/// <reference types="@types/google.maps" />
import { Component, OnInit } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { ActivityService } from '../services/activity.service'; // Importa il service
import { Router } from '@angular/router'; // Importa il Router

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

  // Avvia un'attività
  startActivity(activityType: string) {
    this.isActivityStarted = true;
    this.elapsedTime = 0; // Resetta il cronometro
    this.steps = 0; // Imposta i passi a 0 solo per "walking"
    this.showBlinkingDot = true; // Attiva il lampeggio del punto

    this.currentActivity = {
      type: activityType,
      distance: 0, // Km
      calories: 0, // Kcal
      startTime: new Date(), // Tempo di inizio
    };

    // Avvia il cronometro e alterna il lampeggio del punto
    this.intervalId = setInterval(() => {
      this.elapsedTime++;
      this.showBlinkingDot = !this.showBlinkingDot; // Cambia la visibilità del punto ogni secondo
    }, 1000);

    this.activityService.startActivity(activityType);
  }

  // Ferma l'attività
  stopActivity() {
    this.isActivityStarted = false;

    // Ferma il cronometro
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.showBlinkingDot = false; // Ferma il lampeggio del punto
    this.activityService.stopActivity();
    this.currentActivity = null;
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
