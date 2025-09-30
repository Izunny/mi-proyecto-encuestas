import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class RegisterService {
  private apiUrl = 'http://localhost:3000/api';
  
  constructor(private http: HttpClient) { }

  // --- METODOS DEL EDITOR DE ENCUESTAS ---
  registerUser(registerUser: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, registerUser);
  }

}
