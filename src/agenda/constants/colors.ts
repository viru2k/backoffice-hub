export const STATUS_COLORS = {
  pending: '#f0ad4e',    // Naranja
  confirmed: '#337ab7',  // Azul (turno normal)
  checked_in: '#5cb85c', // Verde
  in_progress: '#28a745',// Verde más oscuro
  completed: '#5bc0de',  // Celeste
  cancelled: '#777777',  // Gris
  no_show: '#d9534f',    // Rojo (podrías usar este para sobreturno o no_show)
  // Para sobreturno, podrías tener un estado específico o un flag,
  // y asignarle un color, por ejemplo, rojo.
  // Si sobreturno no es un estado, el color se manejaría con otra lógica.
};