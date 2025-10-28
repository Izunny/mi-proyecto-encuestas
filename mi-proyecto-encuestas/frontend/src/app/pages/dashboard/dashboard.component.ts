import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EncuestasService } from '../../services/encuestas.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Encuesta } from '../../interfaces/encuesta.interface';
import { QRCodeComponent } from 'angularx-qrcode';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterModule, QRCodeComponent ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- propiedades  ---
  surveys: Encuesta[] = [];
  filteredSurveys: Encuesta[] = [];
  selectedSurveyId: number | null = null;
  searchTerm: string = '';
  viewMode: 'user' | 'all' = 'user';
  isLoading = true;
  private userSubscription!: Subscription;
  
  public isShareOptionsModalOpen = false;
  public isShareModalOpen = false;
  public shareUrl = '';

  constructor(
    private encuestasService: EncuestasService, 
    private authService: AuthService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) { this.loadUserSurveys(); } 
      else { /* ... (no hay usuario) ... */ }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) { this.userSubscription.unsubscribe(); }
  }

  shareSurvey(): void {
    if (!this.selectedSurveyId) return;

    const usesInput = prompt("¿Cuántas veces se puede usar este enlace?\n(Deja en blanco o '0' para ilimitado)", "0");
    if (usesInput === null) return;

    const durationInput = prompt("¿Por cuántos días será válido este enlace?\n(Deja en blanco para 7 días)", "7");
    if (durationInput === null) return;

    const uses = parseInt(usesInput, 10);
    const maxUses = (!isNaN(uses) && uses > 0) ? uses : null;
    const days = parseInt(durationInput, 10);
    const durationDays = (!isNaN(days) && days > 0) ? days : 7;

    this.encuestasService.generateShareToken(this.selectedSurveyId, maxUses, durationDays).subscribe({
      next: (response: any) => { // Añadimos ': any'
        const token = response.token;
        this.shareUrl = `${window.location.origin}/responder/${token}`;
        this.isShareModalOpen = true;
      },
      error: (err: any) => { /* ... */ }
    });
  }

  copyUrlToClipboard(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      alert('¡Enlace copiado al portapapeles!');
    }).catch(err => {
      console.error('Error al copiar el enlace:', err);
    });
  }

  downloadQRCode(qrCodeInstance: QRCodeComponent): void {
    try {
      // --- ✨ ESTA ES LA CORRECCIÓN CLAVE ✨ ---
      // La propiedad correcta no es 'el', es 'qrcElement'
      const canvas = qrCodeInstance.qrcElement.nativeElement.querySelector('canvas');
      
      if (!canvas) {
        console.error("No se pudo encontrar el canvas del QR.");
        return;
      }

      // El resto de la función (crear el enlace, etc.) estaba perfecta
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'encuesta-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error al descargar el QR:', err);
      alert('No se pudo descargar el código QR.');
    }
  }
  
  loadUserSurveys(): void {
    this.isLoading = true; // 2. Ponlo en 'true' ANTES de iniciar la carga
    this.encuestasService.getSurveysByUser().subscribe({
      next: (data: any[]) => {
        this.surveys = data;
        this.filterSurveys(); 
        this.isLoading = false; // 3. ¡PONLO EN 'false' AQUÍ AL TERMINAR!
      },
      error: (err) => {
        console.error('Error al cargar las encuestas del usuario:', err);
        this.isLoading = false; // 4. Y TAMBIÉN AQUÍ, EN CASO DE ERROR
      }
    });
  }

  loadAllSurveys(): void {
    this.encuestasService.getAllSurveys().subscribe((data: any[]) => {
      this.surveys = data;
      this.filterSurveys(); 
    });
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'user' ? 'all' : 'user';
    if (this.viewMode === 'user') {
      this.loadUserSurveys();
    } else {
      this.loadAllSurveys();
    }
  }

  
filterSurveys(): void {
  console.log('3. [filterSurveys] Filtrando las encuestas...');
  if (!this.searchTerm) {
    this.filteredSurveys = this.surveys;
  } else {
    this.filteredSurveys = this.surveys.filter(survey =>
      survey.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  console.log('4. [filterSurveys] El arreglo final para mostrar en la tabla es:', this.filteredSurveys);
}

  changeStatus(survey: any): void {
    const nuevoEstado = survey.activo === 'S' ? 'N' : 'S';
    const surveyId = survey.idencuesta;

    this.encuestasService.updateSurveyStatus(surveyId, nuevoEstado).subscribe({
      next: () => {
        survey.activo = nuevoEstado;
      },
      error: (err: any) => {
        alert('Error al cambiar el estado: ' + err.message);
      }
    });
  }

  selectSurvey(id: number): void {
    this.selectedSurveyId = id;
  }

  // ... (dentro de tu clase DashboardComponent)

  deleteSelectedSurvey(): void {
    if (!this.selectedSurveyId) {
      // Usamos el nuevo servicio de alertas
      this.alertService.show('Por favor, selecciona una encuesta para eliminar.', 'error');
      return;
    }
    
    // Buscamos la encuesta para ver si tiene respuestas
    const surveyToDelete = this.surveys.find(s => s.idencuesta === this.selectedSurveyId);
    if (!surveyToDelete) return; 

    // Preparamos el mensaje de confirmación
    let confirmationMessage = '¿Estás seguro de que quieres eliminar esta encuesta?';
    if (surveyToDelete.responseCount > 0) {
      confirmationMessage = `¡ATENCIÓN! Esta encuesta ya tiene ${surveyToDelete.responseCount} respuesta(s). Se borrarán todos los resultados.\n\n¿Deseas continuar?`;
    }

    // 1. Usamos el nuevo 'confirm' del servicio
    this.alertService.confirm(confirmationMessage, () => {
      
      // 2. Esta función de flecha SÓLO se ejecuta si el usuario presiona "Aceptar"
      this.encuestasService.deleteSurvey(this.selectedSurveyId!).subscribe({
        next: () => {
          this.alertService.show('Encuesta eliminada con éxito.', 'success');
          
          // --- 👇 ¡AQUÍ ESTÁ LA MAGIA! 👇 ---
          // 3. Una vez eliminada, volvemos a cargar la lista que esté activa.
          //    La nueva lista vendrá sin la encuesta que acabamos de borrar.
          if (this.viewMode === 'user') {
            this.loadUserSurveys();
          } else {
            this.loadAllSurveys();
          }
          // --- 👆 FIN DE LA MAGIA 👆 ---

          this.selectedSurveyId = null; // Limpiamos la selección
        },
        error: (err: any) => {
          this.alertService.show('Error al eliminar la encuesta.', 'error');
        }
      });
    });
  }


  logout(): void {
    this.authService.logout();
  }
}