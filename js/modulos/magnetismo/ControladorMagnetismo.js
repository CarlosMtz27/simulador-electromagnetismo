import { ModeloMagnetismo } from './ModeloMagnetismo.js';
import { VistaMagnetismo } from './VistaMagnetismo.js';
import { RenderizadorMagnetismo } from './renderizadores/Magnetismo.js';
import { RenderizadorBomba } from './renderizadores/Bomba.js';

export class ControladorMagnetismo {
    constructor(contenedor) {
        this.modelo = new ModeloMagnetismo();
        this.vista = new VistaMagnetismo(contenedor);
        this.isDragging = false;
        
        this.tiempoAnterior = performance.now();
        this.anguloMotor = 0;
        
        this.iniciar();
    }

    iniciar() {
        // Inicializar posición del imán
        this.modelo.setImanPos(this.vista.canvas.width * 0.7, this.vista.canvas.height / 2);

        // Listeners de UI
        this.vista.sliderCorriente.addEventListener('input', (e) => this.modelo.setCorriente(e.target.value));
        this.vista.sliderFuerzaIman.addEventListener('input', (e) => this.modelo.setFuerzaIman(e.target.value));
        this.vista.btnInvertir.addEventListener('click', () => this.modelo.invertirIman());
        this.vista.checkVectores.addEventListener('change', (e) => this.modelo.mostrarVectores = e.target.checked);
        this.vista.checkCampo.addEventListener('change', (e) => this.modelo.mostrarCampo = e.target.checked);

        // Listeners de UI Bomba
        this.vista.btnModoMundo.addEventListener('click', () => {
            const nuevoModo = this.modelo.modoVista === 'diagrama' ? 'mundoReal' : 'diagrama';
            this.modelo.setModoVista(nuevoModo);
        });
        this.vista.sliderVoltajeBomba.addEventListener('input', (e) => this.modelo.setVoltajeBomba(e.target.value));
        this.vista.btnZoom.addEventListener('click', () => this.modelo.toggleZoom());
        this.vista.btnRepararBomba.addEventListener('click', () => {
            this.modelo.repararBomba();
            this.vista.sliderVoltajeBomba.value = 0;
        });

        // Listeners de Mouse para el Imán
        this.vista.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.isDragging = false);

        this.loop(performance.now());
        new ResizeObserver(() => {
            this.vista.ajustarCanvas();
        }).observe(this.vista.canvas.parentElement);
    }

    onMouseDown(e) {
        if (this.modelo.modoVista !== 'diagrama') return;
        const rect = this.vista.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Comprobar si clicamos sobre el imán
        const dx = mx - this.modelo.imanPos.x;
        const dy = my - this.modelo.imanPos.y;
        if (Math.abs(dx) < 60 && Math.abs(dy) < 30) {
            this.isDragging = true;
        }
    }

    onMouseMove(e) {
        const rect = this.vista.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        if (this.modelo.modoVista === 'diagrama') {
            if (!this.isDragging) return;
            // Limitar movimiento al canvas
            const x = Math.max(50, Math.min(this.vista.canvas.width - 50, mx));
            const y = Math.max(50, Math.min(this.vista.canvas.height - 50, my));
            this.modelo.setImanPos(x, y);
        } else if (this.modelo.modoVista === 'mundoReal' && !this.modelo.zoomActivo) {
            const w = this.vista.canvas.width;
            const h = this.vista.canvas.height;
            const xMotor = w * 0.3;
            const yBase = h * 0.8;
            
            // Si el puntero del mouse está sobre la estructura del motor
            if (Math.hypot(mx - xMotor, my - yBase) < 80) {
                this.vista.mostrarBotonZoom(xMotor, yBase, w, h);
            } else {
                this.vista.ocultarBotonZoom();
            }
        }
    }

    loop(tiempoActual) {
        if (!tiempoActual) tiempoActual = performance.now();
        const dt = (tiempoActual - this.tiempoAnterior) / 1000;
        this.tiempoAnterior = tiempoActual;
        
        const dtSeguro = Math.min(dt, 0.1); // Límite para evitar explosiones de física
        this.modelo.actualizarFisica(dtSeguro);
        this.anguloMotor += (this.modelo.rpm * 360 / 60) * dtSeguro;
        
        this.vista.actualizarUI(this.modelo);
        
        if (this.modelo.modoVista === 'diagrama') {
            RenderizadorMagnetismo.dibujar(this.vista.ctx, this.vista.canvas.width, this.vista.canvas.height, this.modelo);
        } else {
            RenderizadorBomba.dibujar(this.vista.ctx, this.vista.canvas.width, this.vista.canvas.height, this.modelo, this.anguloMotor, this.vista.particulasAgua, dtSeguro);
        }
        
        requestAnimationFrame((t) => this.loop(t));
    }
}