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
  filteredGroupedActivities: { date: string, activities: any[] }[] = [];
  selectedActivity: string = 'all';


  constructor(private router: Router, private activityService: ActivityService) { }

  async ngOnInit() {
    await this.loadAndGroupActivities();
  }

  async loadAndGroupActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init();
    }

    const activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", activities);

    // Raggruppa le attività per data
    const grouped = activities.reduce((acc: any, activity: any) => {
      const date = new Date(activity.startTime).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    this.groupedActivities = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        activities: grouped[date]
      }));
    this.filterActivities();
  }

    // Filtra le attività in base al tipo selezionato
      filterActivities() {
        if (this.selectedActivity === 'all') {
          this.filteredGroupedActivities = this.groupedActivities;
        } else {
          this.filteredGroupedActivities = this.groupedActivities.map(group => ({
            date: group.date,
            activities: group.activities.filter(activity => activity.type === this.selectedActivity)
          })).filter(group => group.activities.length > 0);
        }
      }

  // Metodo per eliminare un'attività
    async deleteActivity(activityId: number) {
      await this.activityService.deleteActivity(activityId);
      await this.loadAndGroupActivities();
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
