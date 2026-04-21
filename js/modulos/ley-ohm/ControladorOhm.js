import { ModeloOhm } from './ModeloOhm.js';
import { VistaOhm } from './VistaOhm.js';

export class ControladorOhm {
    constructor(contenedor) {
        // unimos nuestro motor matematico de la ley de ohm con nuestra interfaz grafica
        this.modelo = new ModeloOhm();
        this.vista = new VistaOhm(contenedor);
        this.idAnimacion = null;
        this.iniciar();
    }

    iniciar() {
        // escuchamos los movimientos de las barras deslizables para inyectarle los numeros al modelo
        this.vista.sliderV.addEventListener('input', (e) => this.modelo.setVoltaje(e.target.value));
        this.vista.sliderR.addEventListener('input', (e) => this.modelo.setResistencia(e.target.value));
        this.vista.sliderP.addEventListener('input', (e) => this.modelo.setLimitePotencia(e.target.value));
        this.vista.selectCelular.addEventListener('change', (e) => this.modelo.setCelular(e.target.value));
        
        // programamos el boton para saltar del modo laboratorio al modo de prueba de celulares
        this.vista.btnModo.addEventListener('click', () => {
            const nuevo = this.modelo.modoVista === 'diagrama' ? 'celular' : 'diagrama';
            this.modelo.setModoVista(nuevo);
        });

        // enlazamos la funcion que dibuja la pantalla para que se dispare solita cuando algo cambia
        this.modelo.alActualizar = () => { this.vista.actualizarUI(this.modelo); };
        this.modelo.verificarEstado();
        this.loop();
        new ResizeObserver(() => {
            this.vista.ajustarCanvas();
            }).observe(this.vista.canvas.parentElement);
    }

    loop() {
        // creamos un ciclo infinito para animar constantemente los electrones fluyendo
        this.vista.dibujar(this.modelo);
        this.idAnimacion = requestAnimationFrame(() => this.loop());
    }

    destruir() {
        // detenemos todo el motor de animacion en caso de que cerremos este modulo
        if (this.idAnimacion) cancelAnimationFrame(this.idAnimacion);
    }
}