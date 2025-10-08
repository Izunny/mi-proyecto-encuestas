import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { AuthService } from '../../../services/auth.service'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [    
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit{

  loginForm!: FormGroup;
  
  username = "";
  password = "";
  constructor(
    private authService: AuthService, 
    private router: Router, 
    private fb: FormBuilder,){
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [''], 
      password: [''],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      alert('Algunos de los datos son incorrectos.');
      this.loginForm.markAllAsTouched(); 
      return;
    }

    console.log(this.loginForm.value)
    this.username = this.loginForm.controls['username'].value;
    this.password = this.loginForm.controls['password'].value;
    
    this.authService.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error('Login failed', err)
    })
  }
}


