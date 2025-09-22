import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';


@Component({
  selector: 'app-encuesta-agregar',
  standalone: true,
  //  LOS MÓDULOS AL ARREGLO DE IMPORTS
  imports: [
    CommonModule,
    ReactiveFormsModule 
  ],
  templateUrl: './encuesta-agregar.component.html',
  styleUrls: ['./encuesta-agregar.component.scss']
})
export class EncuestaAgregarComponent implements OnInit {
  //  añade '!' para indicar que esta propiedad será inicializada en ngOnInit
  surveyForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.surveyForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      fecha: [new Date().toISOString().split('T')[0]], 
      activo: ['S', Validators.required],
      idusuario: [1], // Temporalmente, luego vendrá del login
      preguntas: this.fb.array([])
    });
  }

  // ---  para manejar el FormArray de preguntas ---
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

  // ---  para manejar el FormArray de opciones anidado ---
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

  // ---  para enviar el formulario ---
  onSubmit() {
    if (this.surveyForm.valid) {
      console.log('Formulario a enviar:', this.surveyForm.value);
      //  enviar los datos a la API de Node.js
    } else {
      console.log('El formulario no es válido');
    }
  }

  goBack() {
  window.history.back();
}

}