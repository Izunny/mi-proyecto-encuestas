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
    const url = `${this.apiUrl}/surveys/${surveyId}/status`;
    return this.http.put(url, { nuevoEstado: newStatus });
  }
  getAllSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/surveys`); // Suponiendo que tienes este endpoint
  }


    createSurvey(surveyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/surveys`, surveyData);
  }


}