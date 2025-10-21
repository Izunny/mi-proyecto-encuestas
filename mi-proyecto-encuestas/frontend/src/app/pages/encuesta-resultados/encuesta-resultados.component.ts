import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
import { AuthService } from '../../services/auth.service';
import { BrowserModule } from '@angular/platform-browser';
import { BaseChartDirective  } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
Chart.defaults.color = "#fff";
Chart.defaults.font.size = 20;

@Component({
  selector: 'app-encuesta-resultados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective ],
  templateUrl: './encuesta-resultados.component.html',
  styleUrls: ['./encuesta-resultados.component.scss']
})

export class EncuestaResultadosComponent implements OnInit {
  survey: any = null;
  responseForm!: FormGroup;
  isLoading = true;
  surveyId!: number;
  fecha_formato: string = "";
  preguntas: any = null;
  nombres_preguntas: any = null;
  chart: any = null;
  resultados: any = null;

  public chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
        legend: {
          labels: {
            color: 'white'
          },
            display: false,
        }
    }
  }

  
  public chartHOptions: ChartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
        legend: {
            display: false
        }
    }
    
  }

  public chartData: ChartData<'bar'> = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
      data: [12, 19, 3, 5, 2, 3],
    }]
  };

  public chartType: 'bar' = 'bar';

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {Chart.register(... registerables);}

  ngOnInit(): void {
    this.responseForm = this.fb.group({
      respuestas: this.fb.group({})
    });
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.surveyId) {
      this.loadSurvey();
      this.loadResults();
    }
  }

  loadSurvey(): void {
    this.encuestasService.getSurveyById(this.surveyId).subscribe({
      next: (data) => {
        this.survey = data;
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

  loadResults(): void {
    this.encuestasService.getResults(this.surveyId).subscribe({
      next: (data) => {
        this.resultados = data;
        console.log(this.resultados)
      },
      error: (err) => {
        console.error('Error al cargar la encuesta:', err);
        alert('No se pudo cargar la encuesta.');
      }
    });
  }

  createBarChart(opcionesNombres: Array<string>, opcionesRespuestas: Array<number>): void {
    this.chartData = {
      datasets: [{
      data: opcionesRespuestas,
      backgroundColor: [
      'rgba(255, 99, 132, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(255, 205, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(201, 203, 207, 0.7)'
    ],
      }],
      labels: opcionesNombres
    }
  }

  createHBarChart(opcionesNombres: Array<string>, opcionesRespuestas: Array<number>): void {
    this.chartData = {
      datasets: [{
      data: opcionesRespuestas,
      backgroundColor: [
      'rgba(255, 99, 132, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(255, 205, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(201, 203, 207, 0.7)'
    ],
      }],
      labels: opcionesNombres
    }
  }

    goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}