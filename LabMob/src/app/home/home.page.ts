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
    console.log('createMap() is called'); // Log per controllare l'esecuzione della funzione
    const mapElement = document.getElementById('map');

    if (mapElement) {
      console.log('Map element found'); // Verifica se l'elemento della mappa è stato trovato
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
      console.log('Map created successfully'); // Conferma che la mappa è stata creata
    } else {
      console.error('Map element not found'); // Messaggio di errore se l'elemento non viene trovato
    }
  }

}
