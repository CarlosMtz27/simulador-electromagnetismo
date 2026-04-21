import { DiccionarioCircuitos } from './DiccionarioCircuitos.js';
import { RenderizadorDiagrama } from './renderizadores/Diagrama.js';
import { RenderizadorMundoReal } from './renderizadores/MundoReal.js';

export class VistaCircuitos {
    constructor(contenedor) {
        // creamos y montamos la base visual completa para nuestro simulador interactivo
        this.contenedor = contenedor;
        this.renderizarPlantilla();
        this.canvas = document.getElementById('canvas-circuitos');
        this.ctx = this.canvas.getContext('2d');
        
        // enlazamos las referencias en el dom para todos los paneles de mando y controles
        this.btnSerie = document.getElementById('btn-serie');
        this.btnParalelo = document.getElementById('btn-paralelo');
        this.btnMixto = document.getElementById('btn-mixto');
        
        this.panelSlidersTopologia = document.getElementById('panel-sliders-topologia');
        this.sliderSerie = document.getElementById('slider-serie');
        this.sliderParalelo = document.getElementById('slider-paralelo');
        this.panelSliderSerie = document.getElementById('panel-slider-serie');
        this.panelSliderParalelo = document.getElementById('panel-slider-paralelo');
        this.panelConstructorMixto = document.getElementById('panel-constructor-mixto');
        this.panelValoresResistencias = document.getElementById('panel-valores-resistencias');
        
        this.sliderVoltaje = document.getElementById('slider-voltaje');
        this.valVoltaje = document.getElementById('val-voltaje');

        this.btnModoMundo = document.getElementById('btn-modo-mundo');
        this.panelFallaMundo = document.getElementById('panel-falla-mundo');
        this.selectFalla = document.getElementById('select-falla');
        this.btnFalla = document.getElementById('btn-falla');
        this.btnToggleMixto = document.getElementById('btn-toggle-mixto');
        this.btnReparar = document.getElementById('btn-reparar');

        // tomamos las etiquetas donde imprimimos nuestros datos finales
        this.valReq = document.getElementById('val-req');
        this.valItotal = document.getElementById('val-itotal');
        this.panelTitulo = document.getElementById('panel-titulo');
        this.panelMsj = document.getElementById('panel-msj');
        this.estadoAlarma = document.getElementById('estado-alarma');

        this.btnAddSTop = document.getElementById('btn-add-s-top');
        this.btnAddSBot = document.getElementById('btn-add-s-bot');
        this.btnAddP = document.getElementById('btn-add-p');
        this.btnUndo = document.getElementById('btn-undo');
        this.valSecuencia = document.getElementById('val-secuencia');

        this.particulas = Array.from({length: 80}, () => ({ prog: Math.random() * 100 }));
        this.ajustarCanvas();
    }

    renderizarPlantilla() {
        // inyectamos en el documento html puro todas las cajas de diseno visual y herramientas
        this.contenedor.innerHTML = `
            <div class="module-container">
                <div class="canvas-panel" style="flex-direction: column;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-bottom: 15px; min-height: 45px;">
                        
                        <div id="panel-falla-mundo" style="display:none; background: var(--bg-panel-alt); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); align-items: center; gap: 10px;">
                            <label style="color: var(--text-secondary); font-size: 0.85rem; font-weight: bold;">Foco a dañar:</label>
                            <select id="select-falla" style="background: var(--bg-base); color: white; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px; font-size: 0.8rem; outline: none;">
                                <option value="0">Habitación 1 (Arriba Izq)</option>
                                <option value="1">Habitación 2 (Arriba Centro)</option>
                                <option value="2">Habitación 3 (Arriba Der)</option>
                                <option value="3">Habitación 4 (Abajo Izq)</option>
                                <option value="4">Habitación 5 (Abajo Centro)</option>
                                <option value="5">Habitación 6 (Abajo Der)</option>
                            </select>
                            <button id="btn-toggle-mixto" style="display:none; padding: 6px 12px; background: var(--accent); border: 1px solid var(--accent); color: white; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 0 10px rgba(233,75,122,0.5);">Cambiar a Paralelo Primero</button>
                            <button id="btn-reparar" style="display:none; padding: 6px 12px; background: rgba(0,255,0,0.2); border: 1px solid #00FF00; color: #00FF00; border-radius: 4px; cursor: pointer; font-weight: bold;">Reparar</button>
                            <button id="btn-falla" style="padding: 6px 12px; background: rgba(233,75,122,0.2); border: 1px solid var(--accent); color: var(--accent); border-radius: 4px; cursor: pointer; font-weight: bold;">Fundir</button>
                        </div>
                        
                        <div style="flex: 1;"></div>

                        <button id="btn-modo-mundo" style="padding: 10px 20px; background: var(--bg-panel-alt); border: 1px solid var(--accent); color: var(--accent); border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.3s; white-space: nowrap;">
                            Ver Mundo Real
                        </button>
                    </div>

                    <div id="estado-alarma" style="width: 100%; text-align: center; color: var(--accent); font-weight: bold; padding: 0.8rem; display: none; border: 1px solid var(--accent); background: rgba(233, 75, 122, 0.1); border-radius: 8px; margin-bottom: 15px;"></div>
                    
                    <canvas id="canvas-circuitos" style="border-radius: 8px; background: transparent; transition: background 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.5);"></canvas>
                </div>
                
                <div class="controls-panel">
                    <h2 class="panel-title">Diseño de Red</h2>
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
                        <button id="btn-serie" style="flex: 1; font-size: 0.8rem; padding: 0.8rem 0.2rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer;">Serie</button>
                        <button id="btn-paralelo" style="flex: 1; font-size: 0.8rem; padding: 0.8rem 0.2rem; background: var(--accent); border: 1px solid var(--accent); color: white; border-radius: 4px; cursor: pointer;">Paralelo</button>
                        <button id="btn-mixto" style="flex: 1; font-size: 0.8rem; padding: 0.8rem 0.2rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer;">Mixto</button>
                    </div>

                    <div id="panel-slider-voltaje" style="margin-bottom: 1.5rem;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                            <span>Voltaje de Fuente (V)</span><span id="val-voltaje" style="color: var(--text-primary); font-weight: bold;">120 V</span>
                        </label>
                        <input type="range" id="slider-voltaje" min="10" max="240" step="10" value="120" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div id="panel-sliders-topologia">
                        <div id="panel-slider-serie" style="margin-bottom: 1.5rem;">
                            <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                                <span>Cargas en Serie</span><span id="val-serie" style="color: var(--text-primary); font-weight: bold;">1</span>
                            </label>
                            <input type="range" id="slider-serie" min="1" max="5" value="1" style="width: 100%; accent-color: var(--accent);">
                        </div>
                        <div id="panel-slider-paralelo" style="margin-bottom: 1.5rem;">
                            <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                                <span>Ramas en Paralelo</span><span id="val-paralelo" style="color: var(--text-primary); font-weight: bold;">2</span>
                            </label>
                            <input type="range" id="slider-paralelo" min="1" max="5" value="2" style="width: 100%; accent-color: var(--accent);">
                        </div>
                    </div>

                    <div id="panel-constructor-mixto" style="margin-bottom: 1.5rem; display: none; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem; text-transform: uppercase;">Constructor Mixto (Máx 6)</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 10px;">
                            <button id="btn-add-s-top" style="padding: 6px; background: var(--border-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">+ Serie Arriba</button>
                            <button id="btn-add-s-bot" style="padding: 6px; background: var(--border-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">+ Serie Abajo</button>
                            <button id="btn-add-p" style="grid-column: span 2; padding: 6px; background: var(--border-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">+ Paralelo (Rama)</button>
                        </div>
                        <button id="btn-undo" style="width: 100%; padding: 6px; background: rgba(233, 75, 122, 0.2); color: var(--accent); border: 1px solid var(--accent); border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-top: 4px;">Deshacer Último</button>
                        <div id="val-secuencia" style="color: var(--accent); font-weight: bold; font-size: 0.8rem; text-align: center; word-break: break-word; margin-top: 10px; min-height: 1.2em;">...</div>
                    </div>

                    <div id="panel-valores-resistencias" style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); display: none;"></div>

                    <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                        <div style="flex: 1; background: var(--bg-base); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
                            <span style="color: var(--text-secondary); font-size: 0.75rem;">R. EQUIVALENTE</span>
                            <div style="font-size: 1.5rem; color: var(--text-primary); font-weight: bold; margin-top: 0.5rem;">
                                <span id="val-req">240.0</span> <span style="font-size: 1rem;">Ω</span>
                            </div>
                        </div>
                        <div style="flex: 1; background: var(--bg-base); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
                            <span style="color: var(--text-secondary); font-size: 0.75rem;">CORRIENTE (I)</span>
                            <div style="font-size: 1.5rem; color: var(--accent); font-weight: bold; margin-top: 0.5rem;">
                                <span id="val-itotal">0.5</span> <span style="font-size: 1rem;">A</span>
                            </div>
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                        <h3 id="panel-titulo" style="font-size: 0.8rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">Análisis</h3>
                        <p id="panel-msj" style="color: var(--text-primary); font-size: 0.85rem; line-height: 1.5;"></p>
                    </div>
                </div>
            </div>
        `;
    }

    ajustarCanvas() { this.canvas.width = this.canvas.parentElement.clientWidth; this.canvas.height = 450; }

    actualizarUI(modelo) {
        // escribimos en pantalla las medidas fisicas extraidas de los calculos del sistema
        this.valReq.innerText = modelo.resultados.req === Infinity ? '∞' : modelo.resultados.req.toFixed(1);
        this.valItotal.innerText = modelo.resultados.iTotal.toFixed(2);
        document.getElementById('val-serie').innerText = modelo.numSerie;
        document.getElementById('val-paralelo').innerText = modelo.numParalelo;
        this.valVoltaje.innerText = modelo.voltaje + ' V';
        this.sliderVoltaje.value = modelo.voltaje;

        // iluminamos el boton principal dependiendo de la topologia que estamos trabajando
        const btnInactivo = { background: 'transparent', color: 'var(--text-primary)' };
        const btnActivo = { background: 'var(--accent)', color: 'white' };
        Object.assign(this.btnSerie.style, modelo.topologia === 'serie' ? btnActivo : btnInactivo);
        Object.assign(this.btnParalelo.style, modelo.topologia === 'paralelo' ? btnActivo : btnInactivo);
        Object.assign(this.btnMixto.style, modelo.topologia === 'mixto' ? btnActivo : btnInactivo);

        const esMundo = modelo.modoVista === 'mundoReal';

        // escondemos las herramientas matematicas y sliders cuando miramos el simulador realista de casa
        this.panelSlidersTopologia.style.display = (esMundo || modelo.topologia === 'mixto') ? 'none' : 'block';
        this.panelConstructorMixto.style.display = (!esMundo && modelo.topologia === 'mixto') ? 'block' : 'none';
        this.panelValoresResistencias.style.display = (!esMundo && modelo.resistencias.length > 0) ? 'block' : 'none';
        
        // nos aseguramos de mostrar el manejador exacto que rige la cantidad de focos correcta
        if (this.panelSliderSerie) this.panelSliderSerie.style.display = modelo.topologia === 'serie' ? 'block' : 'none';
        if (this.panelSliderParalelo) this.panelSliderParalelo.style.display = modelo.topologia === 'paralelo' ? 'block' : 'none';
        
        // manejamos la disponibilidad del panel de reparacion o dano de dispositivos
        this.panelFallaMundo.style.display = esMundo ? 'flex' : 'none';
        this.btnFalla.style.display = modelo.focoFundidoIndex === -1 ? 'block' : 'none';
        this.btnReparar.style.display = modelo.focoFundidoIndex !== -1 ? 'block' : 'none';
        this.selectFalla.disabled = modelo.focoFundidoIndex !== -1;

        if (esMundo && modelo.topologia === 'mixto') {
            this.btnToggleMixto.style.display = 'block';
            this.btnToggleMixto.innerText = modelo.ordenMixtoMundoReal === 'serie_primero' ? 'Alternar: Iniciar en Paralelo' : 'Alternar: Iniciar en Serie';
        } else {
            this.btnToggleMixto.style.display = 'none';
        }

        if (esMundo) {
            // cambiamos los colores para integrarnos al modo ambiente oscuro en la casa
            this.btnModoMundo.innerText = 'Ver Diagrama Técnico';
            this.btnModoMundo.style.background = 'var(--accent)';
            this.btnModoMundo.style.color = 'white';
            
            this.canvas.style.backgroundImage = 'url("../../assets/img/image.png")'; 
            this.canvas.style.backgroundSize = 'cover';
            this.canvas.style.backgroundPosition = 'center';
        } else {
            // limpiamos la pantalla volviendo a la estetica plana de laboratorio tecnico
            this.btnModoMundo.innerText = 'Ver Mundo Real';
            this.btnModoMundo.style.background = 'var(--bg-panel-alt)';
            this.btnModoMundo.style.color = 'var(--accent)';
            this.canvas.style.backgroundImage = 'none';
            this.canvas.style.backgroundColor = 'transparent';
            this.actualizarValoresResistencias(modelo);
        }

        // listamos en modo texto como queda configurada nuestra serie hibrida
        const mapaNombres = { 'S_top': 'S. Arriba ⬆', 'S_bot': 'S. Abajo ⬇', 'P': 'Paralelo ↕' };
        this.valSecuencia.innerText = modelo.secuenciaMixta.map(c => mapaNombres[c]).join(' ➔ ') || 'Circuito Vacío. ¡Añade un componente!';

        const textos = DiccionarioCircuitos.diagrama[modelo.topologia];
        this.panelTitulo.innerText = textos.titulo;
        
        // unificamos la evaluacion de mensajes y alertas visuales para tener un flujo de control mas limpio
        if (modelo.estadoSistema === 'sobrecarga') {
            this.panelMsj.innerText = textos.analisis + " " + (textos.alertaCarga || '');
            this.estadoAlarma.style.display = 'block';
            this.estadoAlarma.innerText = "¡CABLES SOBRECALENTADOS! LÍMITE TÉRMICO SUPERADO (BREAKER DISPARADO)";
            this.estadoAlarma.style.color = 'var(--accent)';
            this.estadoAlarma.style.background = 'rgba(233, 75, 122, 0.2)';
            this.estadoAlarma.style.border = '1px solid var(--accent)';
        } else if (modelo.focoFundidoIndex !== -1) {
            this.panelMsj.innerText = DiccionarioCircuitos.obtenerExplicacionFalla(modelo, modelo.focoFundidoIndex);
            this.estadoAlarma.style.display = 'block';
            const numFoco = parseInt(this.selectFalla.value) + 1;
            this.estadoAlarma.innerText = `SISTEMA INTERRUMPIDO: FOCO ${numFoco} FUNDIDO`;
            this.estadoAlarma.style.color = 'orange';
            this.estadoAlarma.style.background = 'rgba(255, 165, 0, 0.1)';
            this.estadoAlarma.style.border = '1px solid orange';
        } else {
            this.panelMsj.innerText = textos.analisis + " " + (textos.alertaCarga || '');
            this.estadoAlarma.style.display = 'none';
        }
    }

    actualizarValoresResistencias(modelo) {
        // generamos dinamica e individualmente las casillas para modificar cualquier resistencia del arreglo
        if (modelo.resistencias.length === 0) return;
        const currentInputs = this.panelValoresResistencias.querySelectorAll('.input-res');
        if (currentInputs.length !== modelo.resistencias.length || this.ultimaTopologia !== modelo.topologia) {
            this.ultimaTopologia = modelo.topologia;
            let html = '<label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem; text-transform: uppercase;">Valores Individuales (Ω)</label><div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">';
            
            // construimos el HTML mediante map y join para evitar concatenaciones iterativas costosas
            html += modelo.resistencias.map((res, i) => {
                let name = `R${i+1}`;
                if (modelo.topologia === 'mixto') {
                    const tipo = modelo.secuenciaMixta[i];
                    name = tipo === 'S_top' ? `R${i+1} (Arriba)` : tipo === 'S_bot' ? `R${i+1} (Abajo)` : `R${i+1} (Rama)`;
                }
                return `<div style="display:flex; align-items:center; gap:5px;"><span style="font-size:0.75rem; color:var(--text-secondary); width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</span><input type="number" min="0.1" step="0.1" class="input-res" data-index="${i}" value="${res}" style="width:100%; padding:4px; background:var(--bg-base); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;"></div>`;
            }).join('');
            
            html += '</div>';
            this.panelValoresResistencias.innerHTML = html;
        } else {
            currentInputs.forEach((input, i) => {
                if (document.activeElement !== input) input.value = modelo.resistencias[i];
            });
        }
    }

    dibujar(modelo) {
        // dirigimos el trafico visual evaluando que tipo de renderizador invocar hoy
        if (modelo.modoVista === 'diagrama') {
            RenderizadorDiagrama.dibujar(this.ctx, this.canvas.width, this.canvas.height, modelo, modelo.resultados, this.particulas);
        } else {
            RenderizadorMundoReal.dibujar(this.ctx, this.canvas.width, this.canvas.height, modelo, modelo.resultados, this.particulas);

        }
    }
}