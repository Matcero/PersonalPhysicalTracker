import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Importa il Router

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    // Initialize any required data
  }

  // Funzione per andare alla home
      goToHome() {
        this.router.navigate(['/home']); // Naviga verso la home
      }

    // Add a method to navigate to the calendar
    goToCalendar() {
      this.router.navigate(['/calendar']);
    }

}
