import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {
  activities: any[] = [];
  selectedUser: string = 'utente'; // Valore di default
  chart: Chart<'pie', number[], string> | null = null; // Imposta il tipo di chart
  selectedMonth: number; // Mese selezionato
  months: string[] = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
    'Maggio', 'Giugno', 'Luglio', 'Agosto',
    'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  constructor(private router: Router, private activityService: ActivityService) {
    Chart.register(...registerables, ChartDataLabels);

    // Imposta il mese corrente come selezionato
    const currentDate = new Date();
    this.selectedMonth = currentDate.getMonth(); // Ottiene il mese corrente (0-11)
  }

  async ngOnInit() {
    await this.loadActivities();
    this.createChart(); // Crea il grafico per il mese selezionato
  }

  // Metodo chiamato ogni volta che la pagina viene visualizzata
  ionViewWillEnter() {
    this.createChart(); // Crea il grafico di nuovo
  }

  // Carica le attività dal servizio
  async loadActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init(); // Assicura che lo storage sia pronto
    }

    this.activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", this.activities);
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
