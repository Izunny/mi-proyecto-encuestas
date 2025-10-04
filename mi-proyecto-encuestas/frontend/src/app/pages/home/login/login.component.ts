import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router'; 
import { LoginService } from '../../../services/login.service'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [    
    CommonModule,
    ReactiveFormsModule 
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit{
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private LoginService: LoginService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required], 
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      alert('Algunos de los datos son incorrectos.');
      this.loginForm.markAllAsTouched(); 
      return;
    }
      this.LoginService.loginUser(this.loginForm.value).subscribe({
        next: (response) => {
          alert('!Inicio de sesión exitoso!');
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          console.error('Error en tu inicio de sesión:', err);
          alert('Ocurrió un error. Revisa la consola para más detalles.');
        }
    });
  }


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