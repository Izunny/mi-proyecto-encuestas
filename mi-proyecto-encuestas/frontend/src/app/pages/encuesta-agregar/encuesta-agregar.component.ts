import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // 1. IMPORTAMOS Router para navegar
import { EncuestasService } from '../../services/encuestas.service'; // 2. IMPORTAMOS nuestro servicio

@Component({
  selector: 'app-encuesta-agregar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule 
  ],
  templateUrl: './encuesta-agregar.component.html',
  styleUrls: ['./encuesta-agregar.component.scss']
})
export class EncuestaAgregarComponent implements OnInit {
  surveyForm!: FormGroup;

  // 3. INYECTAMOS el servicio y el router en el constructor
  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.surveyForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''], // La descripción puede no ser obligatoria
      fecha: [new Date().toISOString().split('T')[0]], 
      activo: ['S', Validators.required],
      idusuario: [1], // Temporalmente, esto debería venir del usuario logueado
      preguntas: this.fb.array([])
    });
  }

  // --- Métodos para manejar el FormArray de preguntas ---
  preguntas(): FormArray {
    return this.surveyForm.get('preguntas') as FormArray;
  }

  nuevaPregunta(): FormGroup {
    return this.fb.group({
      textopregunta: ['', Validators.required],
      idtipopregunta: ['1', Validators.required],
      requerida: [false],
      opciones: this.fb.array([])
    });
  }

  agregarPregunta() {
    this.preguntas().push(this.nuevaPregunta());
  }

  quitarPregunta(preguntaIndex: number) {
    this.preguntas().removeAt(preguntaIndex);
  }

  // --- Métodos para manejar el FormArray de opciones anidado ---
  opciones(preguntaIndex: number): FormArray {
    return this.preguntas().at(preguntaIndex).get('opciones') as FormArray;
  }

  nuevaOpcion(): FormGroup {
    return this.fb.group({
      opcion: ['', Validators.required]
    });
  }

  agregarOpcion(preguntaIndex: number) {
    this.opciones(preguntaIndex).push(this.nuevaOpcion());
  }

  quitarOpcion(preguntaIndex: number, opcionIndex: number) {
    this.opciones(preguntaIndex).removeAt(opcionIndex);
  }

  // --- 4. FUNCIÓN onSubmit COMPLETAMENTE ACTUALIZADA ---
  onSubmit() {
    // Primero, validamos que todo el formulario sea correcto
    if (this.surveyForm.invalid) {
      alert('El formulario no es válido. Por favor, revisa que el título y todas las preguntas tengan texto.');
      // Marca todos los campos como "tocados" para que se muestren los errores visuales si los tienes configurados
      this.surveyForm.markAllAsTouched();
      return;
    }
    
    // Si es válido, llamamos al método createSurvey de nuestro servicio
    this.encuestasService.createSurvey(this.surveyForm.value).subscribe({
      // Si todo sale bien (respuesta exitosa del backend)
      next: (response) => {
        alert('¡Encuesta guardada con éxito!');
        // Navegamos de vuelta al dashboard principal
        this.router.navigate(['/dashboard']); 
      },
      // Si ocurre un error
      error: (err) => {
        console.error('Error al guardar la encuesta:', err);
        alert('Ocurrió un error al guardar la encuesta. Revisa la consola para más detalles.');
      }
    });
  }

  goBack() {
    window.history.back();
  }
}