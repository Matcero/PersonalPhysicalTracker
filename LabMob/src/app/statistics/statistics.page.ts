import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { FirestoreService } from '../services/firestore.service'; // Importa il servizio Firestore
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {
  activities: any[] = [];
  selectedUser: string = 'Utente'; // Valore di default
  chart: Chart<'pie', number[], string> | null = null; // Imposta il tipo di chart
  selectedMonth: number; // Mese selezionato
  months: string[] = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
    'Maggio', 'Giugno', 'Luglio', 'Agosto',
    'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  isLoggedIn: boolean = false;
  followedUsers: string[] = []; // Aggiunto per tenere traccia degli utenti seguiti

  constructor(
    private router: Router,
    public activityService: ActivityService,
    private firestoreService: FirestoreService // Aggiungi il servizio Firestore
  ) {
    Chart.register(...registerables, ChartDataLabels);
    const currentDate = new Date();
    this.selectedMonth = currentDate.getMonth(); // Ottiene il mese corrente (0-11)
  }

  async ngOnInit() {
    await this.loadActivities();
    await this.loadFollowedUsers(); // Carica gli utenti seguiti
    this.isLoggedIn = !!this.activityService.user; // Verifica se l'utente esiste
    if (this.isLoggedIn) {
      this.selectedUser = this.activityService.user.email; // Prendi l'email dell'utente
    }
    this.createChart(); // Crea il grafico per il mese selezionato
  }

  // Metodo chiamato ogni volta che la pagina viene visualizzata
  ionViewWillEnter() {
    this.isLoggedIn = !!this.activityService.user; // Aggiorna la verifica dell'utente loggato
    if (this.isLoggedIn) {
      this.selectedUser = this.activityService.user.email; // Aggiorna l'email dell'utente loggato
    } else {
      this.selectedUser = 'Utente'; // Valore di default
    }
    this.createChart(); // Crea il grafico di nuovo

    if (this.activityService.user) {
          console.log("Utente autenticato:", this.activityService.user);
          this.isLoggedIn = true;
          this.loadFollowedUsers(); // Esegue se l'utente è autenticato
        } else {
          console.log("Utente non autenticato");
          this.isLoggedIn = false;
        }
  }

  // Carica le attività dal servizio
  async loadActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init(); // Assicura che lo storage sia pronto
    }

    this.activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", this.activities);
  }

  // Nuovo metodo per caricare gli utenti seguiti
   async loadFollowedUsers() {
      if (this.isLoggedIn) {
        const userId = this.activityService.user.uid;
        console.log("ID utente corrente in loadFollowedUsers:", userId);

        // Recupero degli utenti seguiti
        try {
          this.followedUsers = await this.firestoreService.getFollowedUsers(userId);
          console.log("Utenti seguiti:", this.followedUsers);
        } catch (error) {
          console.error("Errore durante il caricamento degli utenti seguiti:", error);
        }
      }
    }


  // Crea il grafico
  createChart() {
    const activityCount: { [key: string]: number } = {}; // Oggetto per contare le attività

    this.activities.forEach(activity => {
      const activityDate = new Date(activity.startTime);
      if (activityDate.getMonth() === this.selectedMonth) {
        activityCount[activity.type] = (activityCount[activity.type] || 0) + 1; // Incrementa il conteggio per tipo di attività
      }
    });

    const labels: string[] = Object.keys(activityCount);
    const data: number[] = Object.values(activityCount);
    const total: number = data.reduce((sum: number, value: number) => sum + value, 0); // Assicurati che sum e value siano numeri

    this.chart?.destroy(); // Distruggi il grafico precedente se esiste

    this.chart = new Chart<'pie', number[], string>('activityChart', {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // Colori personalizzati
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Statistiche delle Attività'
          },
          datalabels: {
            anchor: 'center',
            align: 'center',
            formatter: (value: number) => {
              const percentage = total ? ((value / total) * 100).toFixed(1) + '%' : '0%'; // Gestisci il caso di totale 0
              return percentage;
            },
            color: '#fff',
          },
        }
      }
    });
  }

  // Seleziona un mese
  selectMonth(monthIndex: number) {
    this.selectedMonth = monthIndex; // Aggiorna il mese selezionato
    this.createChart(); // Ricarica il grafico
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
