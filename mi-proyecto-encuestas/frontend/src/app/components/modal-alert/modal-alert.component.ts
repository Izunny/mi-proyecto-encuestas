import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesitamos esto para *ngIf y el pipe async
import { Observable } from 'rxjs';
import { AlertService, AlertConfig } from '../../services/alert.service';

@Component({
  selector: 'app-modal-alert',
  standalone: true,
  imports: [CommonModule], // ¡Importante para *ngIf y AsyncPipe!
  templateUrl: './modal-alert.component.html',
  styleUrls: ['./modal-alert.component.scss']
})
export class ModalAlertComponent implements OnInit {
  // Esta variable es un "chorro de datos" que viene del servicio.
  // Usamos '!' para decirle a TypeScript que la inicializaremos en ngOnInit.
  alert$!: Observable<AlertConfig | null>;

  constructor(private alertService: AlertService) { }

  ngOnInit(): void {
    // Sintonizamos nuestra radio con la del servicio.
    // El 'async' pipe en el HTML se encargará de suscribirse/desuscribirse.
    this.alert$ = this.alertService.alertState$;
  }

  // Función para cerrar el modal
  close(): void {
    this.alertService.hide();
  }

  // Función para ejecutar la acción de confirmación Y cerrar el modal
  confirm(alert: AlertConfig): void {
    // Primero, revisamos si existe una función 'onConfirm'
    if (alert.onConfirm) {
      // Si existe, la ejecutamos
      alert.onConfirm();
    }
    // Después de ejecutarla, cerramos el modal
    this.close();
  }
}