import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { Router } from '@angular/router';
import { isPlatform } from '@ionic/angular';
import { Device } from '@capacitor/device';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app'; // Questo import serve per accedere a FieldValue

interface User {
  uid: string;
  email: string;
  followers?: string[]; // Lista di follower
}


@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
})
export class CommunityPage implements OnInit {
  showUserPage: boolean = false;
  showUserListPage: boolean = false;
  showUploadPage: boolean = false;

  userList: any[] = [];

  user: any = null;
  loginMessage: string = 'Benvenuto nella sezione Community!';

  email: string = '';
  password: string = '';

  // Inietta Firestore nel costruttore
  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore, private router: Router) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user;
        this.loginMessage = 'Login effettuato!';
        this.getUserList(); // Ottieni l'elenco degli utenti
      } else {
        this.user = null;
        this.loginMessage = 'Benvenuto nella sezione Community!';
      }
    });
  }

displayUserListPage() {
  if (this.user) {
    this.showUserListPage = true;
    this.showUserPage = false;
    this.showUploadPage = false;
  }
}


  displayUserPage() {
    if (this.user) {
      this.showUserPage = true;
      this.showUserListPage = false;
      this.showUploadPage = false;

      // Recupera l'elenco dei follower
      this.firestore.collection<User>('users').doc(this.user.uid).get().subscribe(doc => {
        const data = doc.data() as User; // Cast a User
        if (data && data.followers) {
          this.user.followers = data.followers; // Salva i follower nell'utente corrente
        } else {
          this.user.followers = []; // Nessun follower
        }
      });
    }
  }


  displayUploadPage() {
    if (this.user) {
      this.showUploadPage = true;
      this.showUserPage = false;
      this.showUserListPage = false;
    }
  }

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

  async registerWithEmail() {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      this.user = userCredential.user;

      // Aggiungi l'utente alla collezione 'users' in Firestore
      await this.firestore.collection('users').doc(this.user.uid).set({
        uid: this.user.uid,
        email: this.user.email,
        createdAt: new Date()
      });

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

      // Reset delle variabili per nascondere tutte le pagine eccetto il login
      this.showUserPage = false;
      this.showUserListPage = false;
      this.showUploadPage = false;

      // Aggiorna il messaggio di login e reindirizza alla schermata iniziale
      this.loginMessage = 'Benvenuto nella sezione Community! Esegui il login per continuare.';

      // Naviga alla pagina della community (schermata di login)
      this.router.navigate(['/community']);

      console.log('Logout effettuato');
    } catch (error) {
      if (error instanceof Error) {
        this.loginMessage = 'Errore durante il logout: ' + error.message;
      } else {
        this.loginMessage = 'Errore sconosciuto durante il logout';
      }
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

  async getUserList() {
    this.firestore.collection('users').snapshotChanges().subscribe(data => {
      this.userList = data.map(e => {
        const userData = e.payload.doc.data() as { email: string, uid: string, followers?: string[] };
        return {
          email: userData.email,
          uid: userData.uid,
          isFollowing: userData.followers?.includes(this.user.uid) || false // Verifica se l'utente corrente è un follower
        };
      }).filter(user => user.uid !== this.user?.uid);
    });
  }


  // Funzione per seguire o smettere di seguire un utente
  async toggleFollow(user: any) {
    try {
      if (!this.user) return;

      if (user.isFollowing) {
        // Rimuovi il follow
        await this.firestore.collection('users').doc(user.uid).update({
          followers: firebase.firestore.FieldValue.arrayRemove(this.user.uid)
        });
      } else {
        // Aggiungi il follow
        await this.firestore.collection('users').doc(user.uid).update({
          followers: firebase.firestore.FieldValue.arrayUnion(this.user.uid)
        });
      }

      // Aggiorna lo stato solo dopo il successo dell'operazione su Firestore
      user.isFollowing = !user.isFollowing;

    } catch (error) {
      console.error('Errore durante il toggle follow:', error);
    }
  }





}
