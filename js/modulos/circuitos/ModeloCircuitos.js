/**
 * Clase ModeloCircuitos
 * Gestionamos el estado, la logica matematica y la simulacion fisica de las
 * topologias de circuitos (serie, paralelo y mixto).
 * 
 * Seguimos el principio de Responsabilidad Unica (SOLID): No sabemos nada del DOM ni de graficos,
 * unicamente nos encargamos de calcular Resistencia Equivalente (Req), Corriente (I) y Potencia (P).
 * Si deseas agregar nuevas fisicas (ej. inductancia), define las variables aqui.
 */
export class ModeloCircuitos {
    /**
     * Inicializamos las variables maestras de la simulacion.
     */
    constructor() {
        // Configuracion estructural del circuito
        this.topologia = 'paralelo';
        this.numSerie = 1;
        this.numParalelo = 2;
        this.posicionParalelo = 1; 
        this.secuenciaMixta = []; 
        this.resistencias = []; 
        
        // Parametros fisicos base
        this.voltaje = 120; 
        this.resistenciaBase = 240; 
        this.modoVista = 'diagrama'; 
        
        // Parametros de seguridad y fallas
        this.limiteCorriente = 15.0; 
        this.estadoSistema = 'operativo'; 
        this.focoFundidoIndex = -1; 
        
        this.ordenMixtoMundoReal = 'serie_primero'; 
        
        // Parametros economicos (Tarifa CFE Mexico)
        this.horasUsoDiario = 8;
        this.tarifaKWh = 2.80;
        
        // Almacena la configuracion del usuario en el diagrama tecnico
        // para no perderla al viajar al modo "mundoReal" (casa de 6 cuartos)
        this.memoriaDiagrama = { serie: 1, paralelo: 2, mixta: [], pos: 1 };
        
        // Objeto empaquetador de los resultados fisicos
        this.resultados = { req: 120, iTotal: 1.0, pFocoPrincipal: 60, pFocoSecundario: 60, pMixto: [] };
        
        // Callback para el patron Observer (se asigna desde el Controlador)
        this.alActualizar = null;
        
        this.actualizarArregloResistencias();
    }

    /**
     * Ajustamos la longitud del arreglo de resistencias segun la topologia activa.
     * Si el circuito crece, rellenamos los nuevos espacios con la resistencia base.
     */
    actualizarArregloResistencias() {
        const count = this.topologia === 'serie' ? this.numSerie :
                      this.topologia === 'paralelo' ? this.numParalelo :
                      this.secuenciaMixta.length;

        while (this.resistencias.length < count) {
            this.resistencias.push(this.resistenciaBase);
        }
        
        if (this.resistencias.length > count) {
            this.resistencias.length = count;
        }
        
        // Si el foco quemado ya no existe en el arreglo recortado, reparamos el sistema
        if (this.focoFundidoIndex >= count) this.focoFundidoIndex = -1;
    }

    /**
     * Permitimos modificar individualmente el valor ohmico de un solo componente.
     * @param {number} index - Posicion de la resistencia en el circuito.
     * @param {number|string} valor - Nuevo valor en Ohmios.
     */
    setResistenciaIndividual(index, valor) {
        let val = parseFloat(valor);
        if (isNaN(val) || val <= 0) val = 0.1; // Previene divisiones por cero
        this.resistencias[index] = val;
        this.calcularEstado();
    }

    /**
     * Cambiamos la forma en que los componentes estan interconectados.
     * @param {string} tipo - 'serie', 'paralelo' o 'mixto'.
     */
    setTopologia(tipo) { 
        this.topologia = tipo; 
        if (this.modoVista === 'mundoReal') this.aplicarReglasMundoReal();
        else this.actualizarArregloResistencias(); 
        this.calcularEstado(); 
    }
    
    /**
     * Definimos cuantos componentes habra cuando estamos en modo Serie.
     * @param {number} n - Cantidad de componentes.
     */
    setNumSerie(n) { 
        if (this.modoVista === 'mundoReal') return; // En la casa siempre son 6
        this.numSerie = parseInt(n); 
        this.actualizarArregloResistencias();
        this.calcularEstado(); 
    }
    
    /**
     * Definimos cuantas ramas habra cuando estamos en modo Paralelo.
     * @param {number} n - Cantidad de ramas en paralelo.
     */
    setNumParalelo(n) { 
        if (this.modoVista === 'mundoReal') return;
        this.numParalelo = parseInt(n); 
        this.actualizarArregloResistencias(); 
        this.calcularEstado(); 
    }

    /**
     * En el modo casa (mundo real), permitimos alternar si el bloque principal
     * arranca con conexiones en serie o paralelo.
     * @param {string} orden - 'serie_primero' o 'paralelo_primero'.
     */
    setOrdenMixtoMundoReal(orden) {
        if (this.modoVista !== 'mundoReal' || this.topologia !== 'mixto') return;
        this.ordenMixtoMundoReal = orden;
        this.focoFundidoIndex = -1; // Al reestructurar, reparamos automaticamente
        this.aplicarReglasMundoReal();
        this.calcularEstado();
        this.notificar();
    }

    /**
     * Sumamos un nuevo bloque logico al constructor de topologias mixtas.
     * @param {string} tipo - Bloque ('S_top', 'S_bot' para serie, o 'P' para paralelo).
     */
    agregarComponenteMixto(tipo) {
        if (this.modoVista === 'mundoReal') return;
        if (this.secuenciaMixta.length < 6) { 
            this.secuenciaMixta.push(tipo);
            this.actualizarArregloResistencias();
            this.calcularEstado();
        }
    }
    
    /**
     * Retiramos el ultimo bloque agregado en la secuencia de la topologia mixta.
     */
    eliminarComponenteMixto() {
        if (this.modoVista === 'mundoReal') return;
        if (this.secuenciaMixta.length > 0) {
            this.secuenciaMixta.pop();
            this.actualizarArregloResistencias();
            this.calcularEstado();
        }
    }

    /**
     * Gestionamos la transicion entre el esquema electrico tecnico y la vista del mundo real.
     * Congelamos los valores tecnicos para recuperarlos al salir del mundo real.
     * @param {string} modo - 'diagrama' o 'mundoReal'.
     */
    setModoVista(modo) { 
        this.modoVista = modo; 
        this.focoFundidoIndex = -1; // Se limpia la falla al cambiar de entorno

        if (modo === 'mundoReal') {
            this.memoriaDiagrama = {
                serie: this.numSerie,
                paralelo: this.numParalelo,
                mixta: [...this.secuenciaMixta]
            };
            this.aplicarReglasMundoReal();
        } else {
            this.numSerie = this.memoriaDiagrama.serie;
            this.numParalelo = this.memoriaDiagrama.paralelo;
            this.secuenciaMixta = [...this.memoriaDiagrama.mixta];
            this.actualizarArregloResistencias();
        }
        
        this.calcularEstado();
        this.notificar(); 
    }

    /**
     * Forzamos la estructura del circuito para coincidir con la vista de la casa.
     * Preservamos las resistencias individuales configuradas por el usuario.
     */
    aplicarReglasMundoReal() {
        if (this.topologia === 'serie') {
            this.numSerie = 6;
        } else if (this.topologia === 'paralelo') {
            this.numParalelo = 6;
        } else if (this.topologia === 'mixto') {
            if (this.ordenMixtoMundoReal === 'serie_primero') {
                this.secuenciaMixta = ['S_top', 'S_bot', 'P', 'P', 'P', 'P'];
            } else {
                this.secuenciaMixta = ['P', 'P', 'P', 'P', 'S_bot', 'S_bot'];
            }
        }

        // Rellenamos sin sobreescribir configuraciones previas del usuario
        while (this.resistencias.length < 6) {
            this.resistencias.push(this.resistenciaBase);
        }
        this.resistencias.length = 6;
    }

    /**
     * Modificamos la fuente de poder de nuestro circuito virtual.
     * @param {number} v - Voltios.
     */
    setVoltaje(v) { 
        this.voltaje = parseFloat(v); 
        this.calcularEstado(); 
    }

    /**
     * Provocamos intencionalmente un corte de energia en un componente para evaluar su impacto.
     * @param {number} index - Indice del componente a danar.
     */
    simularFalla(index) {
        this.focoFundidoIndex = parseInt(index);
        this.calcularEstado();
    }

    /**
     * Restauramos el componente danado.
     */
    reparar() {
        this.focoFundidoIndex = -1;
        this.calcularEstado();
    }

    /**
     * Ajustamos el tiempo de uso diario para el calculo del recibo de luz.
     * @param {number} h - Horas de uso al dia.
     */
    setHorasUso(h) {
        let val = parseFloat(h);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 24) val = 24;
        this.horasUsoDiario = val;
        this.notificar();
    }

    /**
     * MOTOR MATEMATICO PRINCIPAL
     * Calculamos Req, I total y Potencias usando las Leyes de Kirchhoff y de Ohm.
     * Si un componente esta danado, asumimos R = Infinity para propagar cortes de linea.
     */
    calcularEstado() {
        let req = 0, iTotal = 0;
        let pMixto = [];

        // Generamos un arreglo paralelo simulando el foco roto con resistencia Infinita
        const resEfectivas = this.resistencias.map((r, i) => i === this.focoFundidoIndex ? Infinity : r);

        if (this.topologia === 'serie') {
            // Req = R1 + R2 + R3 ...
            req = resEfectivas.reduce((a, b) => a + b, 0);
            if (req === 0) req = 0.0001; // Evitar crash por corto
            
            iTotal = this.voltaje / req; // Ley de Ohm: I = V / R
            
            // Potencia disipada = I^2 * R
            pMixto = resEfectivas.map(r => r === Infinity ? 0 : (iTotal * iTotal) * r);
        } 
        else if (this.topologia === 'paralelo') {
            // 1/Req = 1/R1 + 1/R2 ...
            let invReq = resEfectivas.reduce((a, b) => a + (1 / b), 0); 
            req = invReq > 0 ? 1 / invReq : Infinity;
            
            iTotal = this.voltaje / req;
            
            // En paralelo el voltaje es constante en todas las ramas, Potencia = V^2 / R
            pMixto = resEfectivas.map(r => (this.voltaje * this.voltaje) / r);
        } 
        else if (this.topologia === 'mixto') {
            if (this.modoVista === 'mundoReal' && this.ordenMixtoMundoReal === 'paralelo_primero') {
                // Evaluamos sub-bloque paralelo
                let invReqP = 0;
                for (let i = 0; i < 4; i++) { if (resEfectivas[i] !== Infinity) invReqP += 1 / resEfectivas[i]; }
                let reqP = invReqP > 0 ? 1 / invReqP : Infinity;

                // Evaluamos sub-bloque serie
                let reqS = (resEfectivas[4] === Infinity || resEfectivas[5] === Infinity) ? Infinity : resEfectivas[4] + resEfectivas[5];

                req = reqP === Infinity || reqS === Infinity ? Infinity : reqP + reqS;
                if (req === 0) req = 0.0001; 
                
                iTotal = this.voltaje / req;
                
                // Reparto de energia y corriente dependiendo del bloque
                for (let i = 0; i < 6; i++) {
                    if (resEfectivas[i] === Infinity) { pMixto[i] = 0; }
                    else if (i < 4) { 
                        let vP = reqP === Infinity ? 0 : iTotal * reqP; // Voltaje del nodo paralelo
                        let iBranch = vP / resEfectivas[i]; // Corriente por esa rama especifica
                        pMixto[i] = (iBranch * iBranch) * resEfectivas[i];
                    } else { 
                        pMixto[i] = (iTotal * iTotal) * resEfectivas[i]; // Potencia en los nodos en serie
                    }
                }
            } else if (this.secuenciaMixta.length > 0) {
                // Algoritmo dinamico para cualquier combinacion en el constructor tecnico
                let r_equiv_at_node = new Array(this.secuenciaMixta.length);
                let r_acc = (this.secuenciaMixta[this.secuenciaMixta.length - 1] === 'P') ? Infinity : 0;
                
                // Se recorre desde el final hacia el generador
                for (let i = this.secuenciaMixta.length - 1; i >= 0; i--) {
                    let comp = this.secuenciaMixta[i];
                    let r_val = resEfectivas[i];
                    if (comp === 'S_top' || comp === 'S_bot') { 
                        r_acc += r_val; 
                        r_equiv_at_node[i] = r_acc; 
                    } 
                    else if (comp === 'P') {
                        if (r_acc === 0 || r_val === 0) r_acc = 0; 
                        else if (r_acc === Infinity) r_acc = r_val;
                        else if (r_val === Infinity) r_acc = r_acc; 
                        else r_acc = (r_acc * r_val) / (r_acc + r_val);
                        r_equiv_at_node[i] = r_acc;
                    }
                }
                req = r_acc;
                if (req === 0) req = 0.0001; 
                iTotal = this.voltaje / req;
                
                // Segunda pasada de inicio a fin para el calculo preciso de potencias locales
                let current_I = iTotal;
                for (let i = 0; i < this.secuenciaMixta.length; i++) {
                    let comp = this.secuenciaMixta[i];
                    let r_val = resEfectivas[i];
                    if (comp === 'S_top' || comp === 'S_bot') {
                        pMixto[i] = r_val === Infinity ? 0 : (current_I * current_I) * r_val;
                    } else if (comp === 'P') {
                        let v_parallel = current_I * r_equiv_at_node[i];
                        let i_branch = r_val === Infinity ? 0 : v_parallel / r_val;
                        pMixto[i] = r_val === Infinity ? 0 : (i_branch * i_branch) * r_val;
                        current_I = current_I - i_branch; // Ley de Kirchhoff (nodos)
                    }
                }
            }
        }

        // Sistema de proteccion. Evalua fallos termicos.
        if (iTotal > this.limiteCorriente) {
            this.estadoSistema = 'sobrecarga';
            iTotal = 0; if (pMixto.length > 0) pMixto.fill(0);
        } else if (this.topologia === 'mixto' && this.secuenciaMixta.length === 0) {
            this.estadoSistema = 'abierto'; 
        } else {
            this.estadoSistema = 'operativo';
        }

        // Guarda y emite los resultados para la Vista
        this.resultados = { req, iTotal, pMixto };
        this.notificar();
    }

    /**
     * Despachamos el aviso para que todo lo visual escuche el cambio y redibuje.
     */
    notificar() { 
        if (this.alActualizar) this.alActualizar(); 
    }
}