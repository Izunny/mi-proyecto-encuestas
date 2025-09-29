import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';

@Component({
  selector: 'app-encuesta-responder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './encuesta-responder.component.html',
  styleUrls: ['./encuesta-responder.component.scss']
})
export class EncuestaResponderComponent implements OnInit {
  survey: any = null;
  responseForm!: FormGroup;
  isLoading = true;
  surveyId!: number;

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.responseForm = this.fb.group({
      respuestas: this.fb.group({})
    });
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.surveyId) {
      this.loadSurvey();
    }
  }

  loadSurvey(): void {
    this.encuestasService.getSurveyById(this.surveyId).subscribe({
      next: (data) => {
        this.survey = data;
        this.buildFormControls();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar la encuesta:', err);
        alert('No se pudo cargar la encuesta.');
        this.isLoading = false;
      }
    });
  }

  buildFormControls(): void {
    const respuestasGroup = this.responseForm.get('respuestas') as FormGroup;
    this.survey.preguntas.forEach((pregunta: any) => {
      const control = pregunta.idtipopregunta === 4 
        ? this.fb.array([])
        : new FormControl(null);
      respuestasGroup.addControl(pregunta.idpregunta.toString(), control);
    });
  }

  onCheckboxChange(event: any, preguntaId: string): void {
    const formArray = (this.responseForm.get('respuestas') as FormGroup).get(preguntaId) as FormArray;
    if (event.target.checked) {
      formArray.push(new FormControl(Number(event.target.value)));
    } else {
      const index = formArray.controls.findIndex(x => x.value === Number(event.target.value));
      formArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.responseForm.invalid) {
      alert('Por favor, responde todas las preguntas requeridas.');
      return;
    }
    const submissionData = {
      idencuesta: this.surveyId,
      idusuario: 1, 
      respuestas: this.responseForm.value.respuestas
    };
    this.encuestasService.submitResponses(submissionData).subscribe({
      next: () => {
        alert('¡Gracias por completar la encuesta!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al enviar las respuestas:', err);
        alert('Ocurrió un error al enviar tus respuestas.');
      }
    });
  }
}