import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// 1. IMPORTA LOS MÓDULOS NECESARIOS
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // 2. AÑÁDELOS AL ARREGLO DE IMPORTS
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  surveys: any[] = [];
  filteredSurveys: any[] = [];
  selectedSurveyId: number | null = null;
  
  private _searchTerm: string = '';
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadSurveys();
  }

  loadSurveys(): void {
    const userId = 1;
    this.http.get<any[]>(`${this.apiUrl}/surveys/user/${userId}`).subscribe(data => {
      this.surveys = data;
      this.filteredSurveys = data;
    });
  }

  selectSurvey(id: number): void {
    this.selectedSurveyId = id;
  }

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    this.filteredSurveys = this.surveys.filter(survey => 
      survey.nombre.toLowerCase().includes(value.toLowerCase())
    );
  }

  deleteSelectedSurvey(): void {
    if (!this.selectedSurveyId) {
      alert('Por favor, selecciona una encuesta para eliminar.');
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar esta encuesta?')) {
      this.http.delete(`${this.apiUrl}/surveys/${this.selectedSurveyId}`).subscribe({
        next: () => {
          alert('Encuesta eliminada con éxito.');
          this.loadSurveys();
          this.selectedSurveyId = null;
        },
        error: (err) => alert('Error al eliminar la encuesta: ' + err.message)
      });
    }
  }

  changeStatus(survey: any): void {
      const nuevoEstado = survey.activo === 'S' ? 'N' : 'S';
      this.http.put(`${this.apiUrl}/surveys/${survey.idencuesta}/status`, { nuevoEstado }).subscribe({
          next: () => {
              survey.activo = nuevoEstado;
          },
          error: (err) => alert('Error al cambiar el estado: ' + err.message)
      });
  }
}