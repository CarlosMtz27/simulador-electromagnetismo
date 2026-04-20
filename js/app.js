// js/app.js
import { ControladorOhm } from './modulos/ley-ohm/ControladorOhm.js';
import { ControladorCircuitos } from './modulos/circuitos/ControladorCircuitos.js';
import { ControladorMagnetismo } from './modulos/magnetismo/ControladorMagnetismo.js';

class AppRouter {
    constructor() {
        this.rootElement = document.getElementById('app-root');
        this.navButtons = document.querySelectorAll('.tab-btn');
        this.currentController = null;
        
        this.init();
    }

    init() {
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetModule = e.target.getAttribute('data-target');
                this.navigate(targetModule, e.target);
            });
        });

        // Cargar el módulo inicial por defecto
        this.navigate('ohm', this.navButtons[0]);
    }

    navigate(moduleName, activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');

        // Limpiar memoria si existe un controlador previo
        if (this.currentController && typeof this.currentController.destruir === 'function') {
            this.currentController.destruir();
        }
        this.rootElement.innerHTML = '';

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

document.addEventListener('DOMContentLoaded', () => {
    new AppRouter();
});