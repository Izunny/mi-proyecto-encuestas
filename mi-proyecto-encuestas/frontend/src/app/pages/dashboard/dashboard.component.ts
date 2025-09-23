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

  // === PROPIEDADES NUEVAS ===
  viewMode: 'user' | 'all' = 'user'; // Por defecto, muestra las del usuario
  currentUserId: number = 1; // Debes obtener el ID del usuario logueado

  constructor(private encuestasService: EncuestasService) { }

  ngOnInit(): void {
    // Al iniciar, carga las encuestas del usuario por defecto
    this.loadUserSurveys();
  }

  // === MÉTODOS NUEVOS Y ACTUALIZADOS ===

  // Carga las encuestas del usuario actual
  loadUserSurveys(): void {
    this.encuestasService.getSurveysByUser(this.currentUserId).subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); // Llama al filtro después de cargar
    });
  }

  // Carga TODAS las encuestas
  loadAllSurveys(): void {
    // Asegúrate de tener este método en tu servicio (EncuestasService)
    this.encuestasService.getAllSurveys().subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); // Llama al filtro después de cargar
    });
  }

  // Función para cambiar de vista (la que llamaba el botón)
  toggleView(): void {
    this.viewMode = this.viewMode === 'user' ? 'all' : 'user';
    if (this.viewMode === 'user') {
      this.loadUserSurveys();
    } else {
      this.loadAllSurveys();
    }
  }

  // Función de filtrado (la que llamaba el input)
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
    // 1. Determina cuál será el nuevo estado
    const nuevoEstado = survey.activo === 'S' ? 'N' : 'S';
    const surveyId = survey.idencuesta;

    // 2. Llama al servicio para actualizar en la base de datos
    this.encuestasService.updateSurveyStatus(surveyId, nuevoEstado).subscribe({
      next: () => {
        // 3. Si el backend confirma, actualiza la vista al instante
        survey.activo = nuevoEstado;
      },
      error: (err: any) => {
        // 4. Si hay un error, muéstralo
        alert('Error al cambiar el estado: ' + err.message);
      }
    });
  }

  // --- Tus métodos existentes ---
  selectSurvey(id: number): void {
    this.selectedSurveyId = id;
  }

  deleteSelectedSurvey(): void {
    if (!this.selectedSurveyId) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta encuesta?')) {
      this.encuestasService.deleteSurvey(this.selectedSurveyId).subscribe({
        next: () => {
          alert('Encuesta eliminada con éxito.');
          // Recarga la vista actual
          this.viewMode === 'user' ? this.loadUserSurveys() : this.loadAllSurveys();
          this.selectedSurveyId = null;
        },
        error: (err: any) => alert('Error al eliminar la encuesta: ' + err.message)
      });
    }
  }

 
}