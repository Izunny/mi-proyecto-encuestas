import { Component, OnInit,ViewChild, OnDestroy, ElementRef } from '@angular/core';
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
  
  public isShareOptionsModalOpen = false; // Para el modal de opciones
  public isShareLinkModalOpen = false;    // Para el modal del QR
  public shareUrl = '';

  public shareOptions = {
    maxUses: null as number | null,
    durationDays: 7
  };

  // Necesitamos el ViewChild para la función de descarga
  @ViewChild('myQRCode') qrCodeElement!: QRCodeComponent;

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
    if (!this.selectedSurveyId) {
      this.alertService.show('Por favor, selecciona una encuesta para compartir.', 'error');
      return;
    }
    
    // Reseteamos las opciones a sus valores por defecto
    this.shareOptions = {
      maxUses: null, // Lo ponemos en null para que el placeholder aparezca
      durationDays: 7
    };
    // Abrimos el modal de opciones
    this.isShareOptionsModalOpen = true;
  }
  
 
  onGenerateShareLink(): void {
    if (!this.selectedSurveyId) return;

    
    const uses = this.shareOptions.maxUses;
    const maxUses = (uses && uses > 0) ? uses : null;
    
    const days = this.shareOptions.durationDays;
    const durationDays = (days && days > 0) ? days : 7;

   
    this.encuestasService.generateShareToken(this.selectedSurveyId, maxUses, durationDays).subscribe({
      next: (response: any) => {
        const token = response.token;
        this.shareUrl = `${window.location.origin}/responder/${token}`;
        
        
        this.isShareOptionsModalOpen = false;
        this.isShareLinkModalOpen = true; 
      },
      error: (err: any) => {
        console.error('Error al generar el enlace:', err);
        //  servicio de alertas
        this.alertService.show('No se pudo generar el enlace para compartir.', 'error');
      }
    });
  }

  copyUrlToClipboard(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.alertService.show('¡Enlace copiado al portapapeles!', 'success');
    });
  }

  downloadQRCode(): void {
    try {
      const canvas = this.qrCodeElement.qrcElement.nativeElement.querySelector('canvas');
      if (!canvas) throw new Error("No se pudo encontrar el canvas del QR.");
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'encuesta-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al descargar el QR:', err);
      this.alertService.show('No se pudo descargar el código QR.', 'error');
    }
  }
  
  loadUserSurveys(): void {
    this.isLoading = true; 
    this.encuestasService.getSurveysByUser().subscribe({
      next: (data: any[]) => {
        this.surveys = data;
        this.filterSurveys(); 
        this.isLoading = false; 
      },
      error: (err) => {
        console.error('Error al cargar las encuestas del usuario:', err);
        this.isLoading = false;
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


  deleteSelectedSurvey(): void {
    if (!this.selectedSurveyId) {
      // servicio de alertas
      this.alertService.show('Por favor, selecciona una encuesta para eliminar.', 'error');
      return;
    }
    
    
    const surveyToDelete = this.surveys.find(s => s.idencuesta === this.selectedSurveyId);
    if (!surveyToDelete) return; 

    
    let confirmationMessage = '¿Estás seguro de que quieres eliminar esta encuesta?';
    if (surveyToDelete.responseCount > 0) {
      confirmationMessage = `¡ATENCIÓN! Esta encuesta ya tiene ${surveyToDelete.responseCount} respuesta(s). Se borrarán todos los resultados.\n\n¿Deseas continuar?`;
    }

    
    this.alertService.confirm(confirmationMessage, () => {
      
     
      this.encuestasService.deleteSurvey(this.selectedSurveyId!).subscribe({
        next: () => {
          this.alertService.show('Encuesta eliminada con éxito.', 'success');
          
         
           
          if (this.viewMode === 'user') {
            this.loadUserSurveys();
          } else {
            this.loadAllSurveys();
          }

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