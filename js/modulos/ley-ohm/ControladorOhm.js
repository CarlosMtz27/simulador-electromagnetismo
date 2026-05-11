import { ModeloOhm } from './ModeloOhm.js';
import { VistaOhm } from './VistaOhm.js';

/**
 * Clase ControladorOhm
 * Actuamos como el intermediario entre la logica (Modelo) y la interfaz (Vista)
 * para el modulo de la Ley de Ohm.
 */
export class ControladorOhm {
    /**
     * Vinculamos el modelo y la vista, e iniciamos la simulacion.
     * @param {HTMLElement} contenedor - Contenedor DOM para la aplicacion.
     */
    constructor(contenedor) {
        // Unimos nuestro motor matematico de la Ley de Ohm con nuestra interfaz grafica
        this.modelo = new ModeloOhm();
        this.vista = new VistaOhm(contenedor);
        this.idAnimacion = null;
        this.iniciar();
    }

    /**
     * Configuramos todos los eventos y atajos de interaccion del usuario.
     */
    iniciar() {
        // Escuchamos los movimientos de las barras deslizables para inyectarle los numeros al modelo
        this.vista.sliderV.addEventListener('input', (e) => this.modelo.setVoltaje(e.target.value));
        this.vista.sliderR.addEventListener('input', (e) => this.modelo.setResistencia(e.target.value));
        this.vista.sliderP.addEventListener('input', (e) => this.modelo.setLimitePotencia(e.target.value));
        this.vista.selectCelular.addEventListener('change', (e) => this.modelo.setCelular(e.target.value));
        
        // Vinculamos las cajas de texto numerico para que actualicen el modelo y el slider en tiempo real
        this.vista.inputV.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) this.modelo.setVoltaje(val);
        });
        this.vista.inputR.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) this.modelo.setResistencia(val);
        });
        this.vista.inputP.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) this.modelo.setLimitePotencia(val);
        });

        // Permitimos que al dar "Enter" o salir del foco se revalide y limpie la caja si quedo vacia
        const confirmarInput = (e) => {
            if (e.key === 'Enter') {
                e.target.blur(); 
            } else if (e.type === 'blur') {
                this.vista.actualizarUI(this.modelo); 
            }
        };
        ['keydown', 'blur'].forEach(evento => {
            this.vista.inputV.addEventListener(evento, confirmarInput);
            this.vista.inputR.addEventListener(evento, confirmarInput);
            this.vista.inputP.addEventListener(evento, confirmarInput);
        });

        // Programamos el boton para saltar del modo laboratorio al modo de prueba de celulares
        this.vista.btnModo.addEventListener('click', () => {
            const nuevo = this.modelo.modoVista === 'diagrama' ? 'celular' : 'diagrama';
            this.modelo.setModoVista(nuevo);
        });

        // Enlazamos la funcion que dibuja la pantalla para que se dispare sola cuando algo cambia
        this.modelo.alActualizar = () => { this.vista.actualizarUI(this.modelo); };
        this.modelo.verificarEstado();
        this.loop();
        new ResizeObserver(() => {
            this.vista.ajustarCanvas();
            }).observe(this.vista.canvas.parentElement);
    }

    /**
     * Mantenemos activo el ciclo de dibujo para animar el circuito.
     */
    loop() {
        // Creamos un ciclo infinito para animar constantemente los electrones fluyendo
        this.vista.dibujar(this.modelo);
        this.idAnimacion = requestAnimationFrame(() => this.loop());
    }

    /**
     * Detenemos el motor de animacion al salir del modulo.
     */
    destruir() {
        // Detenemos todo el motor de animacion en caso de que cerremos este modulo
        if (this.idAnimacion) cancelAnimationFrame(this.idAnimacion);
    }
}