// src/app/interfaces/encuesta.interface.ts
export interface Encuesta {
  idencuesta: number;
  nombre: string;
  descripcion: string;
  nombreU: string;
  fecha: string; // o Date
  activo: 'S' | 'N';
}