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

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  ngOnInit() {}

  // Funzione per effettuare il login con Google
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await this.afAuth.signInWithPopup(provider);
      console.log('Login riuscito:', result.user);
      // Dopo il login, puoi navigare ad una pagina protetta, per esempio la home
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Errore durante il login:', error);
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
