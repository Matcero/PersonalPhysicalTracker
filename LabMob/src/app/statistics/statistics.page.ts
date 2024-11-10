import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { FirestoreService } from '../services/firestore.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {
  activities: any[] = [];
  selectedUser: string = 'Utente';
  chart: Chart<'pie', number[], string> | null = null; // Grafico a torta
  stepsKilometersChart: Chart<'line', number[], string> | null = null; // Gragico linee
  selectedMonth: number;
  months: string[] = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
    'Maggio', 'Giugno', 'Luglio', 'Agosto',
    'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  isLoggedIn: boolean = false;
  followedUsers: string[] = []; // Array Utenti seguiti

  constructor(
    private router: Router,
    public activityService: ActivityService,
    private firestoreService: FirestoreService
  ) {
    Chart.register(...registerables, ChartDataLabels);
    const currentDate = new Date();
    this.selectedMonth = currentDate.getMonth();
  }

  async ngOnInit() {
    await this.initializePage();
  }

  async ionViewWillEnter() {
    await this.initializePage(); // Ricarica i dati ogni volta che entri nella pagina
  }

  private async initializePage() {
    this.isLoggedIn = !!this.activityService.user; // Verifica se l'utente esiste
    if (this.isLoggedIn) {
      this.selectedUser = this.activityService.user.email; // Prendi l'email dell'utente
      await this.loadFollowedUsers(); // Carica gli utenti seguiti dell'account loggato
    } else {
      this.selectedUser = 'Utente';
    }

    await this.loadActivitiesForCurrentUser(); // Carica le attività presenti nel dispositivo
    this.createChart(); // Crea il grafico per il mese selezionato
    this.createStepsKilometersChart();
  }

  async loadActivitiesForCurrentUser() {
    if (!this.activityService._storage) {
      await this.activityService.init();
    }

    this.activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate dal dispositivo:", this.activities);
  }

  async loadFollowedUsers() {
    if (this.isLoggedIn) {
      const userId = this.activityService.user.uid;
      console.log("ID utente corrente in loadFollowedUsers:", userId);
      try {
        this.followedUsers = await this.firestoreService.getFollowedUsers(userId);
        console.log("Utenti seguiti:", this.followedUsers);
      } catch (error) {
        console.error("Errore durante il caricamento degli utenti seguiti:", error);
      }
    }
  }

  async onUserChange() {
    if (this.selectedUser) {
      console.log("Utente selezionato:", this.selectedUser);
      if (this.selectedUser === this.activityService.user.email) {
        await this.loadActivitiesForCurrentUser(); // Carica le attività dal dispositivo per l'utente loggato
      } else {
        await this.loadSelectedUserActivities(); // Carica le attività del nuovo utente selezionato da Firebase
      }
      this.createChart(); // Crea nuovamente il grafico dopo aver caricato le attività
      this.createStepsKilometersChart();
    }
  }

  async loadSelectedUserActivities() {
    try {
      // Chiama il servizio Firestore per ottenere le attività dell'utente selezionato
      this.activities = await this.firestoreService.getUserActivitiesByEmail(this.selectedUser);
      console.log("Attività dell'utente selezionato:", this.activities);
    } catch (error) {
      console.error("Errore durante il caricamento delle attività dell'utente selezionato:", error);
    }
  }

  // Crea il grafico a torta
  createChart() {
    const activityCount: { [key: string]: number } = {};

    const activitiesToUse = this.activities;

    activitiesToUse.forEach(activity => {
      const activityDate = activity.startTime instanceof Date ? activity.startTime : activity.startTime.toDate();
      console.log("Data attività:", activityDate, "Mese attività:", activityDate.getMonth());

      if (activityDate.getMonth() === this.selectedMonth) {
        activityCount[activity.type] = (activityCount[activity.type] || 0) + 1;
      }
    });

    const labels: string[] = Object.keys(activityCount);
    const data: number[] = Object.values(activityCount);
    const total: number = data.reduce((sum: number, value: number) => sum + value, 0);

    this.chart?.destroy(); // Distruggi il grafico precedente se esiste

    // Controlla se ci sono dati da visualizzare nel grafico
    if (labels.length > 0) {
      this.chart = new Chart<'pie', number[], string>('activityChart', {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
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
                const percentage = total ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                return percentage;
              },
              color: '#fff',
            },
          }
        }
      });
    } else {
      console.warn("Nessun dato disponibile per il grafico.");
      this.chart = null;
    }
  }

  // Crea il grafico a linee per passi e chilometri
 createStepsKilometersChart() {
   const stepsData: number[] = [];
   const distanceData: number[] = [];
   const labels: string[] = [];

   const activitiesToUse = this.activities.filter(activity => {
     const activityDate = activity.startTime instanceof Date ? activity.startTime : activity.startTime.toDate();
     return activityDate.getMonth() === this.selectedMonth;
   });

   const dailyData: { [key: string]: { steps: number; distance: number } } = {};
   activitiesToUse.forEach(activity => {
     const activityDate = activity.startTime instanceof Date ? activity.startTime : activity.startTime.toDate();
     const day = activityDate.toISOString().split('T')[0];

     if (!dailyData[day]) {
       dailyData[day] = { steps: 0, distance: 0 };
       labels.push(day);
     }

     dailyData[day].steps += activity.steps || 0;
     dailyData[day].distance += activity.distance || 0;
   });

   for (const day of labels) {
     stepsData.push(dailyData[day].steps);
     distanceData.push(dailyData[day].distance);
   }

   this.stepsKilometersChart?.destroy(); // Distruggi il grafico precedente se esiste

   this.stepsKilometersChart = new Chart<'line', number[], string>('stepsKilometersChart', {
     type: 'line',
     data: {
       labels: labels,
       datasets: [
         {
           label: 'Passi',
           data: stepsData,
           borderColor: '#7B1FA2',
           fill: false,
           tension: 0.1,
           yAxisID: 'y1',
         },
         {
           label: 'Distanza (km)',
           data: distanceData,
           borderColor: '#4CAF50',
           fill: false,
           tension: 0.1,
           yAxisID: 'y2',
         }
       ]
     },
     options: {
       responsive: true,
       maintainAspectRatio: false,
       plugins: {
         legend: {
           position: 'top',
         },
         title: {
           display: true,
           text: 'Passi e Distanza per il Mese Selezionato'
         },
         datalabels: {
           align: 'top',
           anchor: 'end',
           offset: 8,
           color: '#fff',
           font: {
             size: 10,
             weight: 'bold'
           },
           formatter: (value) => `${value}`,
         }
       },
       scales: {
         x: {
           title: {
             display: true,
             text: 'Data'
           },
           ticks: {
             autoSkip: false,
             maxRotation: 45,
             minRotation: 45,
           }
         },
         y1: {
           position: 'left',
           title: {
             display: true,
             text: 'Passi'
           }
         },
         y2: {
           position: 'right',
           title: {
             display: true,
             text: 'Distanza (km)'
           },
           grid: {
             drawOnChartArea: false,
           }
         }
       }
     }
   });
 }


  // Seleziona un mese
  selectMonth(monthIndex: number) {
    this.selectedMonth = monthIndex; // Aggiorna il mese selezionato
    this.createChart(); // Ricarica il grafico a torta
    this.createStepsKilometersChart(); // Ricarica il grafico a linee
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
