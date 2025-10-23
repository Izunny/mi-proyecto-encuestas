export interface Encuesta {
  idencuesta: number;
  nombre: string;
  descripcion: string;
  username: string; // <-- ESTA ES LA CORRECCIÓN CLAVE
  fecha: string;
  activo: 'S' | 'N';
  responseCount: number;
}