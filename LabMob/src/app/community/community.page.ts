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

      // Recupera l'elenco dei follower con le loro email
      this.firestore.collection<User>('users').doc(this.user.uid).get().subscribe(doc => {
        const data = doc.data() as User;
        if (data && data.followers) {
          // Salva l'elenco di follower
          const followerIds = data.followers;
          this.user.followers = [];

          // Recupera le email per ciascun follower
          followerIds.forEach(followerId => {
            this.firestore.collection<User>('users').doc(followerId).get().subscribe(followerDoc => {
              const followerData = followerDoc.data() as User;
              if (followerData) {
                this.user.followers.push(followerData.email); // Aggiungi l'email del follower all'elenco
              }
            });
          });
        } else {
          this.user.followers = [];
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

  async loginWithEmail() {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      this.user = userCredential.user;
      this.loginMessage = 'Login con email effettuato!';
      this.router.navigate(['/community']);
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

  // Funzione per rimuovere un follower dall'elenco
  async removeFollower(index: number) {
    try {
      const followerIdToRemove = this.user.followers[index]; // Prendi l'ID o l'email del follower da rimuovere

      // Aggiorna Firestore per rimuovere il follower
      await this.firestore.collection('users').doc(this.user.uid).update({
        followers: firebase.firestore.FieldValue.arrayRemove(followerIdToRemove)
      });

      // Rimuovi il follower localmente dopo aver aggiornato Firestore
      this.user.followers.splice(index, 1);

      console.log('Follower rimosso con successo');
    } catch (error) {
      console.error('Errore durante la rimozione del follower:', error);
    }
  }

  onOrangeButtonClick() {
    // Questa funzione attualmente non fa nulla
    console.log('Bottone arancione cliccato!');
  }


}
