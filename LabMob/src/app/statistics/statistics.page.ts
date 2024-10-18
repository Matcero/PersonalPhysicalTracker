import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Importa il Router

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    // Inizializza eventuali dati statistici
  }

  // Funzione per andare alla home
      goToHome() {
        this.router.navigate(['/home']); // Naviga verso la home
      }

    // Add a method to navigate to the calendar
    goToCalendar() {
      this.router.navigate(['/calendar']);
    }

    goToStatistics() {
      this.router.navigate(['/statistics']);
    }

    // Metodo per navigare verso la pagina Community
    goToCommunity() {
      this.router.navigate(['/community']);
    }


}
