import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {
  groupedActivities: { date: string, activities: any[] }[] = [];

  constructor(private router: Router, private activityService: ActivityService) { }

  async ngOnInit() {
    await this.loadAndGroupActivities();
  }

  // Carica le attività e raggruppale per data
  async loadAndGroupActivities() {
    const activities = await this.activityService.getActivityHistory();

    // Raggruppa le attività per data (come stringa in formato locale)
    const grouped = activities.reduce((acc: any, activity: any) => {
      const date = new Date(activity.startTime).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    // Trasforma l'oggetto raggruppato in un array per iterare facilmente
    this.groupedActivities = Object.keys(grouped).map(date => ({
      date,
      activities: grouped[date]
    }));
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToStatistics() {
    this.router.navigate(['/statistics']);
  }

  goToCalendar() {
    this.router.navigate(['/calendar']);
  }

  goToCommunity() {
    this.router.navigate(['/community']);
  }
}
