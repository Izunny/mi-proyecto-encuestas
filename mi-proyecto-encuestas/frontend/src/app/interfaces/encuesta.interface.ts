export interface Encuesta {
  idencuesta: number;
  nombre: string;
  descripcion: string;
  username: string; 
  fecha: string;
  activo: 'S' | 'N';
  responseCount: number;
}