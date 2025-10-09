import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private LOGIN_URL = 'http://localhost:3000/login';

  private tokenKey = 'authToken';
  private idusuario = 'id';
  constructor(private httpClient: HttpClient, private router: Router) {}


  login(username: string, password: string): Observable<any>{
    return this.httpClient.post<any>(this.LOGIN_URL, {username, password}).pipe(
      tap(response =>  {
        if(response.token) {
          this.setToken(response.token);
          this.setID(response.user["id"]);
        }
      })
    )
  }

  private setID(user: string): void {
    localStorage.setItem(this.idusuario, user)
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  } 

  private getToken(): string | null {
    if(typeof window !== 'undefined'){
      return localStorage.getItem(this.tokenKey);
    } else {
      return null;
    }
  }
  
  getID(): number | null {
    if(typeof window !== 'undefined'){
      return Number(localStorage.getItem(this.idusuario));
    } else {return null}
  }


  isAuthenticated(): boolean {
    const token = this.getToken();
    if(!token) {
      return false;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 60 * 1000 * 1000;
    return Date.now() < exp;
  }



  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.idusuario);
    this.router.navigate(['/login']);
  }

}
