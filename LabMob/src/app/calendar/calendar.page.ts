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
  selectedActivity: string = 'all'; // Valore predefinito per mostrare tutte le attività


  constructor(private router: Router, private activityService: ActivityService) { }

  async ngOnInit() {
    await this.loadAndGroupActivities();
  }

  // Carica le attività e raggruppale per data
  async loadAndGroupActivities() {
    if (!this.activityService._storage) {
      await this.activityService.init(); // Assicura che lo storage sia pronto
    }

    const activities = await this.activityService.getActivityHistory();
    console.log("Attività caricate:", activities);

    // Raggruppa le attività per data (come stringa in formato locale)
    const grouped = activities.reduce((acc: any, activity: any) => {
      const date = new Date(activity.startTime).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    // Trasforma l'oggetto raggruppato in un array e ordina le date in ordine decrescente
    this.groupedActivities = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Ordine decrescente
      .map(date => ({
        date,
        activities: grouped[date]
      }));
    this.filterActivities(); // Applica il filtro iniziale
  }

    // Filtra le attività in base al tipo selezionato
      filterActivities() {
        if (this.selectedActivity === 'all') {
          this.filteredGroupedActivities = this.groupedActivities;
        } else {
          this.filteredGroupedActivities = this.groupedActivities.map(group => ({
            date: group.date,
            activities: group.activities.filter(activity => activity.type === this.selectedActivity)
          })).filter(group => group.activities.length > 0); // Rimuove le date senza attività
        }
      }

  // Metodo per eliminare un'attività
    async deleteActivity(activityId: number) {
      await this.activityService.deleteActivity(activityId);
      await this.loadAndGroupActivities(); // Ricarica la lista aggiornata
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
