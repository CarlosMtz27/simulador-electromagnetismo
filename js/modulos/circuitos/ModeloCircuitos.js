export class ModeloCircuitos {
    constructor() {
        // inicializamos las variables con las que arrancara nuestra simulacion
        this.topologia = 'paralelo';
        this.numSerie = 1;
        this.numParalelo = 2;
        this.posicionParalelo = 1; 
        this.secuenciaMixta = []; 
        this.resistencias = []; 
        
        this.voltaje = 120; 
        this.resistenciaBase = 240; 
        this.modoVista = 'diagrama'; 
        
        this.limiteCorriente = 15.0; 
        this.estadoSistema = 'operativo'; 
        this.focoFundidoIndex = -1; 
        
        this.ordenMixtoMundoReal = 'serie_primero'; 
        // guardamos la configuracion del usuario en esta memoria para no perderla al pasar a la casa fija
        this.memoriaDiagrama = { serie: 1, paralelo: 2, mixta: [], pos: 1 };
        
        // preparamos el objeto donde guardaremos todos los calculos matematicos
        this.resultados = { req: 120, iTotal: 1.0, pFocoPrincipal: 60, pFocoSecundario: 60, pMixto: [] };
        this.alActualizar = null;
        
        this.actualizarArregloResistencias();
    }

    actualizarArregloResistencias() {
        // contamos cuantos componentes tenemos activos segun la topologia que elegimos
        const count = this.topologia === 'serie' ? this.numSerie :
                      this.topologia === 'paralelo' ? this.numParalelo :
                      this.secuenciaMixta.length;

        // rellenamos el arreglo de resistencias hasta alcanzar la cantidad necesaria
        while (this.resistencias.length < count) {
            this.resistencias.push(this.resistenciaBase);
        }
        // si tenemos componentes de sobra, los recortamos
        if (this.resistencias.length > count) {
            this.resistencias.length = count;
        }
        if (this.focoFundidoIndex >= count) this.focoFundidoIndex = -1;
    }

    setResistenciaIndividual(index, valor) {
        // validamos el input y actualizamos el valor individual de una resistencia especifica
        let val = parseFloat(valor);
        if (isNaN(val) || val <= 0) val = 0.1; 
        this.resistencias[index] = val;
        this.calcularEstado();
    }

    setTopologia(tipo) { 
        // cambiamos el modo de conexion de nuestro circuito
        this.topologia = tipo; 
        if (this.modoVista === 'mundoReal') this.aplicarReglasMundoReal();
        else this.actualizarArregloResistencias(); 
        this.calcularEstado(); 
    }
    
    setNumSerie(n) { 
        // bloqueamos el cambio manual si estamos en la vista del mundo real
        if (this.modoVista === 'mundoReal') return; 
        this.numSerie = parseInt(n); 
        this.actualizarArregloResistencias();
        this.calcularEstado(); 
    }
    
    setNumParalelo(n) { 
        // ajustamos cuantas ramas paralelas queremos dibujar
        if (this.modoVista === 'mundoReal') return;
        this.numParalelo = parseInt(n); 
        this.actualizarArregloResistencias(); 
        this.calcularEstado(); 
    }

    setOrdenMixtoMundoReal(orden) {
        // alternamos entre iniciar con serie o con paralelo en el modo casa
        if (this.modoVista !== 'mundoReal' || this.topologia !== 'mixto') return;
        this.ordenMixtoMundoReal = orden;
        this.focoFundidoIndex = -1; // reparamos automaticamente si cambiamos la estructura
        this.aplicarReglasMundoReal();
        this.calcularEstado();
        this.notificar();
    }

    agregarComponenteMixto(tipo) {
        // anadimos un nuevo bloque a nuestra cadena de topologia mixta
        if (this.modoVista === 'mundoReal') return;
        if (this.secuenciaMixta.length < 6) { 
            this.secuenciaMixta.push(tipo);
            this.actualizarArregloResistencias();
            this.calcularEstado();
        }
    }
    
    eliminarComponenteMixto() {
        // removemos el ultimo bloque que pusimos en la secuencia mixta
        if (this.modoVista === 'mundoReal') return;
        if (this.secuenciaMixta.length > 0) {
            this.secuenciaMixta.pop();
            this.actualizarArregloResistencias();
            this.calcularEstado();
        }
    }

    // TRANSICIÓN MUNDO REAL / DIAGRAMA
    setModoVista(modo) { 
        this.modoVista = modo; 
        this.focoFundidoIndex = -1; // siempre reparamos cualquier fallo al cambiar de vista

        if (modo === 'mundoReal') {
            // almacenamos la configuracion actual para recuperarla luego
            this.memoriaDiagrama = {
                serie: this.numSerie,
                paralelo: this.numParalelo,
                mixta: [...this.secuenciaMixta]
            };
            this.aplicarReglasMundoReal();
        } else {
            // restauramos los ajustes que el usuario tenia en el diagrama
            this.numSerie = this.memoriaDiagrama.serie;
            this.numParalelo = this.memoriaDiagrama.paralelo;
            this.secuenciaMixta = [...this.memoriaDiagrama.mixta];
            this.actualizarArregloResistencias();
        }
        
        this.calcularEstado();
        this.notificar(); 
    }

    aplicarReglasMundoReal() {
        // la casa tiene 6 cuartos fijos, forzamos la estructura para que cuadre con nuestro dibujo
        if (this.topologia === 'serie') {
            this.numSerie = 6;
        } else if (this.topologia === 'paralelo') {
            this.numParalelo = 6;
        } else if (this.topologia === 'mixto') {
            if (this.ordenMixtoMundoReal === 'serie_primero') {
                this.secuenciaMixta = ['S_top', 'S_bot', 'P', 'P', 'P', 'P'];
            } else {
                // usamos 4 ramas en paralelo primero, luego pasamos por 2 en serie al final
                this.secuenciaMixta = ['P', 'P', 'P', 'P', 'S_bot', 'S_bot'];
            }
        }
        
        // regresamos todas las resistencias a su valor normal para que la casa funcione estable
        this.resistencias = [];
        this.actualizarArregloResistencias();
    }

    setVoltaje(v) { this.voltaje = parseFloat(v); this.calcularEstado(); }

    // MÉTODOS DE FALLA ESPECÍFICA
    simularFalla(index) {
        // causamos intencionalmente la ruptura del filamento en un foco
        this.focoFundidoIndex = parseInt(index);
        this.calcularEstado();
    }

    reparar() {
        // arreglamos cualquier cortocircuito o foco fundido restableciendo el sistema
        this.focoFundidoIndex = -1;
        this.calcularEstado();
    }

    // MOTOR MATEMÁTICO (Se mantiene idéntico, soporta fallas)
    calcularEstado() {
        // declaramos nuestras variables maestras para recopilar toda la matematica
        let req = 0, iTotal = 0, pFocoPrincipal = 0, pFocoSecundario = 0;
        let pMixto = [];

        // si simulamos un fallo, hacemos que la resistencia de ese componente sea infinita
        const resEfectivas = this.resistencias.map((r, i) => i === this.focoFundidoIndex ? Infinity : r);

        if (this.topologia === 'serie') {
            // sumamos directamente todas las resistencias porque estan en una sola linea
            req = resEfectivas.reduce((a, b) => a + b, 0);
            if (req === 0) req = 0.0001;
            // extraemos los amperios directamente (si req es Infinity, JS lo convierte a 0)
            iTotal = this.voltaje / req;
            pMixto = resEfectivas.map(r => r === Infinity ? 0 : (iTotal * iTotal) * r);
        } 
        else if (this.topologia === 'paralelo') {
            // calculamos la inversa de la suma de las inversas para ramas independientes
            let invReq = resEfectivas.reduce((a, b) => a + (1 / b), 0); 
            req = invReq > 0 ? 1 / invReq : Infinity;
            iTotal = this.voltaje / req;
            // simplificamos aprovechando la matematica nativa para omitir el ternario
            pMixto = resEfectivas.map(r => (this.voltaje * this.voltaje) / r);
        } 
        else if (this.topologia === 'mixto') {
            if (this.modoVista === 'mundoReal' && this.ordenMixtoMundoReal === 'paralelo_primero') {
                // calculamos por separado las cargas del bloque en paralelo y el bloque en serie
                let invReqP = 0;
                for (let i = 0; i < 4; i++) { if (resEfectivas[i] !== Infinity) invReqP += 1 / resEfectivas[i]; }
                let reqP = invReqP > 0 ? 1 / invReqP : Infinity;

                let reqS = (resEfectivas[4] === Infinity || resEfectivas[5] === Infinity) ? Infinity : resEfectivas[4] + resEfectivas[5];

                // sumamos ambos sub bloques para encontrar la resistencia equivalente total
                req = reqP === Infinity || reqS === Infinity ? Infinity : reqP + reqS;
                if (req === 0) req = 0.0001; 
                iTotal = this.voltaje / req;
                
                for (let i = 0; i < 6; i++) {
                    if (resEfectivas[i] === Infinity) { pMixto[i] = 0; }
                    else if (i < 4) { 
                        // aplicamos ley de ohm unicamente sobre la seccion paralela
                        let vP = reqP === Infinity ? 0 : iTotal * reqP;
                        let iBranch = vP / resEfectivas[i];
                        pMixto[i] = (iBranch * iBranch) * resEfectivas[i];
                    } else { 
                        // aplicamos ley de ohm para los que comparten la linea maestra en serie
                        pMixto[i] = (iTotal * iTotal) * resEfectivas[i];
                    }
                }
            } else if (this.secuenciaMixta.length > 0) {
                // resolvemos la topologia mixta recorriendola de fin a inicio para ir compactando las resistencias
                let r_equiv_at_node = new Array(this.secuenciaMixta.length);
                let r_acc = (this.secuenciaMixta[this.secuenciaMixta.length - 1] === 'P') ? Infinity : 0;
                
                for (let i = this.secuenciaMixta.length - 1; i >= 0; i--) {
                    let comp = this.secuenciaMixta[i];
                    let r_val = resEfectivas[i];
                    if (comp === 'S_top' || comp === 'S_bot') { r_acc += r_val; r_equiv_at_node[i] = r_acc; } 
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
                
                // distribuimos la corriente descubriendo cuanto toma cada brazo de la red
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
                        current_I = current_I - i_branch; 
                    }
                }
            }
        }

        // revisamos si los amperios totales exceden nuestro factor de seguridad
        if (iTotal > this.limiteCorriente) {
            this.estadoSistema = 'sobrecarga';
            iTotal = 0; if (pMixto.length > 0) pMixto.fill(0);
        } else if (this.topologia === 'mixto' && this.secuenciaMixta.length === 0) {
            this.estadoSistema = 'abierto'; 
        } else {
            this.estadoSistema = 'operativo';
        }

        // empaquetamos todos nuestros hallazgos matematicos
        this.resultados = { req, iTotal, pMixto };
        this.notificar();
    }

    // lanzamos el aviso para que el controlador mueva la interfaz
    notificar() { if (this.alActualizar) this.alActualizar(); }
}