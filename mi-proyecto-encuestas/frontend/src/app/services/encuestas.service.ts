import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncuestasService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  logout(logout: any): Observable<any> {
    return this.http.post(`http://localhost:3000/logout`, logout);
  }

  // --- METODOS DEL DASHBOARD ---
  getAllSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/surveys`);
  }
  getSurveysByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/surveys/user/${userId}`);
  }
  updateSurveyStatus(surveyId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/surveys/${surveyId}/status`, { nuevoEstado: newStatus });
  }
  deleteSurvey(surveyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/surveys/${surveyId}`);
  }

  // --- METODOS DEL EDITOR DE ENCUESTAS ---
  getSurveyById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/surveys/${id}`);
  }
  createSurvey(surveyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/surveys`, surveyData);
  }
  updateSurvey(id: number, surveyData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/surveys/${id}`, surveyData);
  }

  submitResponses(responseData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/responses`, responseData);
  }
}