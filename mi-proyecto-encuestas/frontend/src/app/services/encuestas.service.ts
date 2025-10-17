import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncuestasService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  // --- MÉTODOS DEL DASHBOARD ---

  getSurveysByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/my-surveys`);
  }
  
  getAllSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/surveys`);
  }

  updateSurveyStatus(surveyId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/surveys/${surveyId}/status`, { nuevoEstado: newStatus });
  }

  deleteSurvey(surveyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/surveys/${surveyId}`);
  }

  // --- MÉTODOS DEL EDITOR Y RESPONDER ---

 getSurveyById(id: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/api/surveys/${id}`);
}

  createSurvey(surveyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/surveys`, surveyData);
  }

  updateSurvey(id: number, surveyData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/surveys/${id}`, surveyData);
  }

  submitResponses(responseData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/responses`, responseData);
  }
  
  // --- MÉTODOS DE RESULTADOS ---
  getQuestionsBySurvey(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/${id}`);
  }
}