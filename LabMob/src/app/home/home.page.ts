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
          center: {
            lat: 37.7749,
            lng: -122.4194,
          },
          zoom: 8,
        },
      });
    }
  }

  // Avvia un'attività
  startActivity(activityType: string) {
    this.activityService.startActivity(activityType);
  }

  // Ferma l'attività
  stopActivity() {
    this.activityService.stopActivity();
  }

  // Funzione per andare alla home
    goToHome() {
      this.router.navigate(['/home']); // Naviga verso la home
    }

  // Add a method to navigate to the calendar
  goToCalendar() {
    this.router.navigate(['/calendar']);
  }

  goToStatistics() {
    this.router.navigate(['/statistics']);
  }

  // Metodo per navigare verso la pagina Community
  goToCommunity() {
    this.router.navigate(['/community']);
  }


}
