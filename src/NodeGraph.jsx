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
      showNoteDialog: false,
      selectedNode: null,
      selectedNodeId: null,
      selectedCareer: 'Informatica', // Valor inicial para la carrera seleccionada
    };
  }
  handleOpenNoteDialog = (node) => {
    this.setState({ showNoteDialog: true, selectedNode: node }, () => {
      if (this.noteInput) {
        this.noteInput.focus(); // Focus the input element
      }
    });
  };

  // Método para cargar los datos según la carrera seleccionada
  async loadCareerData(career) {
    const node = new Node();
    await node.loadFromJSON(`/UadeGraph/src/carreras/${career}.json`);
    const nodes = node.getAllNodes();
    const progress = this.calculateProgress(nodes);
    const average = this.calculateAverage(nodes);
    this.setState({ nodes, progress, average }, () => {
      this.renderGraph();
    });
  }

  // Manejador para cambiar la carrera seleccionada
  handleCareerChange = (event) => {
    const newCareer = event.target.value;
    this.setState({ selectedCareer: newCareer }, () => {
      this.loadCareerData(newCareer);
    });
  }
  

  handleCloseNoteDialog = () => {
    this.setState({ showNoteDialog: false, selectedNode: null });
  };
  

  handleNoteInput = (event) => {
    const { selectedNode } = this.state;
    const newNodes = this.state.nodes.map((n) =>
      n.id === selectedNode.id ? { ...n, nota: parseInt(event.target.value) || -2 } : n
    );

    if (event.target.value === '100') {
      newNodes.find((n) => n.id === selectedNode.id).nota = 100;
    }

    const progress = this.calculateProgress(newNodes);
    const average = this.calculateAverage(newNodes, newNodes.filter((n) => n.nota !== 100));
    
    this.setState({ nodes: newNodes, progress, average }, () => {
      this.renderGraph();
    });

    const { legajo, notas } = this.state;
    const updatedNotas = { ...notas, [legajo]: newNodes };
    this.setState({ notas: updatedNotas });
    localStorage.setItem('notas', JSON.stringify(updatedNotas));
  };

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
    const validNotes = nodes.filter((n) => n.nota !== -2 && n.nota !== 100);
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
      // Recalculate progress and average when notes are updated
    if (prevState.nodes !== this.state.nodes) {
      const progress = this.calculateProgress(this.state.nodes);
      const average = this.calculateAverage(this.state.nodes);
      this.setState({ progress, average });
    }
  }
  
  
  
  async componentDidMount() {

    const notasFromStorage = JSON.parse(localStorage.getItem('notas')) || {};
    this.setState({ notas: notasFromStorage });
    const node = new Node(); // Crea una instancia del componente Node
    this.loadCareerData(this.state.selectedCareer); // Cargar los datos iniciales basados en la carrera seleccionada
    const nodes = node.getAllNodes(); // Obtiene todos los nodos cargados
    const progress = this.calculateProgress(nodes); // Calcula el progreso
    const average = this.calculateAverage(nodes); // Calcula el promedio
    this.setState({ nodes,progress,average }, () => {
      this.renderGraph(); // Después de actualizar el estado, renderiza el grafo
    });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('click', this.handleOutsideClick);
  }
  handleOutsideClick = (event) => {
    if (this.noteDialogRef && !this.noteDialogRef.contains(event.target)) {
      this.handleCloseNoteDialog();
    }
  };
  handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.handleCloseNoteDialog(); // Call the method to close the note dialog
    }
  };

  componentWillUnmount() {
    // Remove the event listener when the component unmounts
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('click', this.handleOutsideClick);

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
  this.setState({ selectedNodeId: node.id });
  this.handleOpenNoteDialog(node);
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
      elements,
      style: [
        {
          selector: 'node', // Estilos para los nodos
          style: {
            width: '100px',
            height: '50px',
            'font-size': '14px',
            'font-weight': 'normal',
            'text-wrap': 'wrap',
            shape: 'roundrectangle', // Usar la forma 'roundrectangle' para bordes curvos
            content: 'data(materia)', // Mostrar el valor de la etiqueta del nodo
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
    function getNodeBackgroundColor(nodeId, nota) {
      if (nota >= 4) {
        return '#38E54D';
      } else if (nodeId.startsWith('3.4')) {
        return '#A1CCD1';
      } else if (nodeId.startsWith('3.1')) {
        return '#E9B384';
      } else if (nodeId.startsWith('3.2')) {
        return '#F4F2DE';
      } else if (nodeId.startsWith('3.3')) {
        return '#7C9D96';
      } else if (nodeId.startsWith('2.1')) {
        return '#D8D9DA';
      } else if (nodeId.startsWith('2.3')) {
        return '#FFC6AC';
      } else {
        return '#765827';
      }
    }
  
    cy.batch(() => {
      cy.nodes().forEach((node) => {
        const nota = node.data('nota');
        const nodeId = node.data('id');
        const backgroundColor = getNodeBackgroundColor(nodeId, nota);
        node.style('background-color', backgroundColor);
  
        node.on('mouseover', () => {
          cy.edges().forEach((edge) => {
            if (edge.source().id() === nodeId || edge.target().id() === nodeId) {
              edge.style('width', 4);
            } else {
              edge.style('opacity', 0.2);
            }
          });
        });
  
        node.on('mouseout', () => {
          cy.edges().forEach((edge) => {
            edge.style('width', 2);
            edge.style('opacity', 1);
          });
        });
      });
    });

  cy.nodes().on('click', (event) => {
    this.handleNodeClick(event.target.data());
  });
}
  render() {
    const { progress , average, legajo, nodes,showNoteDialog ,selectedCareer} = this.state;
    const aprobadas = nodes.filter((n) => n.nota >= 4).length; // Calcula la cantidad de materias aprobadas

    return (
      <div className="container">
      <div style={{ width: '100%', height: '100vh' }}>
      <div className="header">
        <h1>UADE</h1>
        <select value={selectedCareer} onChange={this.handleCareerChange}>
              <option value="Informatica">Informatica</option>
              <option value="Industrial">Industrial</option>
              <option value="Sistemas">Sistemas</option>
            </select>
        <input
          className="legajo-input"
          type="text"
          placeholder="Ingrese su legajo"
          value={legajo}
          onChange={this.handleLegajoChange}
        />
        {legajo && <span className="tic">✔</span>}
        <button onClick={this.handleGuardarClick}>Guardar</button>
        <div className="average-header">
            Promedio: {average.toFixed(2)} - {aprobadas} de {nodes.length}
        </div>
      </div>        
      <div id="graph-id" className="graph-container" style={{ width: '100vw', height: '100vh', margin: 'auto' }}></div>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">{`${progress.toFixed(2)}%`}</div>
        </div>

        {showNoteDialog && (
        <div className="note-dialog">
          <input
            ref={(input) => (this.noteInput = input)} // Create a ref to the input element
            type="number"
            min="0"
            max="10"
            placeholder="Ingrese la nota (0-10)"
            onChange={this.handleNoteInput}
          />
          <button onClick={this.handleCloseNoteDialog}>Cerrar</button>
          <button onClick={() => this.handleNoteInput({ target: { value: '100' } })}>Equivalencia</button>
        </div>
      )}
      </div>
      </div>

    ); // Renderiza el componente del grafo con un título y un contenedor
  }
}

export default NodeGraph; // Exporta el componente NodeGraph
