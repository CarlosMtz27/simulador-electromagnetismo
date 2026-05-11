import { ModeloCircuitos } from './ModeloCircuitos.js';
import { VistaCircuitos } from './VistaCircuitos.js';

/**
 * Clase ControladorCircuitos
 * Actuamos como el puente entre la logica matematica (Modelo) y la interfaz grafica (Vista).
 * Nos encargamos de capturar las interacciones del usuario, actualizar el estado
 * y mantener vivo el bucle de animacion.
 */
export class ControladorCircuitos {
    /**
     * Construimos el controlador e inicializamos la simulacion.
     * @param {HTMLElement} contenedor - El contenedor DOM donde inyectaremos la vista.
     */
    constructor(contenedor) {
        // Instanciamos el motor matematico y la capa visual para unirlos
        this.modelo = new ModeloCircuitos();
        this.vista = new VistaCircuitos(contenedor);
        this.idAnimacion = null;
        this.iniciar();
    }

    /**
     * Configuramos todos los eventos (listeners) y arrancamos la simulacion.
     * Si deseamos agregar nuevos controles, deslizadores o botones a la interfaz,
     * este es el lugar donde debemos registrarlos y enlazarlos con el modelo.
     */
    iniciar() {
        // Escuchamos los clics en los botones principales para indicarle al modelo que cambie de topologia
        this.vista.btnSerie.addEventListener('click', () => this.modelo.setTopologia('serie'));
        this.vista.btnParalelo.addEventListener('click', () => this.modelo.setTopologia('paralelo'));
        this.vista.btnMixto.addEventListener('click', () => this.modelo.setTopologia('mixto'));
        
        // Enlazamos los deslizadores para capturar inmediatamente cualquier ajuste que el usuario haga
        this.vista.sliderSerie.addEventListener('input', (e) => this.modelo.setNumSerie(e.target.value));
        this.vista.sliderParalelo.addEventListener('input', (e) => this.modelo.setNumParalelo(e.target.value));

        // Sincronizamos el voltaje
        this.vista.sliderVoltaje.addEventListener('input', (e) => {
            this.modelo.setVoltaje(e.target.value);
            // Actualizamos el input para que refleje el arrastre del slider en tiempo real
            this.vista.inputVoltaje.value = e.target.value;
        });

        this.vista.inputVoltaje.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= 10 && val <= 240) {
                this.modelo.setVoltaje(val);
                // Actualizamos el slider para que refleje el valor tecleado
                this.vista.sliderVoltaje.value = val;
            }
        });

        // Al perder el foco, forzamos a restaurar un valor valido si quedo incompleto o erroneo
        this.vista.inputVoltaje.addEventListener('blur', () => {
            const val = parseFloat(this.vista.inputVoltaje.value);
            if (isNaN(val) || val < 10) {
                this.vista.inputVoltaje.value = this.modelo.voltaje;
            } else {
                const clamped = Math.min(Math.max(val, 10), 240);
                this.modelo.setVoltaje(clamped);
                this.vista.inputVoltaje.value = clamped;
                this.vista.sliderVoltaje.value = clamped;
            }
        });
        //

        // Resistencias individuales en modo Diagrama
        this.vista.panelValoresResistencias.addEventListener('input', (e) => {
            if (e.target.classList.contains('input-res') || e.target.classList.contains('slider-res')) {
                this.modelo.setResistenciaIndividual(e.target.dataset.index, e.target.value);
            }
        });
        //

        // Resistencias individuales en modo Mundo Real
        // Usamos delegacion de eventos sobre el grid para asegurar que siga funcionando 
        // aunque creemos o destruyamos los inputs dinamicamente al cambiar de modo.
        this.vista.gridResistenciasMundo.addEventListener('input', (e) => {
            if (e.target.classList.contains('input-res-mundo')) {
                const index = parseInt(e.target.dataset.index);
                const val   = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                    this.modelo.setResistenciaIndividual(index, val);
                }
            }
        });

        this.vista.gridResistenciasMundo.addEventListener('blur', (e) => {
            if (e.target.classList.contains('input-res-mundo')) {
                const val = parseFloat(e.target.value);
                if (isNaN(val) || val <= 0) {
                    // Si el usuario dejo un valor invalido, restauramos la resistencia actual almacenada
                    e.target.value = this.modelo.resistencias[parseInt(e.target.dataset.index)].toFixed(0);
                }
            }
        }, true); // Usamos capture para atrapar el evento blur en los elementos hijos
        //
        
        // Actualizamos las horas de uso diario para calcular el recibo CFE
        this.vista.inputHorasUso.addEventListener('input', (e) => {
            this.modelo.setHorasUso(e.target.value);
        });

        // Asignamos acciones a cada boton del panel que permite construir redes mixtas
        this.vista.btnAddSTop.addEventListener('click', () => this.modelo.agregarComponenteMixto('S_top'));
        this.vista.btnAddSBot.addEventListener('click', () => this.modelo.agregarComponenteMixto('S_bot'));
        this.vista.btnAddP.addEventListener('click', () => this.modelo.agregarComponenteMixto('P'));
        this.vista.btnUndo.addEventListener('click', () => this.modelo.eliminarComponenteMixto());

        // Activamos el boton que transporta desde la vista tecnica hacia la vista realista de la casa
        this.vista.btnModoMundo.addEventListener('click', () => {
            const nuevoModo = this.modelo.modoVista === 'diagrama' ? 'mundoReal' : 'diagrama';
            this.modelo.setModoVista(nuevoModo);
        });

        // Atrapamos la peticion del usuario de causar un dano termico o fundir un foco
        this.vista.btnFalla.addEventListener('click', () => {
            const index = parseInt(this.vista.selectFalla.value);
            this.modelo.simularFalla(index);
        });
        
        // Permitimos cambiar el orden del circuito mixto (serie primero o paralelo primero) en la casa
        this.vista.btnToggleMixto.addEventListener('click', () => {
            const nuevoOrden = this.modelo.ordenMixtoMundoReal === 'serie_primero' ? 'paralelo_primero' : 'serie_primero';
            this.modelo.setOrdenMixtoMundoReal(nuevoOrden);
        });

        // Nos encargamos de reparar la falla cuando el usuario presiona el boton
        this.vista.btnReparar.addEventListener('click', () => {
            this.modelo.reparar();
        });

        // Definimos lo que debe ejecutarse en la pantalla cada vez que el modelo termine de hacer calculos
        this.modelo.alActualizar = () => { this.vista.actualizarUI(this.modelo); };
        
        // Damos el empuje inicial
        this.modelo.calcularEstado();
        this.loop();
        
        // Nos mantenemos observando cambios de tamano en el contenedor para ajustar el canvas
        new ResizeObserver(() => {
            this.vista.ajustarCanvas();
        }).observe(this.vista.canvas.parentElement);
    }

    /**
     * Mantenemos vivos los electrones y graficos usando un ciclo infinito (Game Loop).
     * Le pedimos a la vista que se redibuje y programamos el proximo frame.
     */
    loop() {
        this.vista.dibujar(this.modelo);
        this.idAnimacion = requestAnimationFrame(() => this.loop());
    }

    /**
     * Pausamos toda la logica y cancelamos las animaciones al salir del modulo de circuitos.
     * Esta funcion es vital para evitar fugas de memoria (Memory Leaks).
     */
    destruir() {
        if (this.idAnimacion) cancelAnimationFrame(this.idAnimacion);
        this.modelo.alActualizar = null;
    }
}