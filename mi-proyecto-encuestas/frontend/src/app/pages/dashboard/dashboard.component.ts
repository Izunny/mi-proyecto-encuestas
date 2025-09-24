import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterModule ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  surveys: any[] = [];
  filteredSurveys: any[] = [];
  selectedSurveyId: number | null = null;
  searchTerm: string = '';

  viewMode: 'user' | 'all' = 'user'; 
  currentUserId: number = 1; 

  constructor(private encuestasService: EncuestasService) { }

  ngOnInit(): void {
    this.loadUserSurveys();
  }

  loadUserSurveys(): void {
    this.encuestasService.getSurveysByUser(this.currentUserId).subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); 
    });
  }

  loadAllSurveys(): void {
    this.encuestasService.getAllSurveys().subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); 
    });
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'user' ? 'all' : 'user';
    if (this.viewMode === 'user') {
      this.loadUserSurveys();
    } else {
      this.loadAllSurveys();
    }
  }

  filterSurveys(): void {
    if (!this.searchTerm) {
      this.filteredSurveys = this.surveys;
    } else {
      this.filteredSurveys = this.surveys.filter(survey =>
        survey.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  changeStatus(survey: any): void {
    const nuevoEstado = survey.activo === 'S' ? 'N' : 'S';
    const surveyId = survey.idencuesta;

    this.encuestasService.updateSurveyStatus(surveyId, nuevoEstado).subscribe({
      next: () => {
        survey.activo = nuevoEstado;
      },
      error: (err: any) => {
        alert('Error al cambiar el estado: ' + err.message);
      }
    });
  }

  selectSurvey(id: number): void {
    this.selectedSurveyId = id;
  }

  deleteSelectedSurvey(): void {
    if (!this.selectedSurveyId) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta encuesta?')) {
      this.encuestasService.deleteSurvey(this.selectedSurveyId).subscribe({
        next: () => {
          alert('Encuesta eliminada con éxito.');
          this.viewMode === 'user' ? this.loadUserSurveys() : this.loadAllSurveys();
          this.selectedSurveyId = null;
        },
        error: (err: any) => alert('Error al eliminar la encuesta: ' + err.message)
      });
    }
  }

 
}