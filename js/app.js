// js/app.js
import { ControladorOhm } from './modulos/ley-ohm/ControladorOhm.js';
import { ControladorCircuitos } from './modulos/circuitos/ControladorCircuitos.js';
import { ControladorMagnetismo } from './modulos/magnetismo/ControladorMagnetismo.js';

/**
 * Clase AppRouter
 * Se encarga de gestionar la navegacion entre los diferentes modulos de simulacion.
 * Actua como el nucleo principal que monta y desmonta los controladores para evitar
 * fugas de memoria entre las transiciones.
 */
class AppRouter {
    /**
     * Inicializa las referencias principales del DOM y el estado del controlador activo.
     */
    constructor() {
        this.rootElement = document.getElementById('app-root');
        this.navButtons = document.querySelectorAll('.tab-btn');
        this.currentController = null;
        
        this.init();
    }

    /**
     * Configura los eventos de la barra de navegacion principal.
     */
    init() {
        // Recorre los botones del menu y les asigna la funcion de cambiar de pantalla
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetModule = e.target.getAttribute('data-target');
                this.navigate(targetModule, e.target);
            });
        });

        // Carga el modulo inicial por defecto al abrir la aplicacion
        this.navigate('ohm', this.navButtons[0]);
    }

    /**
     * Realiza la transicion entre modulos, limpiando el anterior e instanciando el nuevo.
     * @param {string} moduleName - Identificador del modulo a cargar.
     * @param {HTMLElement} activeBtn - Referencia al boton presionado para actualizar su estilo.
     */
    navigate(moduleName, activeBtn) {
        // Actualiza la interfaz visual resaltando el boton activo
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');

        // Limpia la memoria destruyendo el ciclo de animacion del controlador previo
        if (this.currentController && typeof this.currentController.destruir === 'function') {
            this.currentController.destruir();
        }
        
        // Vacia el contenedor HTML principal para recibir la nueva vista
        this.rootElement.innerHTML = '';

        // Evalua el modulo solicitado y arranca su controlador respectivo.
        // Si deseas agregar un nuevo modulo, debes anadir su caso (case) en este bloque.
        switch (moduleName) {
            case 'ohm':
                this.currentController = new ControladorOhm(this.rootElement);
                break;
            case 'circuits':
                this.currentController = new ControladorCircuitos(this.rootElement); 
                break;
            case 'motor':
                this.currentController = new ControladorMagnetismo(this.rootElement);
              break;
        }
    }
}

// Arranca el enrutador principal una vez que la estructura HTML esta lista
document.addEventListener('DOMContentLoaded', () => {
    new AppRouter();
});