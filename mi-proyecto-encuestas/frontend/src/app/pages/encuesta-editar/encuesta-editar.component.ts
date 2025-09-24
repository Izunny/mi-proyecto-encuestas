import { Component, OnInit } from '@angular/core';
// --- 👇👇 1. ASEGÚRATE DE QUE ESTOS IMPORTS ESTÉN AQUÍ 👇👇 ---
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';

@Component({
  selector: 'app-encuesta-editar',
  standalone: true,
  // --- 👇👇 2. AÑADE LOS MÓDULOS A LA CAJA DE HERRAMIENTAS 👇👇 ---
  imports: [ 
    CommonModule, 
    ReactiveFormsModule 
  ],
  templateUrl: './encuesta-editar.component.html',
  styleUrls: ['./encuesta-editar.component.scss']
})
export class EncuestaEditarComponent implements OnInit {
  // --- 👇👇 3. AQUÍ ESTÁN TODAS LAS VARIABLES Y FUNCIONES QUE TU HTML NECESITA 👇👇 ---
  surveyForm!: FormGroup;
  surveyId!: number;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.surveyForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      activo: ['S', Validators.required],
      preguntas: this.fb.array([])
    });
    
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.surveyId) {
      this.loadSurveyData();
    } else {
      this.isLoading = false;
      alert('No se proporcionó un ID de encuesta.');
    }
  }

  loadSurveyData(): void {
    this.encuestasService.getSurveyById(this.surveyId).subscribe({
      next: (data) => {
        this.surveyForm.patchValue({
          nombre: data.nombre,
          descripcion: data.descripcion,
          activo: data.activo,
        });

        data.preguntas.forEach((pregunta: any) => {
          const preguntaFormGroup = this.nuevaPregunta();
          preguntaFormGroup.patchValue(pregunta);
          
          pregunta.opciones.forEach((opcion: any) => {
            (preguntaFormGroup.get('opciones') as FormArray).push(
              this.fb.group({
                opcion: [opcion.opcion, Validators.required]
              })
            );
          });
          
          this.preguntas().push(preguntaFormGroup);
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar la encuesta:', err);
        alert('No se pudo cargar la encuesta.');
        this.isLoading = false;
      }
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
  
  agregarPregunta() { this.preguntas().push(this.nuevaPregunta()); }
  quitarPregunta(index: number) { this.preguntas().removeAt(index); }
  
  opciones(preguntaIndex: number): FormArray {
    return this.preguntas().at(preguntaIndex).get('opciones') as FormArray;
  }
  
  nuevaOpcion(): FormGroup {
    return this.fb.group({ opcion: ['', Validators.required] });
  }

  agregarOpcion(preguntaIndex: number) { this.opciones(preguntaIndex).push(this.nuevaOpcion()); }
  quitarOpcion(preguntaIndex: number, opcionIndex: number) { this.opciones(preguntaIndex).removeAt(opcionIndex); }

  onSubmit() {
    if (this.surveyForm.invalid) {
      alert('Formulario inválido. Revisa que todos los campos requeridos estén llenos.');
      return;
    }
    this.encuestasService.updateSurvey(this.surveyId, this.surveyForm.value).subscribe({
      next: () => {
        alert('¡Encuesta actualizada con éxito!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al actualizar la encuesta:', err);
        alert('Ocurrió un error al actualizar.');
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}