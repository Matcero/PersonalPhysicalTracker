import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, StatusBarStyle } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.requestNotificationPermission();
    await this.requestGeolocationPermission();
    await this.requestBackgroundLocationPermission();

    // Imposta lo stile della barra di stato
    if (Capacitor.isPluginAvailable('StatusBar')) {
      StatusBar.setStyle({ style: StatusBarStyle.Dark });
    }
  }

  async requestNotificationPermission() {
    if (Capacitor.isPluginAvailable('LocalNotifications')) {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'denied') {
        console.warn('Notifications permission denied');
      }
    }
  }

  async requestGeolocationPermission() {
    if (Capacitor.isPluginAvailable('Geolocation')) {
      const permission = await Geolocation.requestPermissions();
      if (permission.location === 'denied') {
        console.warn('Location permission denied');
      }
    }
  }


  async requestBackgroundLocationPermission() {
    if (Capacitor.getPlatform() === 'android') {
      // Richiesta di permesso per la geolocalizzazione in background
      const result = await navigator.permissions.query({ name: 'background-location' as any });

      if (result.state !== 'granted') {
        console.warn('Background location permission denied');
      }
    }
  }
}
