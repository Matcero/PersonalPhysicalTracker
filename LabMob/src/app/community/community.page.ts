// Importa i moduli necessari
import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { Router } from '@angular/router';
import { isPlatform } from '@ionic/angular';
import { Device } from '@capacitor/device'; // Importa direttamente il plugin

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
})
export class CommunityPage implements OnInit {
  user: any = null;
  loginMessage: string = 'Benvenuto nella sezione Community!';

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user;
        this.loginMessage = 'Login effettuato!';
      } else {
        this.user = null;
        this.loginMessage = 'Benvenuto nella sezione Community!';
      }
    });
  }

  // Funzione per effettuare il login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
      // Controlla se l'app è su una piattaforma Capacitor
      if (isPlatform('capacitor')) {
        // Chiama Device.getInfo() solo su dispositivi mobili
        const info = await Device.getInfo();

        if (info.platform === 'android') {
          await this.afAuth.signInWithRedirect(provider);
          const result = await this.afAuth.getRedirectResult();
          this.user = result.user;
        }
      } else {
        // Usa signInWithPopup per il web
        const result = await this.afAuth.signInWithPopup(provider);
        this.user = result.user;
      }

      console.log('Login riuscito:', this.user);
      this.router.navigate(['/home']);

    } catch (error) {
      console.error('Errore durante il login:', error);
    }
  }

  async logout() {
    try {
      await this.afAuth.signOut();
      this.user = null;
      console.log('Logout effettuato');
      this.loginMessage = 'Benvenuto nella sezione Community!';
      this.router.navigate(['/community']);
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
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
