import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router'; 
import { EncuestasService } from '../../services/encuestas.service'; 

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
  

  public isAddQuestionMenuOpen = false; 
  public openQuestionMenuIndex: number | null = null; 
  private questionTypeIcons: { [key: string]: string } = {
    '1': 'fas fa-font',           // Texto Corto
    '2': 'fas fa-paragraph',      // Párrafo
    '3': 'fas fa-dot-circle',     // Opción Única
    '4': 'fas fa-check-square',   // Opción Múltiple
    '5': 'fas fa-sliders-h',      // Slider
    '6': 'fas fa-star'            // Ranking
  };

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

  public getIconForQuestionType(typeId: string): string {
    return this.questionTypeIcons[typeId] || 'fas fa-list-ul';
  }

  // --- METODOS PARA MANEJAR LOS MENUS DE CADA PREGUNTA ---

  toggleQuestionMenu(index: number): void {
    this.openQuestionMenuIndex = this.openQuestionMenuIndex === index ? null : index;
  }

  toggleRequerida(index: number): void {
    const requeridaControl = this.preguntas().at(index).get('requerida');
    if (requeridaControl) {
      requeridaControl.patchValue(!requeridaControl.value);
    }
    this.openQuestionMenuIndex = null; 
  }

  cambiarTipoPregunta(preguntaIndex: number, nuevoTipo: string): void {
    const preguntaFormGroup = this.preguntas().at(preguntaIndex) as FormGroup;
    const opcionesFormArray = preguntaFormGroup.get('opciones') as FormArray;

    preguntaFormGroup.get('idtipopregunta')?.setValue(nuevoTipo);

  
    if (nuevoTipo === '3' || nuevoTipo === '4') {
      if (opcionesFormArray.length === 0) {
        opcionesFormArray.push(this.nuevaOpcion());
      }
    } else { 
      opcionesFormArray.clear();
    }
    this.openQuestionMenuIndex = null; 
  }

  // --- MÉTODOS PARA GESTIONAR PREGUNTAS Y OPCIONES ---

  preguntas(): FormArray {
    return this.surveyForm.get('preguntas') as FormArray;
  }

  nuevaPregunta(tipoPregunta: string): FormGroup {
    return this.fb.group({
      textopregunta: ['', Validators.required],
      idtipopregunta: [tipoPregunta, Validators.required],
      requerida: [false],
      opciones: this.fb.array([])
    });
  }

  agregarPregunta(tipoPregunta: string) {
    this.preguntas().push(this.nuevaPregunta(tipoPregunta));
    this.isAddQuestionMenuOpen = false;
  }

  quitarPregunta(preguntaIndex: number) {
    this.preguntas().removeAt(preguntaIndex);
    this.openQuestionMenuIndex = null; 
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
    this.router.navigate(['/dashboard']);
  }
}

