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
  showUserPage: boolean = false;
  showUserListPage: boolean = false; // Nuova variabile per Lista Utenti
  showUploadPage: boolean = false; // Nuova variabile per la pagina Upload


  user: any = null;
  loginMessage: string = 'Benvenuto nella sezione Community!';

  // Nuove proprietà per il login via email
  email: string = '';
  password: string = '';

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
// Funzione per mostrare la pagina dell'utente
  displayUserPage() {
    if (this.user) {
      this.showUserPage = true;
      this.showUserListPage = false;
      this.showUploadPage = false; // Nasconde le altre pagine
    }
  }

  // Funzione per mostrare la pagina della Lista Utenti
  displayUserListPage() {
    if (this.user) {
      this.showUserListPage = true;
      this.showUserPage = false;
      this.showUploadPage = false; // Nasconde le altre pagine
    }
  }

  // Funzione per mostrare la pagina Upload
  displayUploadPage() {
    if (this.user) {
      this.showUploadPage = true;
      this.showUserPage = false;
      this.showUserListPage = false; // Nasconde le altre pagine
    }
  }

  // Funzione per il login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
      if (isPlatform('capacitor')) {
        const info = await Device.getInfo();

        if (info.platform === 'android') {
          await this.afAuth.signInWithRedirect(provider);
          const result = await this.afAuth.getRedirectResult();
          this.user = result.user;
        }
      } else {
        const result = await this.afAuth.signInWithPopup(provider);
        this.user = result.user;
      }

      console.log('Login riuscito:', this.user);
      this.router.navigate(['/home']);

    } catch (error) {
      if (error instanceof Error) {
        this.loginMessage = 'Errore durante il login: ' + error.message;
      } else {
        this.loginMessage = 'Errore sconosciuto';
      }
    }
  }

  // Funzione per il login con email e password
  async loginWithEmail() {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      this.user = userCredential.user;
      this.loginMessage = 'Login con email effettuato!';
      this.router.navigate(['/home']);
    } catch (error) {
      if (error instanceof Error) {
        this.loginMessage = 'Errore durante il login con email: ' + error.message;
      } else {
        this.loginMessage = 'Errore sconosciuto durante il login';
      }
    }
  }

  // Funzione per la registrazione con email e password
  async registerWithEmail() {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      this.user = userCredential.user;
      this.loginMessage = 'Registrazione con email effettuata!';
      this.router.navigate(['/home']);
    } catch (error) {
      if (error instanceof Error) {
        this.loginMessage = 'Errore durante la registrazione: ' + error.message;
      } else {
        this.loginMessage = 'Errore sconosciuto durante la registrazione';
      }
    }
  }

  // Funzione per il logout
  async logout() {
    try {
      await this.afAuth.signOut();
      this.user = null;
      console.log('Logout effettuato');
      this.loginMessage = 'Benvenuto nella sezione Community!';
      this.router.navigate(['/community']);
    } catch (error) {
      if (error instanceof Error) {
        this.loginMessage = 'Errore durante il logout: ' + error.message;
      } else {
        this.loginMessage = 'Errore sconosciuto durante il logout';
      }
    }
  }

  // Navigazione
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
