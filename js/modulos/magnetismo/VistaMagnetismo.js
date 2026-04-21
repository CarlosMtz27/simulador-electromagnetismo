import { DiccionarioMagnetismo } from './DiccionarioMagnetismo.js';

export class VistaMagnetismo {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.renderizarPlantilla();
        
        this.canvas = document.getElementById('canvas-magnetismo');
        this.ctx = this.canvas.getContext('2d');
        
        // Referencias de UI
        this.sliderCorriente = document.getElementById('slider-corriente');
        this.valCorriente = document.getElementById('val-corriente');
        this.sliderFuerzaIman = document.getElementById('slider-fuerza-iman');
        this.valFuerzaIman = document.getElementById('val-fuerza-iman');
        
        this.btnInvertir = document.getElementById('btn-invertir-iman');
        this.checkVectores = document.getElementById('check-vectores');
        this.checkCampo = document.getElementById('check-campo');
        
        this.btnModoMundo = document.getElementById('btn-modo-mundo');
        this.panelMsj = document.getElementById('panel-teoria');
        this.valFuerzaLorentz = document.getElementById('val-fuerza-lorentz');
        
        // Referencias UI Bomba
        this.panelLorentz = document.getElementById('panel-lorentz');
        this.panelBomba = document.getElementById('panel-bomba');
        this.badgeLorentz = document.getElementById('badge-lorentz');
        
        this.sliderVoltajeBomba = document.getElementById('slider-voltaje-bomba');
        this.valVoltajeBomba = document.getElementById('val-voltaje-bomba');
        
        this.btnZoom = document.getElementById('btn-zoom');
        this.btnRepararBomba = document.getElementById('btn-reparar-bomba');
        
        this.indRPM = document.getElementById('ind-rpm');
        this.indCorrienteBomba = document.getElementById('ind-corriente-bomba');
        this.indCaudal = document.getElementById('ind-caudal');
        this.indTemp = document.getElementById('ind-temp');
        this.panelTeoriaBomba = document.getElementById('panel-teoria-bomba');
        this.estadoAlarma = document.getElementById('estado-alarma');
        this.alarmaSpacer = document.getElementById('alarma-spacer');

        this.particulasAgua = Array.from({length: 150}, () => ({
            x: 0, y: 0, activo: false,
            velY: Math.random() * 2 + 2,
            offsetX: (Math.random() - 0.5) * 40 // Dispersión de la regadera
        }));

        this.ajustarCanvas();
    }

    renderizarPlantilla() {
        this.contenedor.innerHTML = `
            <div class="module-container">
                <div class="canvas-panel" style="position: relative; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-bottom: 15px; min-height: 45px; z-index: 10;">
                        <div id="estado-alarma" style="display:none; flex: 1; text-align: center; color: #FFF; font-weight: bold; padding: 0.8rem; background: rgba(233, 75, 122, 0.9); border-radius: 8px; box-shadow: 0 4px 15px rgba(233,75,122,0.5); margin-right: 15px;"></div>
                        <div style="flex: 1" id="alarma-spacer"></div>
                        <button id="btn-modo-mundo" style="padding: 10px 20px; background: var(--bg-panel-alt); border: 1px solid var(--accent); color: var(--accent); border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.3s; white-space: nowrap;">
                            Ver Mundo Real (Motor DC)
                        </button>
                    </div>
                    <div id="badge-lorentz" style="position: absolute; top: 70px; left: 1rem; color: var(--accent); font-weight: bold; font-size: 0.8rem; background: rgba(0,0,0,0.4); padding: 5px 10px; border-radius: 4px; pointer-events: none;">
                        LABORATORIO DE ELECTROMAGNETISMO
                    </div>
                    
                    <button id="btn-zoom" style="position: absolute; bottom: 2rem; left: 2rem; padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: none; transition: opacity 0.3s;">
                        Inspección Interna (Zoom)
                    </button>
                    <canvas id="canvas-magnetismo" style="cursor: crosshair; background: #050505; border-radius: 8px; width: 100%; height: 100%; min-height: 450px; box-shadow: inset 0 0 50px rgba(0,0,0,0.8);"></canvas>
                </div>

                <div class="controls-panel">
                    <!-- PANEL LORENTZ -->
                    <div id="panel-lorentz">
                        <h2 class="panel-title">${DiccionarioMagnetismo.titulos.principal}</h2>
                    
                    <div style="margin-bottom: 2rem;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                            <span>${DiccionarioMagnetismo.controles.corriente}</span>
                            <span id="val-corriente" style="color: var(--accent); font-weight: bold;">0 A</span>
                        </label>
                        <input type="range" id="slider-corriente" min="-10" max="10" step="0.5" value="0" style="width: 100%; accent-color: var(--accent);">
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                            <span>${DiccionarioMagnetismo.controles.fuerzaIman}</span>
                            <span id="val-fuerza-iman" style="color: #60A5FA; font-weight: bold;">50 T</span>
                        </label>
                        <input type="range" id="slider-fuerza-iman" min="10" max="200" step="5" value="50" style="width: 100%; accent-color: #60A5FA;">
                    </div>

                    <button id="btn-invertir-iman" style="width: 100%; padding: 0.8rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; cursor: pointer; margin-bottom: 1.5rem; transition: 0.3s;">
                        ${DiccionarioMagnetismo.controles.btnInvertir}
                    </button>

                    <label style="display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 0.85rem; cursor: pointer; margin-bottom: 1rem;">
                        <input type="checkbox" id="check-campo" checked style="accent-color: var(--accent);">
                        ${DiccionarioMagnetismo.controles.mostrarCampo}
                    </label>

                    <label style="display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 0.85rem; cursor: pointer; margin-bottom: 2rem;">
                        <input type="checkbox" id="check-vectores" checked style="accent-color: var(--accent);">
                        ${DiccionarioMagnetismo.controles.mostrarVectores}
                    </label>

                    <div style="background: rgba(233, 75, 122, 0.05); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                        <h3 style="font-size: 0.75rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">${DiccionarioMagnetismo.titulos.analisis}</h3>
                        <p id="panel-teoria" style="color: var(--text-primary); font-size: 0.8rem; line-height: 1.6; margin-bottom: 15px;">${DiccionarioMagnetismo.teoria.sinCorriente}</p>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 10px;">
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">F. DE LORENTZ TOTAL</span>
                            <span id="val-fuerza-lorentz" style="color: var(--accent); font-weight: bold; font-family: monospace;">0.00 N</span>
                        </div>
                        <div style="text-align: right; margin-top: 5px; font-size: 0.65rem; color: var(--text-secondary); font-style: italic;">
                            ${DiccionarioMagnetismo.teoria.fuerzaFormula}
                        </div>
                    </div>
                    </div>

                    <!-- PANEL BOMBA -->
                    <div id="panel-bomba" style="display: none;">
                        <h2 class="panel-title" style="margin-bottom: 5px;">${DiccionarioMagnetismo.bomba.titulos.principal}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 20px;">${DiccionarioMagnetismo.bomba.titulos.especificaciones}</p>

                        <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 20px;">
                            <div style="margin-bottom: 1.5rem;">
                                <label style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.85rem;">
                                    <span>Voltaje de Alimentación</span><span id="val-voltaje-bomba" style="color: var(--accent); font-weight: bold;">0 V</span>
                                </label>
                                <input type="range" id="slider-voltaje-bomba" min="0" max="60" step="1" value="0" style="width: 100%; accent-color: var(--accent);">
                                
                                <button id="btn-reparar-bomba" style="display: none; width: 100%; margin-top: 15px; padding: 10px; background: rgba(0,255,0,0.2); border: 1px solid #00FF00; color: #00FF00; border-radius: 4px; cursor: pointer; font-weight: bold;">
                                    REPARAR MOTOR
                                </button>
                            </div>
                        </div>

                        <h3 style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase;">Telemetría en Vivo</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                            <div style="background: var(--bg-base); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;">
                                <span style="font-size: 0.65rem; color: var(--text-secondary);">VELOCIDAD ROTOR</span>
                                <div style="font-size: 1.2rem; color: #60A5FA; font-weight: bold; font-family: monospace;" id="ind-rpm">0 <span style="font-size: 0.7rem; color: var(--text-secondary);">RPM</span></div>
                            </div>
                            <div style="background: var(--bg-base); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;">
                                <span style="font-size: 0.65rem; color: var(--text-secondary);">CORRIENTE (A)</span>
                                <div style="font-size: 1.2rem; color: var(--accent); font-weight: bold; font-family: monospace;" id="ind-corriente-bomba">0.0 <span style="font-size: 0.7rem; color: var(--text-secondary);">A</span></div>
                            </div>
                            <div style="background: var(--bg-base); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;">
                                <span style="font-size: 0.65rem; color: var(--text-secondary);">CAUDAL DE SALIDA</span>
                                <div style="font-size: 1.2rem; color: #34D399; font-weight: bold; font-family: monospace;" id="ind-caudal">0.0 <span style="font-size: 0.7rem; color: var(--text-secondary);">L/min</span></div>
                            </div>
                            <div style="background: var(--bg-base); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;">
                                <span style="font-size: 0.65rem; color: var(--text-secondary);">TEMPERATURA NÚCLEO</span>
                                <div style="font-size: 1.2rem; font-weight: bold; font-family: monospace;" id="ind-temp">25.0 <span style="font-size: 0.7rem; color: var(--text-secondary);">°C</span></div>
                            </div>
                        </div>

                        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                            <h3 style="font-size: 0.75rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">Diagnóstico del Sistema</h3>
                            <p id="panel-teoria-bomba" style="color: var(--text-primary); font-size: 0.8rem; line-height: 1.5;"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    ajustarCanvas() {
        const p = this.canvas.parentElement;
        this.canvas.width = p.clientWidth;
        this.canvas.height = 550;
    }

    mostrarBotonZoom(xMotor, yBase, w, h) {
        this.btnZoom.style.display = 'block';
        this.btnZoom.style.left = `${(xMotor / w) * 100}%`;
        this.btnZoom.style.top = `calc(${(yBase / h) * 100}% - 70px)`; // Un poco arriba del motor
        this.btnZoom.style.bottom = 'auto';
        this.btnZoom.style.transform = 'translateX(-50%)';
    }

    ocultarBotonZoom() {
        this.btnZoom.style.display = 'none';
    }

    actualizarUI(modelo) {
        if (modelo.modoVista === 'diagrama') {
            this.panelLorentz.style.display = 'block';
            this.panelBomba.style.display = 'none';
            this.badgeLorentz.style.display = 'block';
            this.estadoAlarma.style.display = 'none';
            this.alarmaSpacer.style.display = 'block';
            
            this.btnModoMundo.innerText = 'Ver Mundo Real (Motor DC)';
            this.btnModoMundo.style.background = 'var(--bg-panel-alt)';
            this.btnModoMundo.style.color = 'var(--accent)';
            this.canvas.style.background = '#050505';

            this.valCorriente.innerText = `${modelo.corriente.toFixed(1)} A`;
            this.valFuerzaIman.innerText = `${modelo.fuerzaIman} T`;
            
            if (modelo.corriente === 0) {
                this.panelMsj.innerText = DiccionarioMagnetismo.teoria.sinCorriente;
            } else {
                this.panelMsj.innerText = DiccionarioMagnetismo.teoria.conCorriente + " " + DiccionarioMagnetismo.teoria.fuerzaLorentz;
            }

            const fuerzaPromedio = Math.abs(modelo.corriente * modelo.fuerzaIman * 0.01);
            this.valFuerzaLorentz.innerText = `${fuerzaPromedio.toFixed(2)} N`;
        } else {
            this.panelLorentz.style.display = 'none';
            this.panelBomba.style.display = 'block';
            this.badgeLorentz.style.display = 'none';
            
            this.btnModoMundo.innerText = 'Simulacion Técnica';
            this.btnModoMundo.style.background = 'var(--accent)';
            this.btnModoMundo.style.color = 'white';
            this.canvas.style.background = '#0a0c10';

            this.valVoltajeBomba.innerText = `${modelo.voltaje} V`;

            this.indRPM.innerText = Math.floor(modelo.rpm);
            this.indCorrienteBomba.innerText = modelo.corrienteBomba.toFixed(1);
            this.indCaudal.innerText = modelo.caudal.toFixed(1);
            
            this.indTemp.innerText = modelo.temperatura.toFixed(1);
            if (modelo.temperatura > 100) this.indTemp.style.color = '#E94B7A';
            else if (modelo.temperatura > 60) this.indTemp.style.color = 'orange';
            else this.indTemp.style.color = 'white';

            this.btnRepararBomba.style.display = modelo.estadoSistema === 'quemado' ? 'block' : 'none';
            this.sliderVoltajeBomba.disabled = modelo.estadoSistema === 'quemado';
            this.btnZoom.innerText = modelo.zoomActivo ? 'Volver a Vista General' : 'Inspección Interna (Zoom)';

            const estado = modelo.estadoSistema;

            if (estado === 'quemado') {
                this.estadoAlarma.style.display = 'block';
                this.alarmaSpacer.style.display = 'none';
                this.estadoAlarma.style.background = 'rgba(233, 75, 122, 0.9)';
                this.estadoAlarma.innerText = "¡MOTOR QUEMADO! (CORTOCIRCUITO INTERNO)";
                this.panelTeoriaBomba.innerText = DiccionarioMagnetismo.bomba.estados.quemado;
            } else if (estado === 'sobrevoltaje') {
                this.estadoAlarma.style.display = 'block';
                this.alarmaSpacer.style.display = 'none';
                this.estadoAlarma.style.background = 'rgba(255, 165, 0, 0.9)';
                this.estadoAlarma.innerText = "¡PELIGRO! SOBREVOLTAJE DETECTADO (>48V)";
                this.panelTeoriaBomba.innerText = DiccionarioMagnetismo.bomba.estados.sobrevoltaje;
            } else {
                this.estadoAlarma.style.display = 'none';
                this.alarmaSpacer.style.display = 'block';
                this.panelTeoriaBomba.innerText = DiccionarioMagnetismo.bomba.estados[estado] || "";
            }
        }
    }
}