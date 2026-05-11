/**
 * Clase RenderizadorMundoReal
 * Nos encargamos de dibujar la representacion realista de una casa con 6 habitaciones,
 * mostrando el cableado, los focos y simulando fallas fisicas de forma interactiva.
 */
export class RenderizadorMundoReal {
    /**
     * Dibujamos el escenario principal del mundo real, incluyendo el fondo, 
     * el cableado electrico, los focos y el centro de carga (breaker).
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del area de dibujo.
     * @param {number} h - Alto del area de dibujo.
     * @param {Object} modelo - El estado logico y fisico del circuito.
     * @param {Object} resultados - Los calculos matematicos de potencia y corriente.
     * @param {Array} particulas - Lista de electrones para animar la corriente.
     */
    static dibujar(ctx, w, h, modelo, resultados, particulas = []) {
        // Limpiamos el lienzo por completo para preparar el nuevo frame
        ctx.clearRect(0, 0, w, h);
        
        // Aplicamos una capa oscura sobre todo el canvas para simular que la habitacion esta a oscuras
        ctx.fillStyle = 'rgba(10, 12, 16, 0.75)';
        ctx.fillRect(0, 0, w, h);

        const estado = modelo.estadoSistema;
        // Definimos el color del cable: lo pintamos rojo si hay problemas, si no lo dejamos color cobre
        const cableColor = estado === 'sobrecarga' ? '#FF3333' : '#D4AF37';

        // Preparamos el pincel para que las lineas se vean gruesas y redondeadas
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = cableColor;
        
        // Si tenemos una sobrecarga, le agregamos un efecto de brillo rojo al cable para indicar peligro
        if (estado === 'sobrecarga') {
            ctx.shadowBlur = 15; ctx.shadowColor = 'red';
        } else {
            ctx.shadowBlur = 0;
        }

        // Guardamos las coordenadas exactas donde ubicaremos los 6 focos en la pantalla
        const pos = [
            { x: w * 0.20, y: h * 0.30 }, // 0: Arriba Izq
            { x: w * 0.50, y: h * 0.30 }, // 1: Arriba Centro
            { x: w * 0.80, y: h * 0.30 }, // 2: Arriba Der
            { x: w * 0.20, y: h * 0.75 }, // 3: Abajo Izq
            { x: w * 0.50, y: h * 0.75 }, // 4: Abajo Centro
            { x: w * 0.80, y: h * 0.75 }  // 5: Abajo Der
        ];

        // Calculamos posiciones clave como la ubicacion del breaker y la altura por donde pasaran los cables
        const xBreaker = w * 0.05; 
        const yBreaker = h * 0.50; 
        const yTechoArriba = pos[0].y - 40;
        const yTechoAbajo = pos[3].y - 40;
        const xTroncal = pos[2].x + 30;

        // Empezamos a trazar todo el cableado basandonos en la topologia elegida
        ctx.beginPath();
        if (modelo.topologia === 'serie') {
            const rutas = this.obtenerRutaSerie(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
            this.trazarRutas(ctx, rutas);
        } else if (modelo.topologia === 'paralelo') {
            const rutas = this.obtenerRutasParalelo(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
            this.trazarRutas(ctx, rutas);
        } else if (modelo.topologia === 'mixto') {
            if (modelo.secuenciaMixta[0].startsWith('S')) {
                const rutas = this.obtenerRutasMixtoSeriePrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
                this.trazarRutas(ctx, rutas);
            } else {
                const rutas = this.obtenerRutasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
                this.trazarRutas(ctx, rutas);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Sobredibujamos el cable del foco fundido en color oscuro y colocamos un simbolo
        // de circuito abierto en cualquier topologia para dejar claro donde se interrumpio la corriente.
        if (modelo.focoFundidoIndex !== -1) {
            this.dibujarRamaMuerta(
                ctx, pos, modelo.focoFundidoIndex,
                yTechoArriba, yTechoAbajo
            );
        }

        // Revisamos y dibujamos uno por uno los componentes de luz
        for(let i = 0; i < 6; i++) {
            const potencia = resultados.pMixto[i] || 0;
            // Comprobamos si quemamos especificamente este foco
            const estaFundido = (i === modelo.focoFundidoIndex);
            
            // Le asignamos una etiqueta para que podamos distinguir facilmente la topologia local
            let etiqueta = '';
            if (modelo.topologia === 'serie') etiqueta = 'S';
            else if (modelo.topologia === 'paralelo') etiqueta = 'P';
            else if (modelo.topologia === 'mixto') etiqueta = modelo.secuenciaMixta[i].startsWith('S') ? 'S' : 'P';

            // Enviamos a pintar el foco con toda su logica
            this.dibujarFocoEdison(ctx, pos[i].x, pos[i].y, potencia, estaFundido, etiqueta);
        }

        // Dibujamos el interruptor de proteccion en la pared
        this.dibujarBreaker(ctx, xBreaker, yBreaker, estado);
        
        if (particulas.length > 0) {
            this.dibujarElectronesEnCables(ctx, w, h, modelo, resultados, particulas);
        }
    }

    /**
     * Sobredibujamos los dos cables cortos (Fase + Neutro) de la rama del foco fundido
     * en color muy oscuro y anadimos un simbolo de circuito abierto en el punto de
     * conexion con el tronco. Asi es inmediatamente obvio que esa rama esta muerta.
     *
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {Array} pos - Arreglo con las posiciones de los focos.
     * @param {number} focoIndex - Indice del foco quemado.
     * @param {number} yTechoArriba - Coordenada vertical del techo superior.
     * @param {number} yTechoAbajo - Coordenada vertical del techo inferior.
     */
    static dibujarRamaMuerta(ctx, pos, focoIndex, yTechoArriba, yTechoAbajo) {
        const i = focoIndex;
        const yTecho = i < 3 ? yTechoArriba : yTechoAbajo;
        const x  = pos[i].x;
        const yTop = pos[i].y - 25; // tope del conector del foco

        ctx.save();
        ctx.shadowBlur = 0;

        // 1. Sobredibujamos el cable de la rama muerta con color negro
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, yTecho);
        ctx.lineTo(x, yTop);
        ctx.stroke();

        // 2. Trazamos el simbolo de circuito abierto en el tronco
        // Dibujamos un pequeno circulo rosa/rojo con una linea interior que simula cortar el paso.
        const xM = x;
        const R  = 5;

        // Dibujamos el circulo exterior de acento
        ctx.strokeStyle = '#E94B7A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(xM, yTecho, R, 0, Math.PI * 2);
        ctx.stroke();

        // Trazamos la linea interior que visualmente corta el cable
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(xM - R + 1, yTecho);
        ctx.lineTo(xM + R - 1, yTecho);
        ctx.stroke();

        // 3. Colocamos la etiqueta textual de abierto sobre el punto de corte
        ctx.fillStyle = 'rgba(233, 75, 122, 0.9)';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ABIERTO', x, yTecho - 11);

        ctx.restore();
    }

    /**
     * Trazamos y animamos los electrones a lo largo de las rutas activas del circuito.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del lienzo.
     * @param {number} h - Alto del lienzo.
     * @param {Object} modelo - Datos de la topologia y el estado del sistema.
     * @param {Object} resultados - Resultados de corriente total.
     * @param {Array} particulas - Lista de objetos de particulas.
     */
    static dibujarElectronesEnCables(ctx, w, h, modelo, resultados, particulas) {
        if (modelo.estadoSistema !== 'operativo' || resultados.iTotal < 0.001) return;
        
        const pos = [
            { x: w * 0.20, y: h * 0.30 }, { x: w * 0.50, y: h * 0.30 }, { x: w * 0.80, y: h * 0.30 },
            { x: w * 0.20, y: h * 0.75 }, { x: w * 0.50, y: h * 0.75 }, { x: w * 0.80, y: h * 0.75 }
        ];
        const xBreaker = w * 0.05; const yBreaker = h * 0.50; 
        const yTechoArriba = pos[0].y - 40; const yTechoAbajo = pos[3].y - 40;
        const xTroncal = pos[2].x + 30; 

        // Evaluamos cuales ramas o rutas siguen vivas para que los electrones fluyan por ellas
        let rutasActivas = [];
        if (modelo.topologia === 'serie' && modelo.focoFundidoIndex === -1) {
            rutasActivas = this.obtenerRutaSerie(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
        } else if (modelo.topologia === 'paralelo') {
            const rutasParticulas = this.obtenerRutasParticulasParalelo(
                pos, xBreaker, yBreaker,
                yTechoArriba, yTechoAbajo, xTroncal
            );

            let algunFocoActivo = false;
            for (let i = 0; i < 6; i++) {
                if (i !== modelo.focoFundidoIndex) {
                    // Cada ruta individual es un circuito completo breaker -> tronco -> foco -> tronco -> breaker
                    rutasActivas.push(rutasParticulas[i + 1]);
                    algunFocoActivo = true;
                }
            }

            // Cuando detectamos un foco fundido, omitimos las rutas del tronco principal.
            // El tronco recorre el perimetro completo y pasa por el punto de conexion
            // del foco muerto, lo que haria que las particulas parecieran llegar hasta ahi.
            // Al usar solo las rutas individuales de ramas activas, aseguramos que las particulas
            // unicamente fluyan en los caminos que realmente tienen corriente.
            // Si el circuito no tiene fallas, si anadimos el tronco para mayor densidad visual.
            if (algunFocoActivo && modelo.focoFundidoIndex === -1) {
                rutasActivas.push(rutasParticulas[0]);
            }

        } else if (modelo.topologia === 'mixto') {
            if (modelo.secuenciaMixta[0].startsWith('S')) {
                if (modelo.focoFundidoIndex !== 0 && modelo.focoFundidoIndex !== 1) {
                    const rutasParticulas = this.obtenerRutasParticulasMixtoSeriePrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
                    let algunFocoActivo = false;
                    for (let i of [2, 3, 4, 5]) {
                        if (i !== modelo.focoFundidoIndex) {
                            rutasActivas.push(rutasParticulas[i]);
                            algunFocoActivo = true;
                        }
                    }
                    if (algunFocoActivo && modelo.focoFundidoIndex === -1) {
                        rutasActivas.push(rutasParticulas['tronco']);
                    }
                }
            } else {
                if (modelo.focoFundidoIndex !== 4 && modelo.focoFundidoIndex !== 5) {
                    const rutasParticulas = this.obtenerRutasParticulasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal);
                    let algunFocoActivo = false;
                    for (let i of [0, 1, 2, 3]) {
                        if (i !== modelo.focoFundidoIndex) {
                            rutasActivas.push(rutasParticulas[i]);
                            algunFocoActivo = true;
                        }
                    }
                    if (algunFocoActivo && modelo.focoFundidoIndex === -1) {
                        rutasActivas.push(rutasParticulas['tronco']);
                    }
                }
            }
        }
        if (rutasActivas.length === 0) return;

        const velocidad = Math.min(resultados.iTotal * 0.25, 1.5);
        ctx.fillStyle = '#00E5FF'; ctx.shadowBlur = 6; ctx.shadowColor = '#00E5FF';

        // Distribuimos inteligentemente los electrones entre las ramas que esten sanas
        particulas.forEach((p, index) => {
            p.prog = (p.prog + velocidad) % 100;
            const rutaAsignada = rutasActivas[index % rutasActivas.length];
            const posP = this.obtenerPosicionRuta(rutaAsignada, p.prog);
            ctx.beginPath(); ctx.arc(posP.x, posP.y, 2.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    /**
     * Dibujamos un foco estilo Edison, incluyendo su base, cristal, filamento 
     * y el resplandor de luz dependiendo de la potencia disipada.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} x - Posicion horizontal.
     * @param {number} y - Posicion vertical.
     * @param {number} potencia - Potencia electrica del foco en Watts.
     * @param {boolean} estaFundido - Indica si el componente esta roto.
     * @param {string} etiqueta - Texto para identificar su conexion (S o P).
     */
    static dibujarFocoEdison(ctx, x, y, potencia, estaFundido, etiqueta) {
        // Determinamos el nivel de intensidad en funcion de la energia simulada
        const ratio = Math.min((potencia / 60), 1); 
        const r = Math.floor(30 + ratio * (255 - 30));
        const g = Math.floor(30 + ratio * (191 - 30));
        const b = Math.floor(30 + ratio * (0 - 30));

        // Si recibe energia y no esta quemado, proyectamos una luz radial en la pared posterior
        if (ratio > 0.01 && !estaFundido) {
            const radioLuz = 180 * ratio; 
            const grad = ctx.createRadialGradient(x, y, 10, x, y, radioLuz);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.5 * ratio})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.globalCompositeOperation = 'source-over'; 
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, radioLuz, 0, Math.PI*2); ctx.fill();
        }

        // Si le pasamos una etiqueta, pintamos el cuadrito flotante cerca de la base
        if (etiqueta) {
            const colorEtiqueta = etiqueta === 'S' ? 'rgba(233, 75, 122, 0.9)' : 'rgba(0, 200, 255, 0.9)';
            ctx.fillStyle = colorEtiqueta;
            ctx.beginPath();
            ctx.roundRect(x + 15, y - 25, 18, 18, 4);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(etiqueta, x + 24, y - 12);
        }

        // Construimos la base negra del conector
        ctx.fillStyle = '#111'; ctx.fillRect(x - 8, y - 25, 16, 8);

        // Formamos la silueta de cristal usando curvas bezier
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 17);
        ctx.bezierCurveTo(x - 20, y, x - 18, y + 25, x, y + 25);
        ctx.bezierCurveTo(x + 18, y + 25, x + 20, y, x + 8, y - 17);
        ctx.closePath();
        ctx.fillStyle = ratio > 0 && !estaFundido ? `rgba(${r}, ${g}, ${b}, ${0.2 + ratio * 0.4})` : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();

        // Si provocamos una falla critica, cortamos el filamento por la mitad y ponemos una marca roja
        if (estaFundido) {
            ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x - 3, y - 10); ctx.lineTo(x - 5, y); ctx.stroke(); 
            ctx.fillStyle = '#E94B7A'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('X', x, y + 10);
        } else {
            // Si todo esta bien, dibujamos el alambre continuo interno
            ctx.strokeStyle = ratio > 0 ? '#FFF' : '#333'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x - 3, y - 10); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x, y + 15); ctx.lineTo(x + 5, y + 5); ctx.lineTo(x + 3, y - 10); ctx.stroke();

            // Coronamos con un resplandor fuerte justo en el nucleo del filamento
            if (ratio > 0.05) {
                ctx.shadowBlur = 60 * ratio; ctx.shadowColor = '#FFBF00';
                ctx.fillStyle = `rgb(255, 255, 200)`;
                ctx.beginPath(); ctx.arc(x, y + 5, 8, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    static dibujarBreaker(ctx, x, y, estado) {
        // Creamos la caja externa de los fusibles
        ctx.fillStyle = '#1e212b'; ctx.fillRect(x - 10, y - 20, 20, 40);
        ctx.strokeStyle = '#4A4A4A'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 10, y - 20, 20, 40);
        // Colocamos un diodo LED que cambiara a rojo si simulamos un corto o a verde si el sistema es estable
        ctx.fillStyle = estado === 'sobrecarga' ? '#FF3333' : '#00FF00';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
    }

    // ====================================================================
    // GENERADORES DE RUTAS (MATEMATICA Y TRAZADOS)
    // ====================================================================
    
    static trazarRutas(ctx, rutas) {
        rutas.forEach(ruta => {
            if (ruta.length === 0) return;
            ctx.moveTo(ruta[0].x, ruta[0].y);
            for(let i=1; i<ruta.length; i++) ctx.lineTo(ruta[i].x, ruta[i].y);
        });
    }

    /**
     * Calculamos las coordenadas exactas de una particula a lo largo de un camino
     * basandonos en su porcentaje de progreso.
     * 
     * @param {Array} ruta - Arreglo de puntos de la trayectoria.
     * @param {number} progreso - Valor de 0 a 100 indicando el avance.
     * @returns {Object} Coordenadas x, y resultantes.
     */
    static obtenerPosicionRuta(ruta, progreso) {
        let longitudTotal = 0;
        const distancias = [];
        for(let i=0; i<ruta.length - 1; i++) {
            const d = Math.sqrt((ruta[i+1].x - ruta[i].x)**2 + (ruta[i+1].y - ruta[i].y)**2);
            distancias.push(d); longitudTotal += d;
        }
        let distanciaObjetivo = (progreso / 100) * longitudTotal;
        for(let i=0; i<ruta.length - 1; i++) {
            if (distanciaObjetivo <= distancias[i] || i === ruta.length - 2) {
                const t = distancias[i] > 0 ? distanciaObjetivo / distancias[i] : 0;
                return { x: ruta[i].x + (ruta[i+1].x - ruta[i].x) * t, y: ruta[i].y + (ruta[i+1].y - ruta[i].y) * t };
            }
            distanciaObjetivo -= distancias[i];
        }
        return ruta[ruta.length-1];
    }

    /**
     * Generamos el camino para el cableado cuando la topologia es en serie.
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncal - Posicion X del conducto principal derecho.
     * @returns {Array} Lista con la ruta trazada.
     */
    static obtenerRutaSerie(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const ruta = [];
        ruta.push({x: xBreaker, y: yBreaker}); ruta.push({x: xBreaker, y: yTechoArriba});
        for(let i=0; i<3; i++) {
            ruta.push({x: pos[i].x, y: yTechoArriba}); 
            ruta.push({x: pos[i].x, y: pos[i].y - 25});
            ruta.push({x: pos[i].x, y: yTechoArriba});
        }
        ruta.push({x: xTroncal, y: yTechoArriba}); ruta.push({x: xTroncal, y: yTechoAbajo});
        for(let i=5; i>=3; i--) {
            ruta.push({x: pos[i].x, y: yTechoAbajo}); 
            ruta.push({x: pos[i].x, y: pos[i].y - 25});
            ruta.push({x: pos[i].x, y: yTechoAbajo});
        }
        ruta.push({x: xBreaker, y: yTechoAbajo}); ruta.push({x: xBreaker, y: yBreaker});
        return [ruta]; 
    }

    /**
     * Trazamos los caminos paralelos para el diagrama del mundo real.
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncal - Posicion X del conducto principal derecho.
     * @returns {Array} Lista de rutas para el cableado.
     */
    static obtenerRutasParalelo(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const rutas = [];
        
        // Trazamos el recuadro principal
        rutas.push([
            {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yTechoArriba}, 
            {x: xTroncal, y: yTechoArriba}, {x: xTroncal, y: yTechoAbajo}, 
            {x: xBreaker, y: yTechoAbajo}, {x: xBreaker, y: yBreaker}
        ]);

        // Trazamos un tramo por cada foco
        for(let i=0; i<6; i++) {
            const yTecho = i < 3 ? yTechoArriba : yTechoAbajo;
            
            const ruta = [];
            ruta.push({x: pos[i].x, y: yTecho}); 
            ruta.push({x: pos[i].x, y: pos[i].y - 25}); 
            rutas.push(ruta);
        }
        return rutas;
    }

    /**
     * Generamos las rutas especificas para animar las particulas en paralelo.
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncalL - Posicion X del conducto principal derecho.
     * @returns {Array} Rutas para la animacion de electrones.
     */
    static obtenerRutasParticulasParalelo(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncalL) {
        const rutas = [];
        // Generamos la ruta base correspondiente al tronco completo (usada solo cuando no hay falla)
        rutas.push([
            {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yTechoArriba}, 
            {x: xTroncalL, y: yTechoArriba}, {x: xTroncalL, y: yTechoAbajo}, 
            {x: xBreaker, y: yTechoAbajo}, {x: xBreaker, y: yBreaker}
        ]);

        // Generamos las rutas individuales a traves de cada foco.
        // Cada una representa exactamente la trayectoria fisica de los electrones
        // que escogen ese ramal de principio a fin.
        for(let i=0; i<6; i++) {
            if (i < 3) {
                rutas.push([
                    {x: xBreaker, y: yBreaker}, 
                    {x: xBreaker, y: yTechoArriba}, 
                    {x: pos[i].x, y: yTechoArriba}, 
                    {x: pos[i].x, y: pos[i].y - 25}, // Bajamos por el tramo hacia el foco
                    {x: pos[i].x, y: yTechoArriba}, // Subimos por el tramo de regreso al tronco
                    {x: xTroncalL, y: yTechoArriba}, 
                    {x: xTroncalL, y: yTechoAbajo}, 
                    {x: xBreaker, y: yTechoAbajo}, 
                    {x: xBreaker, y: yBreaker}
                ]);
            } else {
                rutas.push([
                    {x: xBreaker, y: yBreaker}, 
                    {x: xBreaker, y: yTechoArriba}, 
                    {x: xTroncalL, y: yTechoArriba}, 
                    {x: xTroncalL, y: yTechoAbajo}, 
                    {x: pos[i].x, y: yTechoAbajo}, 
                    {x: pos[i].x, y: pos[i].y - 25}, // Subimos por el tramo hacia el foco
                    {x: pos[i].x, y: yTechoAbajo},   // Bajamos por el tramo de regreso al tronco
                    {x: xBreaker, y: yTechoAbajo}, 
                    {x: xBreaker, y: yBreaker}
                ]);
            }
        }
        return rutas;
    }

    /**
     * Obtenemos las rutas de cableado para topologias mixtas (Serie primero).
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncal - Posicion X del conducto principal derecho.
     * @returns {Array} Rutas del circuito para dibujar.
     */
    static obtenerRutasMixtoSeriePrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const rutas = [];
        
        // Trazamos el recorrido del tronco principal
        const tronco = [];
        tronco.push({x: xBreaker, y: yBreaker}); 
        tronco.push({x: xBreaker, y: yTechoArriba});
        
        // Anadimos los desvios para los focos conectados en serie
        tronco.push({x: pos[0].x, y: yTechoArriba}); tronco.push({x: pos[0].x, y: pos[0].y - 25}); tronco.push({x: pos[0].x, y: yTechoArriba});
        tronco.push({x: pos[1].x, y: yTechoArriba}); tronco.push({x: pos[1].x, y: pos[1].y - 25}); tronco.push({x: pos[1].x, y: yTechoArriba});
        
        tronco.push({x: xTroncal, y: yTechoArriba}); 
        tronco.push({x: xTroncal, y: yTechoAbajo}); 
        tronco.push({x: xBreaker, y: yTechoAbajo}); 
        tronco.push({x: xBreaker, y: yBreaker});
        rutas.push(tronco);

        // Trazamos los tramos individuales para los focos conectados en paralelo
        for (let i of [2, 3, 4, 5]) {
            const yTecho = i < 3 ? yTechoArriba : yTechoAbajo;
            rutas.push([
                {x: pos[i].x, y: yTecho},
                {x: pos[i].x, y: pos[i].y - 25}
            ]);
        }
        return rutas;
    }

    /**
     * Obtenemos las rutas de cableado para topologias mixtas (Paralelo primero).
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncal - Posicion X del conducto principal derecho.
     * @returns {Array} Rutas del circuito para dibujar.
     */
    static obtenerRutasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const rutas = [];
        
        // Trazamos el recorrido del tronco principal
        const tronco = [];
        tronco.push({x: xBreaker, y: yBreaker}); 
        tronco.push({x: xBreaker, y: yTechoArriba});
        tronco.push({x: xTroncal, y: yTechoArriba}); 
        tronco.push({x: xTroncal, y: yTechoAbajo});
        
        // Anadimos los focos en serie recorriendolos en direccion de derecha a izquierda
        tronco.push({x: pos[5].x, y: yTechoAbajo}); tronco.push({x: pos[5].x, y: pos[5].y - 25}); tronco.push({x: pos[5].x, y: yTechoAbajo});
        tronco.push({x: pos[4].x, y: yTechoAbajo}); tronco.push({x: pos[4].x, y: pos[4].y - 25}); tronco.push({x: pos[4].x, y: yTechoAbajo});
        
        tronco.push({x: xBreaker, y: yTechoAbajo}); 
        tronco.push({x: xBreaker, y: yBreaker});
        rutas.push(tronco);

        // Trazamos los tramos individuales para los focos conectados en paralelo
        for (let i of [0, 1, 2, 3]) {
            const yTecho = i < 3 ? yTechoArriba : yTechoAbajo;
            rutas.push([
                {x: pos[i].x, y: yTecho},
                {x: pos[i].x, y: pos[i].y - 25}
            ]);
        }
        return rutas;
    }

    /**
     * Calculamos las rutas de particulas para la configuracion mixta (Serie primero).
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncal - Posicion X del conducto principal derecho.
     * @returns {Object} Diccionario con las rutas asignadas.
     */
    static obtenerRutasParticulasMixtoSeriePrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const rutas = {};
        
        const troncoBase = [
            {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yTechoArriba},
            {x: pos[0].x, y: yTechoArriba}, {x: pos[0].x, y: pos[0].y - 25}, {x: pos[0].x, y: yTechoArriba},
            {x: pos[1].x, y: yTechoArriba}, {x: pos[1].x, y: pos[1].y - 25}, {x: pos[1].x, y: yTechoArriba}
        ];

        // Formamos el tronco completo asegurandonos de no bajar por los tramos paralelos
        rutas['tronco'] = [...troncoBase, 
            {x: xTroncal, y: yTechoArriba}, {x: xTroncal, y: yTechoAbajo}, 
            {x: xBreaker, y: yTechoAbajo}, {x: xBreaker, y: yBreaker}
        ];

        for (let i of [2, 3, 4, 5]) {
            const ruta = [...troncoBase];
            if (i === 2) {
                ruta.push({x: pos[i].x, y: yTechoArriba});
                ruta.push({x: pos[i].x, y: pos[i].y - 25}); // Bajamos al componente
                ruta.push({x: pos[i].x, y: yTechoArriba}); // Subimos de retorno
                ruta.push({x: xTroncal, y: yTechoArriba}); 
                ruta.push({x: xTroncal, y: yTechoAbajo}); 
                ruta.push({x: xBreaker, y: yTechoAbajo}); 
            } else {
                ruta.push({x: xTroncal, y: yTechoArriba}); 
                ruta.push({x: xTroncal, y: yTechoAbajo}); 
                ruta.push({x: pos[i].x, y: yTechoAbajo});
                ruta.push({x: pos[i].x, y: pos[i].y - 25}); // Subimos al componente
                ruta.push({x: pos[i].x, y: yTechoAbajo}); // Bajamos de retorno
                ruta.push({x: xBreaker, y: yTechoAbajo}); 
            }
            ruta.push({x: xBreaker, y: yBreaker});
            rutas[i] = ruta;
        }
        return rutas;
    }

    /**
     * Calculamos las rutas de particulas para la configuracion mixta (Paralelo primero).
     * 
     * @param {Array} pos - Arreglo con ubicaciones de los focos.
     * @param {number} xBreaker - Posicion X del interruptor.
     * @param {number} yBreaker - Posicion Y del interruptor.
     * @param {number} yTechoArriba - Altura del techo superior.
     * @param {number} yTechoAbajo - Altura del techo inferior.
     * @param {number} xTroncal - Posicion X del conducto principal derecho.
     * @returns {Object} Diccionario con las rutas asignadas.
     */
    static obtenerRutasParticulasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const rutas = {};
        
        const troncoFinal = [
            {x: pos[5].x, y: yTechoAbajo}, {x: pos[5].x, y: pos[5].y - 25}, {x: pos[5].x, y: yTechoAbajo},
            {x: pos[4].x, y: yTechoAbajo}, {x: pos[4].x, y: pos[4].y - 25}, {x: pos[4].x, y: yTechoAbajo},
            {x: xBreaker, y: yTechoAbajo}, {x: xBreaker, y: yBreaker}
        ];

        // Formamos el tronco completo asegurandonos de no bajar por los tramos paralelos
        rutas['tronco'] = [
            {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yTechoArriba},
            {x: xTroncal, y: yTechoArriba}, {x: xTroncal, y: yTechoAbajo},
            ...troncoFinal
        ];

        for (let i of [0, 1, 2, 3]) {
            const ruta = [
                {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yTechoArriba}
            ];

            if (i < 3) {
                ruta.push({x: pos[i].x, y: yTechoArriba});
                ruta.push({x: pos[i].x, y: pos[i].y - 25}); // Bajamos al componente
                ruta.push({x: pos[i].x, y: yTechoArriba}); // Subimos de retorno
                ruta.push({x: xTroncal, y: yTechoArriba}); 
                ruta.push({x: xTroncal, y: yTechoAbajo}); 
            } else { // i === 3
                ruta.push({x: xTroncal, y: yTechoArriba}); 
                ruta.push({x: xTroncal, y: yTechoAbajo}); 
                ruta.push({x: pos[i].x, y: yTechoAbajo});
                ruta.push({x: pos[i].x, y: pos[i].y - 25}); // Subimos al componente
                ruta.push({x: pos[i].x, y: yTechoAbajo}); // Bajamos de retorno
            }
            
            ruta.push(...troncoFinal);
            rutas[i] = ruta;
        }
        return rutas;
    }
}