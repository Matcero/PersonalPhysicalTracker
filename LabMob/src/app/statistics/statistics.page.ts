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
    // Register all Chart.js components and the datalabels plugin
    Chart.register(...registerables, ChartDataLabels);
  }

  async ngOnInit() {
    await this.loadActivities();
    this.createChart();
  }

  // Load activities from the service
  async loadActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init(); // Ensure that storage is ready
    }

    this.activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", this.activities);
  }

  // Create the pie chart
  createChart() {
    const activityCount: { [key: string]: number } = this.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const labels: string[] = Object.keys(activityCount);
    const data: number[] = Object.values(activityCount);
    const total = data.reduce((sum: number, value: number) => sum + value, 0); // Explicitly define types

    this.chart = new Chart('activityChart', {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // Custom colors
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
            formatter: (value: number, context: any) => { // Explicitly define types
              const percentage = ((value / total) * 100).toFixed(1) + '%'; // Calculate percentage
              return percentage; // Return the percentage as label
            },
            color: '#fff', // Color of the label
            anchor: 'end', // Position the label at the end of the segment
            align: 'end', // Align the label at the end of the segment
          },
        }
      }
    });
  }

  // Navigation functions
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
