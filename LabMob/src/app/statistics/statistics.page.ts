import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {
  activities: any[] = [];
  chart: any;

  constructor(private router: Router, private activityService: ActivityService) {
    // Register all Chart.js components
    Chart.register(...registerables);
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
    const activityCount = this.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(activityCount);
    const data = Object.values(activityCount);

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
          }
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
