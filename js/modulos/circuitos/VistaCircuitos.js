import { DiccionarioCircuitos } from './DiccionarioCircuitos.js';
import { RenderizadorDiagrama } from './renderizadores/Diagrama.js';
import { RenderizadorMundoReal } from './renderizadores/MundoReal.js';

/**
 * Clase VistaCircuitos
 * Gestionamos toda la interfaz grafica del modulo de circuitos.
 * Nos encargamos de inyectar el HTML, capturar las referencias del DOM
 * y dirigir el dibujado en el Canvas segun el estado del modelo.
 */
export class VistaCircuitos {
    /**
     * Inicializamos y montamos la base visual completa para nuestro simulador interactivo.
     * @param {HTMLElement} contenedor - El elemento DOM donde inyectaremos la aplicacion.
     */
    constructor(contenedor) {
        // Creamos y montamos la base visual completa para nuestro simulador interactivo
        this.contenedor = contenedor;
        this.renderizarPlantilla();
        this.canvas = document.getElementById('canvas-circuitos');
        this.ctx = this.canvas.getContext('2d');
        
        // Enlazamos las referencias en el DOM para todos los paneles de mando y controles
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
        this.inputVoltaje  = document.getElementById('input-voltaje');
        this.valVoltaje    = document.getElementById('val-voltaje');

        this.btnModoMundo = document.getElementById('btn-modo-mundo');
        this.panelFallaMundo = document.getElementById('panel-falla-mundo');
        this.selectFalla = document.getElementById('select-falla');
        this.btnFalla = document.getElementById('btn-falla');
        this.btnToggleMixto = document.getElementById('btn-toggle-mixto');
        this.btnReparar = document.getElementById('btn-reparar');

        // Panel de resistencias individuales en Mundo Real
        this.panelResistenciasMundo = document.getElementById('panel-resistencias-mundo');
        this.gridResistenciasMundo  = document.getElementById('grid-resistencias-mundo');

        // Panel de costos mensuales (CFE)
        this.panelCostoMundo = document.getElementById('panel-costo-mundo');
        this.inputHorasUso = document.getElementById('input-horas-uso');
        this.valCostoMensual = document.getElementById('val-costo-mensual');

        // Tomamos las etiquetas donde imprimiremos nuestros datos finales
        this.valReq = document.getElementById('val-req');
        this.valItotal = document.getElementById('val-itotal');
        this.valPtotal = document.getElementById('val-ptotal');
        this.valBreakerPct = document.getElementById('val-breaker-pct');
        this.barBreaker = document.getElementById('bar-breaker');
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

    /**
     * Inyectamos la estructura HTML principal del simulador dentro del contenedor.
     * Definimos los paneles, botones, deslizadores y el canvas.
     */
    renderizarPlantilla() {
        // Inyectamos en el documento HTML puro todas las cajas de diseno visual y herramientas
        this.contenedor.innerHTML = `
            <div class="module-container" style="gap: 1rem; grid-template-columns: 1fr 400px;">
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
                    
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                        <button id="btn-serie" style="flex: 1; font-size: 0.8rem; padding: 0.8rem 0.2rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer;">Serie</button>
                        <button id="btn-paralelo" style="flex: 1; font-size: 0.8rem; padding: 0.8rem 0.2rem; background: var(--accent); border: 1px solid var(--accent); color: white; border-radius: 4px; cursor: pointer;">Paralelo</button>
                        <button id="btn-mixto" style="flex: 1; font-size: 0.8rem; padding: 0.8rem 0.2rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer;">Mixto</button>
                    </div>

                    <!-- Voltaje: slider e input numerico sincronizados -->
                    <div id="panel-slider-voltaje" style="margin-bottom: 1rem;">
                        <label style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                            <span>Voltaje de Fuente (V)</span>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <input type="number" id="input-voltaje"
                                       min="10" max="240" step="10" value="120"
                                       style="width: 62px; background: var(--bg-base); color: var(--text-primary);
                                              border: 1px solid var(--border-color); border-radius: 4px;
                                              padding: 2px 4px; text-align: center; font-weight: bold; font-size: 0.85rem;
                                              outline: none;">
                                <span id="val-voltaje" style="color: var(--text-primary); font-weight: bold; font-size: 0.85rem;">V</span>
                            </div>
                        </label>
                        <input type="range" id="slider-voltaje" min="10" max="240" step="10" value="120" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div id="panel-sliders-topologia">
                        <div id="panel-slider-serie" style="margin-bottom: 1rem;">
                            <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                                <span>Cargas en Serie</span><span id="val-serie" style="color: var(--text-primary); font-weight: bold;">1</span>
                            </label>
                            <input type="range" id="slider-serie" min="1" max="5" value="1" style="width: 100%; accent-color: var(--accent);">
                        </div>
                        <div id="panel-slider-paralelo" style="margin-bottom: 1rem;">
                            <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                                <span>Ramas en Paralelo</span><span id="val-paralelo" style="color: var(--text-primary); font-weight: bold;">2</span>
                            </label>
                            <input type="range" id="slider-paralelo" min="1" max="5" value="2" style="width: 100%; accent-color: var(--accent);">
                        </div>
                    </div>

                    <div id="panel-constructor-mixto" style="margin-bottom: 1rem; display: none; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem; text-transform: uppercase;">Constructor Mixto (Máx 6)</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 10px;">
                            <button id="btn-add-s-top" style="padding: 6px; background: var(--border-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">+ Serie Arriba</button>
                            <button id="btn-add-s-bot" style="padding: 6px; background: var(--border-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">+ Serie Abajo</button>
                            <button id="btn-add-p" style="grid-column: span 2; padding: 6px; background: var(--border-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">+ Paralelo (Rama)</button>
                        </div>
                        <button id="btn-undo" style="width: 100%; padding: 6px; background: rgba(233, 75, 122, 0.2); color: var(--accent); border: 1px solid var(--accent); border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-top: 4px;">Deshacer Último</button>
                        <div id="val-secuencia" style="color: var(--accent); font-weight: bold; font-size: 0.8rem; text-align: center; word-break: break-word; margin-top: 10px; min-height: 1.2em;">...</div>
                    </div>

                    <!-- Panel de resistencias en modo diagrama -->
                    <div id="panel-valores-resistencias" style="margin-bottom: 1rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); display: none;"></div>

                    <!-- Panel de resistencias por habitacion (Mundo Real) -->
                    <div id="panel-resistencias-mundo"
                         style="display: none; margin-bottom: 1rem; background: rgba(0,0,0,0.2);
                                padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <label style="display: block; color: var(--text-secondary); margin-bottom: 8px;
                                      font-size: 0.78rem; text-transform: uppercase; letter-spacing: 1px;">
                            Resistencia por Habitación (Ω)
                            <span style="color: var(--text-secondary); font-weight: normal; font-size: 0.7rem;
                                         display: block; margin-top: 2px; text-transform: none; letter-spacing: 0;">
                                Tip: 60 W → 254 Ω · 100 W → 152 Ω · LED 10 W → 1524 Ω
                            </span>
                        </label>
                        <div id="grid-resistencias-mundo"
                             style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        </div>
                    </div>

                    <!-- Panel de Costo mensual (Mundo Real) -->
                    <div id="panel-costo-mundo" style="display: none; margin-bottom: 1rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="color: var(--text-secondary); font-size: 0.78rem; text-transform: uppercase;">Uso diario (Horas):</label>
                            <input type="number" id="input-horas-uso" min="1" max="24" step="1" value="8" style="width: 60px; background: var(--bg-base); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; text-align: center; outline: none; font-weight: bold;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-secondary); font-size: 0.78rem; text-transform: uppercase;">Costo Mensual (CFE a $2.80/kWh):</span>
                            <span id="val-costo-mensual" style="color: #00FF00; font-size: 1.1rem; font-weight: bold;">$0.00</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                        <div style="flex: 1; background: var(--bg-base); padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
                            <span style="color: var(--text-secondary); font-size: 0.7rem;">R. EQUIVALENTE</span>
                            <div style="font-size: 1.2rem; color: var(--text-primary); font-weight: bold; margin-top: 0.3rem;">
                                <span id="val-req">240.0</span> <span style="font-size: 0.8rem;">Ω</span>
                            </div>
                        </div>
                        <div style="flex: 1; background: var(--bg-base); padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
                            <span style="color: var(--text-secondary); font-size: 0.7rem;">CORRIENTE (I)</span>
                            <div style="font-size: 1.2rem; color: var(--accent); font-weight: bold; margin-top: 0.3rem;">
                                <span id="val-itotal">0.5</span> <span style="font-size: 0.8rem;">A</span>
                            </div>
                        </div>
                        <div style="flex: 1; background: var(--bg-base); padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
                            <span style="color: var(--text-secondary); font-size: 0.7rem;">POTENCIA (P)</span>
                            <div style="font-size: 1.2rem; color: #FFBF00; font-weight: bold; margin-top: 0.3rem;">
                                <span id="val-ptotal">60.0</span> <span style="font-size: 0.8rem;">W</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem; background: var(--bg-base); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: var(--text-secondary); font-size: 0.75rem;">CARGA DEL BREAKER (15A MÁX)</span>
                            <span id="val-breaker-pct" style="color: var(--text-primary); font-size: 0.75rem; font-weight: bold;">0%</span>
                        </div>
                        <div style="width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; height: 8px; overflow: hidden;">
                            <div id="bar-breaker" style="width: 0%; height: 100%; background: #00FF00; transition: width 0.3s, background 0.3s;"></div>
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

    /**
     * Ajustamos dinamicamente el tamano del lienzo para que se adapte a su contenedor.
     */
    ajustarCanvas() { 
        this.canvas.width = this.canvas.parentElement.clientWidth; 
        this.canvas.height = 400; 
    }

    /**
     * Refrescamos todos los elementos de la interfaz de usuario con los datos mas recientes.
     * @param {Object} modelo - El estado fisico y logico del circuito.
     */
    actualizarUI(modelo) {
        // Escribimos en pantalla las medidas fisicas extraidas de los calculos del sistema
        this.valReq.innerText = modelo.resultados.req === Infinity ? '∞' : modelo.resultados.req.toFixed(1);
        this.valItotal.innerText = modelo.resultados.iTotal.toFixed(2);
        
        const pTotal = modelo.voltaje * modelo.resultados.iTotal;
        this.valPtotal.innerText = pTotal.toFixed(1);

        const kWh = (pTotal * modelo.horasUsoDiario * 30) / 1000;
        const costo = kWh * modelo.tarifaKWh;
        this.valCostoMensual.innerText = '$' + costo.toFixed(2) + ' MXN';
        if (document.activeElement !== this.inputHorasUso) {
            this.inputHorasUso.value = modelo.horasUsoDiario;
        }

        const breakerPct = Math.min((modelo.resultados.iTotal / 15) * 100, 100);
        this.valBreakerPct.innerText = breakerPct.toFixed(1) + '%';
        this.barBreaker.style.width = breakerPct + '%';
        if (breakerPct < 50) this.barBreaker.style.background = '#00FF00';
        else if (breakerPct < 85) this.barBreaker.style.background = '#FFBF00';
        else this.barBreaker.style.background = '#FF3333';
        
        document.getElementById('val-serie').innerText = modelo.numSerie;
        document.getElementById('val-paralelo').innerText = modelo.numParalelo;

        // Sincronizamos el input numerico y el slider de voltaje
        if (document.activeElement !== this.inputVoltaje) this.inputVoltaje.value = modelo.voltaje;
        this.sliderVoltaje.value = modelo.voltaje;
        this.valVoltaje.innerText = 'V';  // Dejamos la unidad fija; el valor ya va en el input

        // Iluminamos el boton principal dependiendo de la topologia que estamos trabajando
        const btnInactivo = { background: 'transparent', color: 'var(--text-primary)' };
        const btnActivo = { background: 'var(--accent)', color: 'white' };
        Object.assign(this.btnSerie.style, modelo.topologia === 'serie' ? btnActivo : btnInactivo);
        Object.assign(this.btnParalelo.style, modelo.topologia === 'paralelo' ? btnActivo : btnInactivo);
        Object.assign(this.btnMixto.style, modelo.topologia === 'mixto' ? btnActivo : btnInactivo);

        const esMundo = modelo.modoVista === 'mundoReal';

        // Escondemos las herramientas matematicas y sliders cuando miramos el simulador realista de la casa
        this.panelSlidersTopologia.style.display = (esMundo || modelo.topologia === 'mixto') ? 'none' : 'block';
        this.panelConstructorMixto.style.display = (!esMundo && modelo.topologia === 'mixto') ? 'block' : 'none';
        this.panelValoresResistencias.style.display = (!esMundo && modelo.resistencias.length > 0) ? 'block' : 'none';

        // Panel de resistencias por habitacion (solo visible en Mundo Real)
        this.panelResistenciasMundo.style.display = esMundo ? 'block' : 'none';
        this.panelCostoMundo.style.display = esMundo ? 'block' : 'none';
        if (esMundo) this.actualizarResistenciasMundo(modelo);
        
        if (this.panelSliderSerie) this.panelSliderSerie.style.display = modelo.topologia === 'serie' ? 'block' : 'none';
        if (this.panelSliderParalelo) this.panelSliderParalelo.style.display = modelo.topologia === 'paralelo' ? 'block' : 'none';
        
        // Manejamos la disponibilidad del panel de reparacion o dano de dispositivos
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
            this.btnModoMundo.innerText = 'Ver Diagrama Técnico';
            this.btnModoMundo.style.background = 'var(--accent)';
            this.btnModoMundo.style.color = 'white';
            
            this.canvas.style.backgroundImage = 'url("../../assets/img/image.png")'; 
            this.canvas.style.backgroundSize = 'cover';
            this.canvas.style.backgroundPosition = 'center';
        } else {
            this.btnModoMundo.innerText = 'Ver Mundo Real';
            this.btnModoMundo.style.background = 'var(--bg-panel-alt)';
            this.btnModoMundo.style.color = 'var(--accent)';
            this.canvas.style.backgroundImage = 'none';
            this.canvas.style.backgroundColor = 'transparent';
            this.actualizarValoresResistencias(modelo);
        }

        const mapaNombres = { 'S_top': 'S. Arriba ⬆', 'S_bot': 'S. Abajo ⬇', 'P': 'Paralelo ↕' };
        this.valSecuencia.innerText = modelo.secuenciaMixta.map(c => mapaNombres[c]).join(' ➔ ') || 'Circuito Vacío. ¡Añade un componente!';

        const textos = DiccionarioCircuitos.diagrama[modelo.topologia];
        this.panelTitulo.innerText = textos.titulo;
        
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

    /**
     * Renderizamos o actualizamos la cuadricula con un input numerico por habitacion.
     * La primera vez construimos el HTML; en llamadas posteriores solo actualizamos valores
     * si el input no esta siendo editado por el usuario en ese momento.
     *
     * Fisica detras de los valores: R = V^2 / P
     *   - Foco  40 W / 127 V ->  403 Ohmios
     *   - Foco  60 W / 127 V ->  268 Ohmios (valor por defecto)
     *   - Foco 100 W / 127 V ->  161 Ohmios
     *   - LED   10 W / 127 V -> 1613 Ohmios
     * @param {Object} modelo - El estado actual del sistema.
     */
    actualizarResistenciasMundo(modelo) {
        const nombres = [
            'Hab. 1 ↖', 'Hab. 2 ↑', 'Hab. 3 ↗',
            'Hab. 4 ↙', 'Hab. 5 ↓', 'Hab. 6 ↘'
        ];

        const inputs = this.gridResistenciasMundo.querySelectorAll('.input-res-mundo');

        if (inputs.length !== 6) {
            // Primera construccion o cambio de topologia
            this.gridResistenciasMundo.innerHTML = nombres.map((nombre, i) => {
                const val = modelo.resistencias[i] !== undefined
                    ? modelo.resistencias[i].toFixed(0)
                    : modelo.resistenciaBase;
                return `
                <div style="background: rgba(0,0,0,0.25); padding: 5px 6px; border-radius: 5px;
                            border: 1px solid var(--border-color);">
                    <span style="font-size: 0.68rem; color: var(--text-secondary); display: block;
                                 margin-bottom: 3px; white-space: nowrap; overflow: hidden;
                                 text-overflow: ellipsis;">${nombre}</span>
                    <div style="display: flex; align-items: center; gap: 3px;">
                        <input type="number"
                               class="input-res-mundo"
                               data-index="${i}"
                               value="${val}"
                               min="1" max="9999" step="1"
                               style="flex: 1; width: 0; background: var(--bg-base);
                                      color: var(--accent); border: 1px solid var(--border-color);
                                      border-radius: 3px; padding: 3px 2px; text-align: center;
                                      font-weight: bold; font-size: 0.82rem; outline: none;">
                        <span style="font-size: 0.7rem; color: var(--text-secondary);">Ω</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.7rem; font-weight: bold;">
                        <span class="val-w-mundo">0.0 W</span>
                        <span class="val-a-mundo">0.00 A</span>
                    </div>
                </div>`;
            }).join('');
        }

        // Actualizamos los valores dinamicos de vatios y amperios
        const currentInputs = this.gridResistenciasMundo.querySelectorAll('.input-res-mundo');
        const valsW = this.gridResistenciasMundo.querySelectorAll('.val-w-mundo');
        const valsA = this.gridResistenciasMundo.querySelectorAll('.val-a-mundo');

        currentInputs.forEach((input, i) => {
            if (document.activeElement !== input && modelo.resistencias[i] !== undefined) {
                input.value = modelo.resistencias[i].toFixed(0);
            }
            
            const estaFundido = modelo.focoFundidoIndex === i;
            const r = estaFundido ? Infinity : modelo.resistencias[i];
            const p = modelo.resultados.pMixto[i] || 0;
            const a = (estaFundido || r === Infinity || p === 0) ? 0 : Math.sqrt(p / r);

            valsW[i].innerText = p.toFixed(1) + ' W';
            valsA[i].innerText = a.toFixed(2) + ' A';

            if (estaFundido || p === 0) {
                valsW[i].style.color = 'var(--text-secondary)';
                valsA[i].style.color = 'var(--text-secondary)';
            } else {
                valsW[i].style.color = '#FFBF00';
                valsA[i].style.color = 'var(--accent)';
            }
        });
    }

    /**
     * Generamos de forma dinamica los deslizadores y cuadros de texto para
     * modificar el valor de cada resistencia en el modo de diagrama tecnico.
     * @param {Object} modelo - El estado actual del sistema.
     */
    actualizarValoresResistencias(modelo) {
        // Generamos dinamica e individualmente las casillas para modificar cualquier resistencia del arreglo
        if (modelo.resistencias.length === 0) return;
        const currentInputs = this.panelValoresResistencias.querySelectorAll('.input-res');
        if (currentInputs.length !== modelo.resistencias.length || this.ultimaTopologia !== modelo.topologia) {
            this.ultimaTopologia = modelo.topologia;
            let html = '<label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem; text-transform: uppercase;">Resistencias (Ω)</label><div style="display:flex; flex-direction:column; gap:0.5rem;">';
            
            html += modelo.resistencias.map((res, i) => {
                let name = `R${i+1}`;
                if (modelo.topologia === 'mixto') {
                    const tipo = modelo.secuenciaMixta[i];
                    name = tipo === 'S_top' ? `R${i+1} (Arriba)` : tipo === 'S_bot' ? `R${i+1} (Abajo)` : `R${i+1} (Rama)`;
                }
                return `<div style="display:flex; align-items:center; gap:8px; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);">
                            <span style="font-size:0.75rem; color:var(--text-secondary); width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</span>
                            <input type="range" min="10" max="1000" step="1" class="slider-res" data-index="${i}" value="${res}" style="flex:1; accent-color: var(--accent);">
                            <input type="number" min="0.1" max="5000" step="0.1" class="input-res" data-index="${i}" value="${res}" style="width:60px; padding:4px; background:var(--bg-base); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; text-align: center;">
                            <span class="extra-info-res" style="width: 55px; font-size:0.75rem; font-weight: bold; text-align: right;"></span>
                        </div>`;
            }).join('');
            
            html += '</div>';
            this.panelValoresResistencias.innerHTML = html;
        } else {
            const currentSliders = this.panelValoresResistencias.querySelectorAll('.slider-res');
            currentInputs.forEach((input, i) => {
                if (document.activeElement !== input) input.value = modelo.resistencias[i];
            });
            currentSliders.forEach((slider, i) => {
                if (document.activeElement !== slider) slider.value = modelo.resistencias[i];
            });
        }

        const extraInfos = this.panelValoresResistencias.querySelectorAll('.extra-info-res');
        extraInfos.forEach((span, i) => {
            const estaFundido = modelo.focoFundidoIndex === i;
            const r = estaFundido ? Infinity : modelo.resistencias[i];
            const p = modelo.resultados.pMixto[i] || 0;
            
            if (modelo.topologia === 'serie') {
                const v = estaFundido ? modelo.voltaje : Math.sqrt(p * r);
                span.innerText = v.toFixed(1) + ' V';
                span.style.color = '#00E5FF';
            } else if (modelo.topologia === 'paralelo') {
                const amp = estaFundido ? 0 : Math.sqrt(p / r);
                span.innerText = amp.toFixed(2) + ' A';
                span.style.color = 'var(--accent)';
            } else {
                const v = estaFundido ? 0 : Math.sqrt(p * r);
                span.innerText = v.toFixed(1) + ' V';
                span.style.color = '#00E5FF';
            }
        });
    }

    /**
     * Dirigimos el trafico visual evaluando que tipo de renderizador debemos invocar
     * basandonos en el modo de vista seleccionado (tecnico o realista).
     * @param {Object} modelo - El estado fisico a representar.
     */
    dibujar(modelo) {
        // Dirigimos el trafico visual evaluando que tipo de renderizador invocar hoy
        if (modelo.modoVista === 'diagrama') {
            RenderizadorDiagrama.dibujar(this.ctx, this.canvas.width, this.canvas.height, modelo, modelo.resultados, this.particulas);
        } else {
            RenderizadorMundoReal.dibujar(this.ctx, this.canvas.width, this.canvas.height, modelo, modelo.resultados, this.particulas);
        }
    }
}