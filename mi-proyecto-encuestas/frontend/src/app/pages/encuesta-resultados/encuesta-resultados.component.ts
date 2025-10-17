import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-encuesta-resultados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './encuesta-resultados.component.html',
  styleUrls: ['./encuesta-resultados.component.scss']
})
export class EncuestaResultadosComponent implements OnInit {
  survey: any = null;
  responseForm!: FormGroup;
  isLoading = true;
  surveyId!: number;
  fecha_formato: string = "";

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
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
        this.fecha_formato = this.survey.fecha.slice(0,10); 
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

    goBack(): void {
    this.router.navigate(['/dashboard']);
  }
  
}