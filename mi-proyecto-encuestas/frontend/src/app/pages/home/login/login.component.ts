import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

}
/*
  export class LoginComponent {
    username = '';
    password = '';
    errorMessage = '';

    constructor(private http: HttpClient, private router: Router) {}

    onSubmit() {
      this.errorMessage = ''; // Clear previous errors
      this.http.post('http://localhost:3000/api/login', { username: this.username, password: this.password })
        .subscribe({
          next: (response: any) => {
            // Assuming a successful login returns a token or success message
            console.log('Login successful:', response);
            this.router.navigate(['/dashboard']); // Navigate to a dashboard or home page
          },
          error: (error) => {
            console.error('Login failed:', error);
            this.errorMessage = error.error.message || 'Login failed. Please try again.';
          }
        });
    }
  }
*/