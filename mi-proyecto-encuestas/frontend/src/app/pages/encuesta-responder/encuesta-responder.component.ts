import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
// Quitamos AuthService porque esta página es pública
// import { AuthService } from '../../services/auth.service'; 

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
  surveyToken: string = ''; // <-- Usaremos token en lugar de surveyId

  constructor(
    private fb: FormBuilder,
    private encuestasService: EncuestasService,
    private route: ActivatedRoute,
    private router: Router
    // Quitamos AuthService del constructor
  ) {}

  ngOnInit(): void {
    this.responseForm = this.fb.group({
      respuestas: this.fb.group({})
    });
    
    // --- 👇 CORRECCIÓN 1: Leemos el 'token' de la URL 👇 ---
    this.surveyToken = this.route.snapshot.paramMap.get('token') || '';

    if (this.surveyToken) {
      this.loadSurveyByToken();
    } else {
      this.isLoading = false;
      alert('Token de encuesta no válido.');
      // Redirigimos a una página de error
      this.router.navigate(['/token-expirado']); 
    }
  }

  // --- 👇 CORRECCIÓN 2: Usamos la función de 'getSurveyByToken' 👇 ---
  loadSurveyByToken(): void {
    this.isLoading = true;
    this.encuestasService.getSurveyByToken(this.surveyToken).subscribe({
      next: (data: any) => {
        this.survey = data;
        this.buildFormControls();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar la encuesta:', err);
        // Redirigimos a una página de error si el token no es válido o expira
        this.router.navigate(['/token-expirado']); 
        this.isLoading = false;
      }
    });
  }

  // (Las funciones buildFormControls, onCheckboxChange, y setRating se quedan igual)
  buildFormControls(): void {
    const respuestasGroup = this.responseForm.get('respuestas') as FormGroup;
    this.survey.preguntas.forEach((pregunta: any) => {
      // Valor inicial: si es slider o ranking, que empiece en '0' en vez de null
      let defaultValue = null;
      if (pregunta.idtipopregunta === 5 || pregunta.idtipopregunta === 6) {
        defaultValue = '0';
      }
      
      const control = pregunta.idtipopregunta === 4 
        ? this.fb.array([])
        : new FormControl(defaultValue); // Usamos el valor por defecto
        
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
  
  setRating(preguntaId: string, rating: number): void {
    const control = (this.responseForm.get('respuestas') as FormGroup).get(preguntaId);
    if (control) {
      control.setValue(rating.toString());
    }
  }

  onSubmit(): void {
    if (this.responseForm.invalid) {
      alert('Por favor, responde todas las preguntas requeridas.');
      return;
    }

    // (Tu lógica de 'processedRespuestas' está perfecta y se queda igual)
    const rawRespuestas = this.responseForm.value.respuestas;
    const processedRespuestas: { [key: string]: any } = {};
    for (const preguntaId of Object.keys(rawRespuestas)) {
      const pregunta = this.survey.preguntas.find((p: any) => p.idpregunta.toString() === preguntaId);
      if (!pregunta) continue;
      const respuesta = rawRespuestas[preguntaId];
      if (pregunta.idtipopregunta === 3 && respuesta) {
        processedRespuestas[preguntaId] = Number(respuesta);
      } else if ((pregunta.idtipopregunta === 5 || pregunta.idtipopregunta === 6) && respuesta) {
        processedRespuestas[preguntaId] = respuesta.toString();
      } else {
        processedRespuestas[preguntaId] = respuesta;
      }
    }

    // --- 👇 CORRECCIÓN 3: Preparamos los datos con 'token' e 'idusuario' 👇 ---
    const submissionData = {
      token: this.surveyToken, // Enviamos el token para la validación
      idusuario: 1,           // Usamos '1' como ID de usuario "Anónimo"
      respuestas: processedRespuestas
    };
    
    console.log("Enviando al backend:", submissionData); // Para depuración

    this.encuestasService.submitResponses(submissionData).subscribe({
      next: () => {
        alert('¡Gracias por completar la encuesta!');
        this.router.navigate(['/']); // Redirigimos a la página de inicio
      },
      error: (err: any) => {
        console.error('Error al enviar las respuestas:', err);
        // El backend ahora nos da errores más claros
        alert(`Ocurrió un error: ${err.error.error || 'Inténtalo de nuevo.'}`);
      }
    });
  }

  goBack(): void {
    // Un usuario anónimo no debe ir al dashboard, lo mandamos al inicio
    this.router.navigate(['/']);
  }
}