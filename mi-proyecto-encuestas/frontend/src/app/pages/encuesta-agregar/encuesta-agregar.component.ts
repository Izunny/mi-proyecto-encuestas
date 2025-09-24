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

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.surveyForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''], 
      fecha: [new Date().toISOString().split('T')[0]], 
      activo: ['S', Validators.required],
      idusuario: [1], 
      preguntas: this.fb.array([])
    });
  }

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

  onSubmit() {
    if (this.surveyForm.invalid) {
      alert('El formulario no es válido. Por favor, revisa que el título y todas las preguntas tengan texto.');
      this.surveyForm.markAllAsTouched();
      return;
    }
    
    this.encuestasService.createSurvey(this.surveyForm.value).subscribe({
      next: (response) => {
        alert('¡Encuesta guardada con éxito!');
        this.router.navigate(['/dashboard']); 
      },
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