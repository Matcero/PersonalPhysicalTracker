import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Modifica l'importazione
import { GoogleAuthProvider } from 'firebase/auth'; // Mantieni questo
import { Router } from '@angular/router';

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
})
export class CommunityPage implements OnInit {
  user: any = null;  // Variabile per tenere traccia dell'utente loggato
  loginMessage: string = 'Benvenuto nella sezione Community!';

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  ngOnInit() {
    // Ascolta lo stato di autenticazione dell'utente
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user;  // Memorizza l'utente loggato
        this.loginMessage = 'Login effettuato!';  // Aggiorna il messaggio di login
      } else {
        this.user = null;
        this.loginMessage = 'Benvenuto nella sezione Community!'; // Messaggio predefinito se non loggato
      }
    });
  }

  // Funzione per effettuare il login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await this.afAuth.signInWithPopup(provider);
      this.user = result.user;  // Memorizza l'utente
      console.log('Login riuscito:', this.user);
      this.loginMessage = 'Login effettuato!';  // Aggiorna il messaggio
      this.router.navigate(['/home']);  // Naviga alla home
    } catch (error) {
      console.error('Errore durante il login:', error);
    }
  }

  // Funzione per effettuare il logout
  async logout() {
    try {
      await this.afAuth.signOut();
      this.user = null;  // Resetta l'utente loggato
      console.log('Logout effettuato');
      this.loginMessage = 'Benvenuto nella sezione Community!'; // Aggiorna il messaggio dopo il logout
      this.router.navigate(['/community']); // Resta nella pagina Community
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
