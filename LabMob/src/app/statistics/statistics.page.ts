import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importa il plugin per i datalabels

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {
  activities: any[] = [];
  chart: Chart<'pie', number[], string> | null = null; // Definisci il tipo del grafico
  selectedMonth: number = new Date().getMonth(); // Mese selezionato, inizializzato con il mese corrente
  months = [
    { value: 0, label: 'Gennaio' },
    { value: 1, label: 'Febbraio' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Aprile' },
    { value: 4, label: 'Maggio' },
    { value: 5, label: 'Giugno' },
    { value: 6, label: 'Luglio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Settembre' },
    { value: 9, label: 'Ottobre' },
    { value: 10, label: 'Novembre' },
    { value: 11, label: 'Dicembre' },
  ];

  constructor(private router: Router, private activityService: ActivityService) {
    // Registra tutti i componenti di Chart.js e il plugin per i datalabels
    Chart.register(...registerables, ChartDataLabels);
  }

  async ngOnInit() {
    await this.loadActivities();
    this.createChart();
  }

  async loadActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init(); // Assicura che lo storage sia pronto
    }
    this.activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", this.activities);
  }

  createChart() {
    // Distruggi il grafico esistente se presente
    if (this.chart) {
      this.chart.destroy();
    }

    // Filtra le attività per mese selezionato
    const filteredActivities = this.activities.filter(activity => {
      const activityDate = new Date(activity.startTime);
      return activityDate.getMonth() === this.selectedMonth;
    });

    const activityCount = filteredActivities.reduce((acc: { [key: string]: number }, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(activityCount);
    const data: number[] = Object.values(activityCount); // Definisci data come array di numeri

    // Inizializza total come numero
    const total: number = data.reduce((sum: number, value: number) => sum + value, 0);

    // Crea un nuovo grafico
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
            formatter: (value: number) => {
              const percentage = ((value / total) * 100).toFixed(1) + '%'; // Calcola la percentuale
              return percentage; // Ritorna la percentuale come etichetta
            },
            color: '#fff', // Colore dell'etichetta
            anchor: 'end', // Posizione dell'etichetta alla fine del segmento
            align: 'end', // Allinea l'etichetta alla fine del segmento
          },
        }
      }
    });
  }

  selectMonth(month: number) {
    this.selectedMonth = month; // Aggiorna il mese selezionato
    this.createChart(); // Ricarica il grafico con il nuovo mese
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
