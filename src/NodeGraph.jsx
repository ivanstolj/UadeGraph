import React, { Component } from 'react';
import Node from './Node'; // Importa el componente Node desde el archivo Node.js
import cytoscape from 'cytoscape'; // Importa la librería Cytoscape
import './Graph.css'; // Importa el archivo CSS para estilos personalizados

class NodeGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [], // Inicializa el estado para almacenar los nodos del grafo
      progress: 0, // Agrega el estado para el progreso
      average:0,
      legajo: '', // Agrega el estado para el legajo
      notas: {}, // Agrega un estado para almacenar las notas asociadas a los legajos
    };
  }

  handleLegajoChange = (event) => {
    const newLegajo = event.target.value;
    const notas = this.state.notas;
    const newNodes = notas[newLegajo] || this.state.nodes.map((n) => ({ ...n, nota: -2 }));
    this.setState({ legajo: newLegajo, nodes: newNodes });
  };
  
  

  calculateProgress(nodes) {
    const totalMaterias = nodes.length;
    const aprobadas = nodes.filter((n) => n.nota >= 4).length;
    return (aprobadas / totalMaterias) * 100;
  }

  calculateAverage(nodes) {
    const validNotes = nodes.filter((n) => n.nota !== -2);
    if (validNotes.length === 0) {
      return 0;
    }
    const total = validNotes.reduce((sum, n) => sum + n.nota, 0);
    return total / validNotes.length;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.legajo !== this.state.legajo) {
      const notas = this.state.notas;
      const newNodes = notas[this.state.legajo] || this.state.nodes.map((n) => ({ ...n, nota: -2 }));
      this.setState({ nodes: newNodes });
      this.renderGraph();
    }
  }
  
  
  
  async componentDidMount() {

    const notasFromStorage = JSON.parse(localStorage.getItem('notas')) || {};
    this.setState({ notas: notasFromStorage });
    const node = new Node(); // Crea una instancia del componente Node
    await node.loadFromJSON('/UadeGraph/src/carreras/Informatica.json'); // Carga los datos de nodos desde un archivo JSON
    const nodes = node.getAllNodes(); // Obtiene todos los nodos cargados
    const progress = this.calculateProgress(nodes); // Calcula el progreso
    const average = this.calculateAverage(nodes); // Calcula el promedio
    this.setState({ nodes,progress,average }, () => {
      this.renderGraph(); // Después de actualizar el estado, renderiza el grafo
    });
  }

  

  generateEdges(nodes) {
    const edges = []; // Inicializa un arreglo para almacenar las aristas del grafo

    nodes.forEach((node) => {
      if (node.correlativa && Array.isArray(node.correlativa)) {
        node.correlativa.forEach((correlativaId) => {
          const targetNode = nodes.find((n) => n.id === correlativaId);

          if (targetNode) {
            edges.push({ data: {source: node.id, target: targetNode.id } }); // Agrega una arista entre nodos correlativos
          }
        });
      }
    });

    return edges; // Devuelve el arreglo de aristas generadas
  }

  handleNodeClick(node) {
    const newNodes = this.state.nodes.map((n) =>
      n.id === node.id ? { ...n, nota: parseInt(prompt('Ingrese la nota:')) || -2 } : n
    );
    const progress = this.calculateProgress(newNodes); // Calcula el nuevo progreso
    const average = this.calculateAverage(newNodes); // Calcula el nuevo promedio

    this.setState({ nodes: newNodes, progress,average }, () => {
      this.renderGraph(); // Vuelve a renderizar el grafo después de cambiar la nota
    });

    // Actualiza el estado de las notas asociadas al legajo
    const { legajo, notas } = this.state;
    const updatedNotas = { ...notas, [legajo]: newNodes };
    this.setState({ notas: updatedNotas });

    
    // Guarda las notas actualizadas en el almacenamiento local
    localStorage.setItem('notas', JSON.stringify(updatedNotas));
  }

    // Método para guardar las notas en el almacenamiento local
    handleGuardarClick = () => {
      const { legajo, nodes, notas } = this.state;
      const updatedNotas = { ...notas, [legajo]: nodes };
      this.setState({ notas: updatedNotas });
      localStorage.setItem('notas', JSON.stringify(updatedNotas));
      alert('Notas guardadas exitosamente.');
    };
    
  

  renderGraph() {
    const { nodes } = this.state; // Obtiene los nodos del estado
    const elements = [
      ...nodes.map((node, index) => ({
        data: { 
        id: node.id,
        materia: node.materia.replace(/ /g, '\n'), // Reemplaza espacios con saltos de línea
        nota: node.nota},
        position: { x: node.nivel * 200, y: (index % 5) * (window.innerHeight / 5) },
      })),
      ...this.generateEdges(nodes),
    ]; // Genera los elementos (nodos y aristas) para el grafo


    const cy = cytoscape({
      container: document.getElementById('graph-id'), // Define el contenedor donde se renderizará el grafo
      elements, // Define los elementos del grafo
      style: [
        {
          selector: 'node', // Estilos para los nodos
          style: {
            'background-color': (node) => (node.data('nota') >= 4 ? 'green' : 'orange'), // Cambia el color del fondo según la nota
            width: '100px',
            height: '50px',
            'font-size': '14px',
            'font-weight': 'normal',
            'text-wrap': 'wrap',
            shape: 'roundrectangle', // Usar la forma 'roundrectangle' para bordes curvos
            content: 'data(materia)', // Mostrar el valor de la etiqueta del nodo
            'white-space': 'pre-line', // Agrega esta línea para permitir saltos de línea
            'text-valign': 'center',
            'text-halign': 'center',
          },
        },
      
        {
          selector: 'edge', // Estilos para las aristas
          style: {
            width: 2,
            'line-color': 'gray',
            'source-arrow-color': 'lightblue',
            'source-arrow-shape': 'triangle',
            'curve-style': 'unbundled-bezier',
            'control-point-step-size': 30, // Ajusta este valor para controlar la curvatura
          },
        },
      ],
      
      layout: {
        name: 'preset', // Disposición predefinida para la posición de los elementos
      },
      
    }); // Crea una instancia de Cytoscape y configura el grafo
    // Actualizar estilo de los nodos después de inicializar el grafo
  cy.batch(() => {
    cy.nodes().forEach((node) => {
      const nota = node.data('nota');
      const backgroundColor = nota >= 4 ? 'green' : 'orange';
      node.style('background-color', backgroundColor);
    });
  });
  
  cy.nodes().on('click', (event) => {
    this.handleNodeClick(event.target.data());
  });
}
  render() {
    const { progress , average, legajo} = this.state;
    return (
      <div className="container">
      <div style={{ width: '100%', height: '100vh' }}>
      <div className="header">
        <h1>UADE</h1>
        <input
          className="legajo-input"
          type="text"
          placeholder="Ingrese su legajo"
          value={legajo}
          onChange={this.handleLegajoChange}
        />
        {legajo && <span className="tic">✔</span>}
        <button onClick={this.handleGuardarClick}>Guardar</button>
        <div className="average-header">Promedio: {average.toFixed(2)}</div>
      </div>        
      <div id="graph-id" className="graph-container" style={{ width: '100vw', height: '100vh', margin: 'auto' }}></div>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">{`${progress.toFixed(2)}%`}</div>
        </div>
      </div>
      </div>

    ); // Renderiza el componente del grafo con un título y un contenedor
  }
}

export default NodeGraph; // Exporta el componente NodeGraph
