import { DiccionarioOhm } from './DiccionarioOhm.js';
import { RenderizadorCelular } from './renderizadores/Celular.js';
import { RenderizadorDiagrama } from './renderizadores/Diagrama.js';

export class VistaOhm {
    constructor(contenedor) {
        // inyectamos nuestra estructura visual en la pagina y preparamos nuestro lienzo de dibujo
        this.contenedor = contenedor;
        this.renderizarPlantilla();
        this.canvas = document.getElementById('canvas-ohm');
        this.ctx = this.canvas.getContext('2d');
        
        // capturamos todos los controles interactivos para que el controlador los pueda escuchar
        this.btnModo = document.getElementById('btn-modo-ohm');
        this.panelResistencia = document.getElementById('panel-resistencia');
        this.panelCelular = document.getElementById('panel-celular');
        this.selectCelular = document.getElementById('select-celular');
        this.sliderV = document.getElementById('slider-v');
        this.sliderR = document.getElementById('slider-r');
        this.sliderP = document.getElementById('slider-p');
        this.valV = document.getElementById('val-v');
        this.valR = document.getElementById('val-r');
        this.valP = document.getElementById('val-p');
        this.labelP = document.getElementById('label-potencia');
        this.panelPrediccion = document.getElementById('panel-prediccion');
        this.panelAlerta = document.getElementById('panel-alerta');
        this.criticoV = document.getElementById('critico-v');
        this.criticoR = document.getElementById('critico-r');

        // preparamos nuestros generadores de particulas y la bateria virtual
        this.particulas = Array.from({length: 60}, () => ({ prog: Math.random() * 100 }));
        this.humoObj = { angulo: 0 };
        this.bateriaCelular = 0;
        
        // cargamos anticipadamente la imagen del cuarto para tenerla lista cuando simulamos la pared
        this.imgFondo = new Image();
        this.imgFondo.src = '../../assets/img/Fondo.jpg'; 
        this.ajustarCanvas();
    }

    renderizarPlantilla() {
        // construimos todo el esquema html de manera dinamica incluyendo sliders y textos base
        this.contenedor.innerHTML = `
            <div class="module-container">
                <div class="canvas-panel" style="flex-direction: column; position: relative;">
                    <button id="btn-modo-ohm" style="position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem; background: var(--bg-panel-alt); border: 1px solid var(--accent); color: var(--accent); border-radius: 20px; cursor: pointer; z-index: 5; font-weight: bold; transition: 0.3s;">
                        Ver Carga de Celular
                    </button>
                    <canvas id="canvas-ohm"></canvas>
                </div>
                <div class="controls-panel">
                    <h2 class="panel-title">Potencia y Riesgo Térmico</h2>
                    
                    <div style="margin-bottom: 1.2rem;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.85rem;">
                            <span>Voltaje (V)</span><span id="val-v">12 V</span>
                        </label>
                        <input type="range" id="slider-v" min="1" max="60" value="12" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div id="panel-resistencia" style="margin-bottom: 1.2rem;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.85rem;">
                            <span>Resistencia (Ω)</span><span id="val-r">100 Ω</span>
                        </label>
                        <input type="range" id="slider-r" min="1" max="500" value="100" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div id="panel-celular" style="margin-bottom: 1.2rem; display: none;">
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

                    <div style="margin-bottom: 2rem;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.85rem;">
                            <span id="label-potencia">Límite Térmico de R (W)</span><span id="val-p" style="color: var(--accent);">50 W</span>
                        </label>
                        <input type="range" id="slider-p" min="1" max="150" value="50" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                        <div id="panel-prediccion" style="margin-bottom: 10px;">
                            <div style="font-size: 0.85rem; color: var(--text-primary);">Voltaje de ruptura: <span id="critico-v" style="font-weight: bold;">--</span></div>
                            <div style="font-size: 0.85rem; color: var(--text-primary);">Resistencia mínima: <span id="critico-r" style="font-weight: bold;">--</span></div>
                        </div>
                        <div id="panel-alerta" style="padding: 10px; border-radius: 4px; font-size: 0.8rem; text-align: center; font-weight: bold; min-height: 20px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    ajustarCanvas() { this.canvas.width = this.canvas.parentElement.clientWidth; this.canvas.height = 450; }

    actualizarUI(modelo) {
        // imprimimos los valores de los sliders en la pantalla para que el usuario los vea
        this.valV.innerText = `${modelo.voltaje} V`;
        this.valR.innerText = `${modelo.resistencia} Ω`;
        this.valP.innerText = `${modelo.limitePotencia} W`;

        // preparamos una variable vacia para guardar la informacion de nuestra alerta
        let infoAlerta;

        if (modelo.modoVista === 'diagrama') {
            // si estamos en el laboratorio, mostramos la interfaz tecnica y las predicciones matematicas
            this.btnModo.innerText = 'Ver Carga de Celular';
            this.btnModo.style.background = 'var(--bg-panel-alt)';
            this.btnModo.style.color = 'var(--accent)';
            this.panelResistencia.style.display = 'block';
            this.panelCelular.style.display = 'none';
            this.panelPrediccion.style.display = 'block';
            this.labelP.innerText = 'Límite Térmico de Resistencia (W)';
            
            this.criticoV.innerText = `${modelo.getVoltajeCritico().toFixed(1)} V`;
            this.criticoR.innerText = `${modelo.getResistenciaCritica().toFixed(1)} Ω`;

            // consultamos nuestro diccionario para pintar el mensaje de advertencia del circuito
            infoAlerta = DiccionarioOhm.laboratorio[modelo.estadoLab];

        } else {
            // si cambiamos al modo celular, ocultamos lo tecnico y cambiamos los textos de los menus
            this.btnModo.innerText = 'Ver Diagrama Técnico';
            this.btnModo.style.background = 'var(--accent)';
            this.btnModo.style.color = 'white';
            this.panelResistencia.style.display = 'none';
            this.panelCelular.style.display = 'block';
            this.panelPrediccion.style.display = 'none'; 
            this.labelP.innerText = 'Potencia del Cargador (W)';

            // actualizamos el recuadro de informacion con el estado vital del dispositivo
            infoAlerta = DiccionarioOhm.celular[modelo.estadoCelular];
        }
        
        // aplicamos los estilos y textos en un solo lugar para no repetir codigo en los condicionales
        this.panelAlerta.innerText = infoAlerta.texto;
        this.panelAlerta.style.color = infoAlerta.color;
        this.panelAlerta.style.background = infoAlerta.bg;
    }

    dibujar(modelo) {
        // dirigimos el pincel hacia el grafico correcto segun el modo que seleccionamos
        const { width: w, height: h } = this.canvas;
        this.ctx.clearRect(0, 0, w, h);
        if (modelo.modoVista === 'diagrama') {
            RenderizadorDiagrama.dibujar(this.ctx, w, h, modelo, this.particulas, this.humoObj);
        } else {
            this.dibujarEscenaCelular(modelo, w, h);
        }
    }

    dibujarEscenaCelular(modelo, w, h) {
        const cx = w / 2; const cy = h / 2; const ctx = this.ctx;

        // pintamos la foto real de fondo si confirmamos que ya se descargo en el navegador
        if (this.imgFondo.complete && this.imgFondo.naturalWidth !== 0) {
            ctx.drawImage(this.imgFondo, 0, 0, w, h);
        }

        // construimos un cubo blanco que simula nuestro cargador conectado a la pared
        ctx.fillStyle = '#E2E8F0'; ctx.fillRect(30, 30, 60, 60);
        ctx.fillStyle = '#14151C'; ctx.fillRect(40, 50, 15, 5); ctx.fillRect(40, 65, 15, 5);
        ctx.fillStyle = 'var(--accent)'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(`${modelo.voltaje}V / ${modelo.limitePotencia}W`, 35, 105);

        // trazamos un cable curvo que cuelgue del cargador y viaje hasta nuestro telefono
        ctx.beginPath(); ctx.moveTo(90, 60); ctx.bezierCurveTo(90, cy + 50, cx - 50, cy + 50, cx + 50, cy + 50);
        ctx.strokeStyle = '#2D313F'; ctx.lineWidth = 6; ctx.stroke();

        // verificamos si sobrevivimos a la carga para empezar a llenar nuestra pila de manera animada
        if (modelo.estadoCelular !== 'quemado') {
            this.bateriaCelular += (modelo.estadoCelular === 'rapido' ? 1.5 : 0.3);
            if (this.bateriaCelular > 100) this.bateriaCelular = 0;
        }

        // delegamos el dibujo preciso del celular a nuestro archivo especializado pasandole el porcentaje
        RenderizadorCelular.dibujar(ctx, cx + 50, cy - 20, modelo.celularSeleccionado.id, modelo.estadoCelular, this.bateriaCelular, this.humoObj);
    }
}