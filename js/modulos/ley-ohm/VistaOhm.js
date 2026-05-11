import { DiccionarioOhm } from './DiccionarioOhm.js';
import { RenderizadorCelular } from './renderizadores/Celular.js';
import { RenderizadorDiagrama } from './renderizadores/Diagrama.js';

/**
 * Clase VistaOhm
 * Nos encargamos de construir y actualizar la interfaz grafica para
 * el modulo de la Ley de Ohm.
 */
export class VistaOhm {
    /**
     * Inicializamos la vista y obtenemos las referencias del DOM.
     * @param {HTMLElement} contenedor - El elemento base donde inyectamos la vista.
     */
    constructor(contenedor) {
        // Inyectamos nuestra estructura visual en la pagina y preparamos nuestro lienzo de dibujo
        this.contenedor = contenedor;
        this.renderizarPlantilla();
        this.canvas = document.getElementById('canvas-ohm');
        this.ctx = this.canvas.getContext('2d');
        
        // Capturamos todos los controles interactivos para que el controlador los pueda escuchar
        this.btnModo = document.getElementById('btn-modo-ohm');
        this.panelResistencia = document.getElementById('panel-resistencia');
        this.panelCelular = document.getElementById('panel-celular');
        this.selectCelular = document.getElementById('select-celular');
        this.sliderV = document.getElementById('slider-v');
        this.sliderR = document.getElementById('slider-r');
        this.sliderP = document.getElementById('slider-p');
        this.inputV = document.getElementById('input-v');
        this.inputR = document.getElementById('input-r');
        this.inputP = document.getElementById('input-p');
        this.valI = document.getElementById('val-i');
        this.valPotencia = document.getElementById('val-potencia');
        this.labelP = document.getElementById('label-potencia');
        this.panelPrediccion = document.getElementById('panel-prediccion');
        this.panelAlerta = document.getElementById('panel-alerta');
        this.criticoV = document.getElementById('critico-v');
        this.criticoR = document.getElementById('critico-r');

        // Preparamos nuestros generadores de particulas y la bateria virtual
        this.particulas = Array.from({length: 60}, () => ({ prog: Math.random() * 100 }));
        this.humoObj = { angulo: 0 };
        this.bateriaCelular = 0;
        
        // Cargamos anticipadamente la imagen del cuarto para tenerla lista cuando simulamos la pared
        this.imgFondo = new Image();
        this.imgFondo.src = '../../assets/img/Fondo.jpg'; 
        this.ajustarCanvas();
    }

    /**
     * Inyectamos la estructura HTML del panel de controles y el canvas.
     */
    renderizarPlantilla() {
        // Construimos todo el esquema HTML de manera dinamica incluyendo sliders y textos base
        this.contenedor.innerHTML = `
            <div class="module-container" style="gap: 1rem;">
                <div class="canvas-panel" style="flex-direction: column; position: relative;">
                    <button id="btn-modo-ohm" style="position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem; background: var(--bg-panel-alt); border: 1px solid var(--accent); color: var(--accent); border-radius: 20px; cursor: pointer; z-index: 5; font-weight: bold; transition: 0.3s;">
                        Ver Carga de Celular
                    </button>
                    <canvas id="canvas-ohm"></canvas>
                </div>
                <div class="controls-panel">
                    <h2 class="panel-title">Potencia y Riesgo Térmico</h2>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
                            <span>Voltaje (V)</span>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <input type="number" id="input-v" min="1" max="150" step="0.1" value="12" style="width: 60px; background: var(--bg-base); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 4px; text-align: center;">
                                <span style="color: var(--text-primary); font-weight: bold; width: 15px;">V</span>
                            </div>
                        </label>
                        <input type="range" id="slider-v" min="1" max="150" step="0.1" value="12" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div id="panel-resistencia" style="margin-bottom: 1rem;">
                        <label style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
                            <span>Resistencia (Ω)</span>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <input type="number" id="input-r" min="1" max="500" step="0.1" value="100" style="width: 60px; background: var(--bg-base); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 4px; text-align: center;">
                                <span style="color: var(--text-primary); font-weight: bold; width: 15px;">Ω</span>
                            </div>
                        </label>
                        <input type="range" id="slider-r" min="1" max="500" step="0.1" value="100" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div id="panel-celular" style="margin-bottom: 1rem; display: none;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">
                            <span>Modelo de Celular</span>
                        </label>
                        <select id="select-celular" style="width: 100%; padding: 0.5rem; background: var(--bg-base); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="0">iPhone 5 (Máx 5V - 5W)</option>
                            <option value="1">Galaxy A54 (Máx 9V - 25W)</option>
                            <option value="2">Galaxy S24 (Máx 10V - 45W)</option>
                            <option value="3">Xiaomi 13 Pro (Máx 20V - 120W)</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">
                            <span id="label-potencia">Límite Térmico de R (W)</span>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <input type="number" id="input-p" min="1" max="150" step="0.1" value="50" style="width: 60px; background: var(--bg-base); color: var(--accent); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 4px; text-align: center; font-weight: bold;">
                                <span style="color: var(--accent); font-weight: bold; width: 15px;">W</span>
                            </div>
                        </label>
                        <input type="range" id="slider-p" min="1" max="150" step="0.1" value="50" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                        <div id="panel-prediccion" style="margin-bottom: 10px;">
                            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                <div style="flex: 1; font-size: 0.9rem; color: var(--accent); font-weight: bold; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; text-align: center;">
                                    Corriente (I): <br><span id="val-i" style="font-size: 1.1rem;">0.12</span> A
                                </div>
                                <div style="flex: 1; font-size: 0.9rem; color: #00E5FF; font-weight: bold; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 8px; border-radius: 6px; text-align: center;">
                                    Potencia (P): <br><span id="val-potencia" style="font-size: 1.1rem;">1.44</span> W
                                </div>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-primary);">Voltaje de ruptura: <span id="critico-v" style="font-weight: bold;">--</span></div>
                            <div style="font-size: 0.85rem; color: var(--text-primary);">Resistencia mínima: <span id="critico-r" style="font-weight: bold;">--</span></div>
                        </div>
                        <div id="panel-alerta" style="padding: 10px; border-radius: 4px; font-size: 0.8rem; text-align: center; font-weight: bold; min-height: 20px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Ajustamos dinamicamente las dimensiones de nuestro lienzo de dibujo.
     */
    ajustarCanvas() { this.canvas.width = this.canvas.parentElement.clientWidth; this.canvas.height = 400; }

    /**
     * Refrescamos la interfaz de usuario con los valores mas recientes.
     * @param {Object} modelo - El estado fisico actual del sistema.
     */
    actualizarUI(modelo) {
        // Mantenemos los rangos deslizables sincronizados con los valores del modelo
        this.sliderV.value = modelo.voltaje;
        this.sliderR.value = modelo.resistencia;
        this.sliderP.value = modelo.limitePotencia;

        // Actualizamos las cajas de texto numerico solo si el usuario no las esta editando en este preciso momento
        if (document.activeElement !== this.inputV) this.inputV.value = modelo.voltaje;
        if (document.activeElement !== this.inputR) this.inputR.value = modelo.resistencia;
        if (document.activeElement !== this.inputP) this.inputP.value = modelo.limitePotencia;

        // Preparamos una variable vacia para guardar la informacion de nuestra alerta
        let infoAlerta;

        if (modelo.modoVista === 'diagrama') {
            // Si estamos en el laboratorio, mostramos la interfaz tecnica y las predicciones matematicas
            this.btnModo.innerText = 'Ver Carga de Celular';
            this.btnModo.style.background = 'var(--bg-panel-alt)';
            this.btnModo.style.color = 'var(--accent)';
            this.panelResistencia.style.display = 'block';
            this.panelCelular.style.display = 'none';
            this.panelPrediccion.style.display = 'block';
            this.labelP.innerText = 'Límite Térmico de Resistencia (W)';
            
            // Proyectamos el flujo de electrones en Amperios en nuestra nueva caja resaltada
            this.valI.innerText = modelo.getCorrienteLab().toFixed(2);
            this.valPotencia.innerText = modelo.getPotenciaLab().toFixed(2);

            this.criticoV.innerText = `${modelo.getVoltajeCritico().toFixed(1)} V`;
            this.criticoR.innerText = `${modelo.getResistenciaCritica().toFixed(1)} Ω`;

            // Consultamos nuestro diccionario para pintar el mensaje de advertencia del circuito
            infoAlerta = DiccionarioOhm.laboratorio[modelo.estadoLab];

        } else {
            // Si cambiamos al modo celular, ocultamos lo tecnico y cambiamos los textos de los menus
            this.btnModo.innerText = 'Ver Diagrama Técnico';
            this.btnModo.style.background = 'var(--accent)';
            this.btnModo.style.color = 'white';
            this.panelResistencia.style.display = 'none';
            this.panelCelular.style.display = 'block';
            this.panelPrediccion.style.display = 'none'; 
            this.labelP.innerText = 'Potencia del Cargador (W)';

            // Actualizamos el recuadro de informacion con el estado vital del dispositivo
            infoAlerta = DiccionarioOhm.celular[modelo.estadoCelular];
        }
        
        // Aplicamos los estilos y textos en un solo lugar para no repetir codigo en los condicionales
        this.panelAlerta.innerText = infoAlerta.texto;
        this.panelAlerta.style.color = infoAlerta.color;
        this.panelAlerta.style.background = infoAlerta.bg;
    }

    /**
     * Dirigimos el proceso de dibujo dependiendo del modo de visualizacion.
     * @param {Object} modelo - El estado logico y visual del simulador.
     */
    dibujar(modelo) {
        // Dirigimos el pincel hacia el grafico correcto segun el modo que seleccionamos
        const { width: w, height: h } = this.canvas;
        this.ctx.clearRect(0, 0, w, h);
        if (modelo.modoVista === 'diagrama') {
            RenderizadorDiagrama.dibujar(this.ctx, w, h, modelo, this.particulas, this.humoObj);
        } else {
            this.dibujarEscenaCelular(modelo, w, h);
        }
    }

    /**
     * Dibujamos la escena interactiva para la carga del celular.
     * @param {Object} modelo - El modelo con los parametros de carga.
     * @param {number} w - Ancho del lienzo.
     * @param {number} h - Alto del lienzo.
     */
    dibujarEscenaCelular(modelo, w, h) {
        const cx = w / 2; const cy = h / 2; const ctx = this.ctx;

        // Pintamos la foto real de fondo si confirmamos que ya se descargo en el navegador
        if (this.imgFondo.complete && this.imgFondo.naturalWidth !== 0) {
            ctx.drawImage(this.imgFondo, 0, 0, w, h);
        }

        // Construimos un cubo blanco que simula nuestro cargador conectado a la pared
        ctx.fillStyle = '#E2E8F0'; ctx.fillRect(30, 30, 60, 60);
        ctx.fillStyle = '#14151C'; ctx.fillRect(40, 50, 15, 5); ctx.fillRect(40, 65, 15, 5);
        ctx.fillStyle = 'var(--accent)'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(`${modelo.voltaje}V / ${modelo.limitePotencia}W`, 35, 105);

        // Trazamos un cable curvo que cuelgue del cargador y viaje hasta nuestro telefono
        ctx.beginPath(); ctx.moveTo(90, 60); ctx.bezierCurveTo(90, cy + 50, cx - 50, cy + 50, cx + 50, cy + 50);
        ctx.strokeStyle = '#2D313F'; ctx.lineWidth = 6; ctx.stroke();

        // Verificamos si sobrevivimos a la carga para empezar a llenar nuestra pila de manera animada
        if (modelo.estadoCelular !== 'quemado') {
            this.bateriaCelular += (modelo.estadoCelular === 'rapido' ? 1.5 : 0.3);
            if (this.bateriaCelular > 100) this.bateriaCelular = 0;
        }

        // Delegamos el dibujo preciso del celular a nuestro archivo especializado pasandole el porcentaje
        RenderizadorCelular.dibujar(ctx, cx + 50, cy - 20, modelo.celularSeleccionado.id, modelo.estadoCelular, this.bateriaCelular, this.humoObj, modelo);
    }
}