import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-encuesta-editar',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, DragDropModule ],
  templateUrl: './encuesta-editar.component.html',
  styleUrls: ['./encuesta-editar.component.scss']
  
})
export class EncuestaEditarComponent implements OnInit {
  surveyForm!: FormGroup;
  surveyId!: number;
  isLoading = true;

  public isSettingsOpen = false;
  public isAddQuestionMenuOpen = false;
  public openQuestionMenuIndex: number | null = null;
  private questionTypeIcons: { [key: string]: string } = {
    '1': 'fas fa-font',           // Texto Corto
    '2': 'fas fa-paragraph',      // Parrafo
    '3': 'fas fa-dot-circle',     // Opcion Unica
    '4': 'fas fa-check-square',   // Opcion Multiple
    '5': 'fas fa-sliders-h',      // Slider
    '6': 'fas fa-star'            // Ranking
  };
  

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  toggleSettingsSidebar(): void {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  toggleActivo(): void {
    const activoControl = this.surveyForm.get('activo');
    if (activoControl) {
      const nuevoValor = activoControl.value === 'S' ? 'N' : 'S';
      activoControl.setValue(nuevoValor);
    }
  }

  onQuestionDrop(event: CdkDragDrop<string[]>) {
    const preguntasArray = this.preguntas();
    // Esta función mágica del CDK reordena el FormArray por nosotros
    moveItemInArray(preguntasArray.controls, event.previousIndex, event.currentIndex);
  }

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
      alert('No se encontró un ID de encuesta.');
      this.isLoading = false;
    }
  }

    public getIconForQuestionType(typeId: string): string {
    return this.questionTypeIcons[typeId] || 'fas fa-list-ul';
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
          const preguntaFormGroup = this.nuevaPregunta(pregunta.idtipopregunta.toString());
          preguntaFormGroup.patchValue({
            textopregunta: pregunta.textopregunta,
            requerida: pregunta.requerida === 'S'
          });

          const opcionesFormArray = preguntaFormGroup.get('opciones') as FormArray;
          pregunta.opciones.forEach((opcion: any) => {
            opcionesFormArray.push(this.fb.group({
              opcion: [opcion.opcion, Validators.required]
            }));
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

  

  // --- METODOS REUTILIZADOS PARA MANEJAR LOS MENUS ---

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

  // --- METODOS REUTILIZADOS PARA GESTIONAR PREGUNTAS Y OPCIONES ---

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
    return this.fb.group({ opcion: ['', Validators.required] });
  }

  agregarOpcion(preguntaIndex: number) {
    this.opciones(preguntaIndex).push(this.nuevaOpcion());
  }

  quitarOpcion(preguntaIndex: number, opcionIndex: number) {
    this.opciones(preguntaIndex).removeAt(opcionIndex);
  }

  // --- NAVEGACION Y ENVIO DEL FORMULARIO ---

  onSubmit() {
    if (this.surveyForm.invalid) {
      alert('Formulario inválido.');
      return;
    }

    const formValue = this.surveyForm.getRawValue();

    const reorderedPreguntas = this.preguntas().controls.map((control, index) => {
      return {
        ...control.value, 
        orden: index + 1   
      };
    });

    const payload = {
      ...formValue,
      preguntas: reorderedPreguntas
    };

    console.log('Enviando payload CORREGIDO al backend:', payload);

    this.encuestasService.updateSurvey(this.surveyId, payload).subscribe({
      next: () => {
        alert('¡Encuesta actualizada con éxito!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        alert('Ocurrió un error al actualizar.');
      }
    });
  }

    goBack(): void {
    this.router.navigate(['/dashboard']); 
  }

  

}
