import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router'; 
// Ya no necesitas RegisterService, así que puedes borrar esa línea
import { AuthService } from '../../../services/auth.service'; 
import { AlertService } from '../../../services/alert.service';


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
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // CORRECCIÓN: Inyecta AuthService aquí
    private authService: AuthService,
    private alertService: AlertService
    
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', Validators.required], 
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    
    // Ahora 'this.authService' existe y la llamada funcionará
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.alertService.show('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error en el registro:', err);
        // Muestra el mensaje de error que viene del backend (ej. "El nombre de usuario ya existe.")
        alert('Error: ' + (err.error?.error || 'No se pudo completar el registro.'));
      }
    });
  }
}