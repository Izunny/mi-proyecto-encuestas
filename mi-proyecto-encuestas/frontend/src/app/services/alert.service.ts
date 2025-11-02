import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

//  plano de nuestra alerta
export interface AlertConfig {
  message: string;
  type: 'success' | 'error' | 'confirm'; // Podemos tener diferentes tipos
  onConfirm?: () => void; // Función opcional si es una confirmación
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
 
  private alertSubject = new Subject<AlertConfig | null>();
  
  
  public alertState$ = this.alertSubject.asObservable();

  constructor() { }

  /**
   * Muestra una alerta simple de éxito o error.
   * @param message El mensaje a mostrar.
   * @param type El tipo de alerta ('success' o 'error').
   */
  show(message: string, type: 'success' | 'error' = 'success'): void {
    // Transmitimos la nueva alerta a todos los que estén escuchando
    this.alertSubject.next({ message, type });
  }

  /**
   * Muestra una alerta de confirmación con botones "Aceptar" y "Cancelar".
   * @param message El mensaje de la pregunta (ej: "¿Estás seguro?").
   * @param onConfirm La función que se debe ejecutar SÓLO si el usuario hace clic en "Aceptar".
   */
  confirm(message: string, onConfirm: () => void): void {
    this.alertSubject.next({ 
      message, 
      type: 'confirm', 
      onConfirm // Pasamos la función de confirmación
    });
  }

  /**
   * Oculta cualquier alerta que esté visible.
   */
  hide(): void {
    // Transmitimos 'null' para indicar que no hay ninguna alerta que mostrar
    this.alertSubject.next(null);
  }
}