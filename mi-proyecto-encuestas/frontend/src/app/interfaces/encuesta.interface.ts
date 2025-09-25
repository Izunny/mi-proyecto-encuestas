
export interface Encuesta {
  idencuesta: number;
  nombre: string;
  descripcion: string;
  nombreU: string;
  fecha: string; 
  activo: 'S' | 'N';
}