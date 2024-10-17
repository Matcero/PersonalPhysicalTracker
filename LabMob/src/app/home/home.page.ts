/// <reference types="@types/google.maps" />
import { Component, OnInit } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  map!: GoogleMap;

  constructor() {}

  async ngOnInit() {
    this.createMap();
  }

  async createMap() {
    const mapElement = document.getElementById('map');

    if (mapElement) {
      this.map = await GoogleMap.create({
        id: 'my-map', // Identificatore univoco della mappa
        element: mapElement, // Elemento HTML in cui verrà visualizzata la mappa
        apiKey: 'AIzaSyCBIR0J-OcK2q_QxzsrzB73PlYucVopYz0', // Inserisci qui la tua chiave API
        config: {
          center: {
            lat: 37.7749, // Coordinata di latitudine
            lng: -122.4194, // Coordinata di longitudine
          },
          zoom: 8,
        },
      });
    }
  }
}
