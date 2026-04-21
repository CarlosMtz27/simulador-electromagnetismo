import { ModeloCircuitos } from './ModeloCircuitos.js';
import { VistaCircuitos } from './VistaCircuitos.js';

export class ControladorCircuitos {
    constructor(contenedor) {
        // instanciamos nuestro motor matematico y la capa visual para unirlos
        this.modelo = new ModeloCircuitos();
        this.vista = new VistaCircuitos(contenedor);
        this.idAnimacion = null;
        this.iniciar();
    }

    iniciar() {
        // escuchamos los clics en los botones principales para decirle al modelo que cambie de topologia
        this.vista.btnSerie.addEventListener('click', () => this.modelo.setTopologia('serie'));
        this.vista.btnParalelo.addEventListener('click', () => this.modelo.setTopologia('paralelo'));
        this.vista.btnMixto.addEventListener('click', () => this.modelo.setTopologia('mixto'));
        
        // enlazamos los deslizadores para capturar inmediatamente cualquier ajuste del usuario
        this.vista.sliderSerie.addEventListener('input', (e) => this.modelo.setNumSerie(e.target.value));
        this.vista.sliderParalelo.addEventListener('input', (e) => this.modelo.setNumParalelo(e.target.value));
        this.vista.sliderVoltaje.addEventListener('input', (e) => this.modelo.setVoltaje(e.target.value));

        this.vista.panelValoresResistencias.addEventListener('input', (e) => {
            if (e.target.classList.contains('input-res')) {
                this.modelo.setResistenciaIndividual(e.target.dataset.index, e.target.value);
            }
        });

        // asignamos acciones a cada boton del constructor de redes mixtas
        this.vista.btnAddSTop.addEventListener('click', () => this.modelo.agregarComponenteMixto('S_top'));
        this.vista.btnAddSBot.addEventListener('click', () => this.modelo.agregarComponenteMixto('S_bot'));
        this.vista.btnAddP.addEventListener('click', () => this.modelo.agregarComponenteMixto('P'));
        this.vista.btnUndo.addEventListener('click', () => this.modelo.eliminarComponenteMixto());

        // activamos el boton que nos transporta desde la vista tecnica hacia la casa virtual
        this.vista.btnModoMundo.addEventListener('click', () => {
            const nuevoModo = this.modelo.modoVista === 'diagrama' ? 'mundoReal' : 'diagrama';
            this.modelo.setModoVista(nuevoModo);
        });

        // atrapamos la peticion de causar un daño termico desde el panel
        this.vista.btnFalla.addEventListener('click', () => {
            const index = parseInt(this.vista.selectFalla.value);
            this.modelo.simularFalla(index);
        });
        
        // permitimos cambiar el acomodo del circuito mixto cuando visualizamos la casa
        this.vista.btnToggleMixto.addEventListener('click', () => {
            const nuevoOrden = this.modelo.ordenMixtoMundoReal === 'serie_primero' ? 'paralelo_primero' : 'serie_primero';
            this.modelo.setOrdenMixtoMundoReal(nuevoOrden);
        });

        this.vista.btnReparar.addEventListener('click', () => {
            this.modelo.reparar();
        });

        // definimos lo que debe ocurrir en la pantalla cada que los calculos internos se actualizan
        this.modelo.alActualizar = () => { this.vista.actualizarUI(this.modelo); };
        this.modelo.calcularEstado();
        this.loop();
        new ResizeObserver(() => {
            this.vista.ajustarCanvas();
        }).observe(this.vista.canvas.parentElement);
    }

    loop() {
        // mantenemos vivos los electrones y graficos usando un ciclo que repinta en cada frame
        this.vista.dibujar(this.modelo);
        this.idAnimacion = requestAnimationFrame(() => this.loop());
    }

    destruir() {
        // pausamos toda la logica y cancelamos animaciones si nos salimos del apartado
        if (this.idAnimacion) cancelAnimationFrame(this.idAnimacion);
        this.modelo.alActualizar = null;
    }
}