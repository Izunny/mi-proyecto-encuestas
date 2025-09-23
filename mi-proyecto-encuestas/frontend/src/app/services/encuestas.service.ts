import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncuestasService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Obtiene las encuestas de un usuario
  getSurveysByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/surveys/user/${userId}`);
  }

  // Elimina una encuesta por su ID
  deleteSurvey(surveyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/surveys/${surveyId}`);
  }

  // Actualiza el estado de una encuesta
  updateSurveyStatus(surveyId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/surveys/${surveyId}/status`, { nuevoEstado: newStatus });
  }

  // --- Aquí puedes agregar los métodos para obtener TODAS las encuestas que mencionamos antes ---
  getAllSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/surveys`); // Suponiendo que tienes este endpoint
  }
}