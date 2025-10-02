import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router'; 
import { RegisterService } from '../../../services/register.service'; 

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule 
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent implements OnInit{
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', Validators.required], 
      password: ['', Validators.required],
    });
  }

    onSubmit() {
    if (this.registerForm.invalid) {
      alert('Algunos de los datos son incorrectos.');
      this.registerForm.markAllAsTouched(); 
      return;
    }
    
    this.registerService.registerUser(this.registerForm.value).subscribe({
      next: (response) => {
        alert('¡Registro exitoso!');
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        console.error('Error en tu registro:', err);
        alert('Ocurrió un error en tu registro. Revisa la consola para más detalles.');
      }
    });
  }

}