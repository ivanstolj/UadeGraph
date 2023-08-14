
class Node {
    constructor() {
      this.data = []; // Almacena los datos del JSON
    }
  
    async loadFromJSON(jsonPath) {
      try {
        const response = await fetch(jsonPath);
        const jsonData = await response.json();
        this.data = jsonData.map(item => ({
          id: item.id,
          materia: item.materia,
          nivel: item.nivel,
          correlativa: item.correlativa,
          nota:-2,
        }));
      } catch (error) {
        console.error('Error al cargar los datos del JSON:', error);
      }
    }
  
    getAllNodes() {
      return this.data;
    }
  }
  
  export default Node;
  