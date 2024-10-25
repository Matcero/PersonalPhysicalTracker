import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the datalabels plugin

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {
  activities: any[] = [];
  chart: any;

  constructor(private router: Router, private activityService: ActivityService) {
    // Registrare tutti i componenti di Chart.js e il plugin datalabels
    Chart.register(...registerables, ChartDataLabels);
  }

  async ngOnInit() {
    // Non creiamo il grafico qui, ma lo faremo in ionViewWillEnter
    await this.loadActivities();
  }

  // Metodo chiamato quando la vista sta per essere visualizzata
  async ionViewWillEnter() {
    await this.loadActivities();
    this.createChart(); // Ricrea il grafico ogni volta che la vista è visualizzata
  }

  // Carica le attività dal servizio
  async loadActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init(); // Assicura che lo storage sia pronto
    }

    this.activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", this.activities);
  }

  // Crea il grafico a torta
  createChart() {
    const activityCount: { [key: string]: number } = this.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const labels: string[] = Object.keys(activityCount);
    const data: number[] = Object.values(activityCount);
    const total = data.reduce((sum: number, value: number) => sum + value, 0); // Somma totale delle attività

    // Se esiste un grafico precedente, distruggilo
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('activityChart', {
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
            formatter: (value: number, context: any) => {
              const percentage = ((value / total) * 100).toFixed(1) + '%'; // Calcola la percentuale
              return percentage; // Restituisce la percentuale come etichetta
            },
            color: '#fff', // Colore dell'etichetta
            anchor: 'end', // Posiziona l'etichetta alla fine del segmento
            align: 'end', // Allinea l'etichetta alla fine del segmento
          },
        }
      }
    });
  }

  // Funzioni di navigazione
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
