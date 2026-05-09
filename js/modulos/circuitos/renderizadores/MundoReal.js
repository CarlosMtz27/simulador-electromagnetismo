export class RenderizadorMundoReal {
    static dibujar(ctx, w, h, modelo, resultados, particulas = []) {
        // limpiamos el lienzo por completo para preparar el nuevo frame
        ctx.clearRect(0, 0, w, h);
        
        // aplicamos una capa oscura sobre todo el canvas para simular que la habitacion esta a oscuras
        ctx.fillStyle = 'rgba(10, 12, 16, 0.75)';
        ctx.fillRect(0, 0, w, h);

        const estado = modelo.estadoSistema;
        // definimos el color del cable: lo pintamos rojo si hay problemas, si no lo dejamos color cobre
        const cableColor = estado === 'sobrecarga' ? '#FF3333' : '#D4AF37';

        // preparamos el pincel para que las lineas se vean gruesas y redondeadas
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = cableColor;
        
        // si tenemos una sobrecarga, le agregamos un efecto de brillo rojo al cable para indicar peligro
        if (estado === 'sobrecarga') {
            ctx.shadowBlur = 15; ctx.shadowColor = 'red';
        } else {
            ctx.shadowBlur = 0;
        }

        // guardamos las coordenadas exactas donde ubicaremos los 6 focos en la pantalla
        const pos = [
            { x: w * 0.20, y: h * 0.30 }, // 0: Arriba Izq
            { x: w * 0.50, y: h * 0.30 }, // 1: Arriba Centro
            { x: w * 0.80, y: h * 0.30 }, // 2: Arriba Der
            { x: w * 0.20, y: h * 0.75 }, // 3: Abajo Izq
            { x: w * 0.50, y: h * 0.75 }, // 4: Abajo Centro
            { x: w * 0.80, y: h * 0.75 }  // 5: Abajo Der
        ];

        // calculamos posiciones clave como la ubicacion del breaker y la altura por donde pasaran los cables
        const xBreaker = w * 0.05; 
        const yBreaker = h * 0.50; 
        const yTechoArriba = pos[0].y - 40;
        const yTechoAbajo = pos[3].y - 40;
        const yL_Arriba = yTechoArriba;
        const yN_Arriba = yTechoArriba + 8;
        const yL_Abajo = yTechoAbajo + 8;
        const yN_Abajo = yTechoAbajo;
        const xTroncalL = pos[2].x + 30;
        const xTroncalN = pos[2].x + 22;

        // empezamos a trazar todo el cableado basandonos en la topologia elegida
        ctx.beginPath();
        if (modelo.topologia === 'serie') {
            const rutas = this.obtenerRutaSerie(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncalL);
            this.trazarRutas(ctx, rutas);
        } else if (modelo.topologia === 'paralelo') {
            const rutas = this.obtenerRutasParalelo(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN);
            this.trazarRutas(ctx, rutas);
        } else if (modelo.topologia === 'mixto') {
            if (modelo.secuenciaMixta[0].startsWith('S')) {
                const rutas = this.obtenerRutasMixtoSeriePrimero(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN);
                this.trazarRutas(ctx, rutas);
            } else {
                const rutas = this.obtenerRutasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN);
                this.trazarRutas(ctx, rutas);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // revisamos y dibujamos uno por uno los componentes de luz
        for(let i = 0; i < 6; i++) {
            const potencia = resultados.pMixto[i] || 0;
            // comprobamos si el usuario quemo especificamente este foco
            const estaFundido = (i === modelo.focoFundidoIndex);
            
            // le asignamos una etiqueta para que el usuario distinga facilmente la topologia local
            let etiqueta = '';
            if (modelo.topologia === 'serie') etiqueta = 'S';
            else if (modelo.topologia === 'paralelo') etiqueta = 'P';
            else if (modelo.topologia === 'mixto') etiqueta = modelo.secuenciaMixta[i].startsWith('S') ? 'S' : 'P';

            // enviamos a pintar el foco con toda su logica
            this.dibujarFocoEdison(ctx, pos[i].x, pos[i].y, potencia, estaFundido, etiqueta);
        }

        // dibujamos el interruptor de proteccion en la pared
        this.dibujarBreaker(ctx, xBreaker, yBreaker, estado);
        
        if (particulas.length > 0) {
            this.dibujarElectronesEnCables(ctx, w, h, modelo, resultados, particulas);
    }
    
    }

    static dibujarElectronesEnCables(ctx, w, h, modelo, resultados, particulas) {
        if (modelo.estadoSistema !== 'operativo' || resultados.iTotal < 0.001) return;
        
        const pos = [
            { x: w * 0.20, y: h * 0.30 }, { x: w * 0.50, y: h * 0.30 }, { x: w * 0.80, y: h * 0.30 },
            { x: w * 0.20, y: h * 0.75 }, { x: w * 0.50, y: h * 0.75 }, { x: w * 0.80, y: h * 0.75 }
        ];
        const xBreaker = w * 0.05; const yBreaker = h * 0.50; 
        const yTechoArriba = pos[0].y - 40; const yTechoAbajo = pos[3].y - 40;
        const yL_Arriba = yTechoArriba; const yN_Arriba = yTechoArriba - 8;
        const yL_Abajo = yTechoAbajo; const yN_Abajo = yTechoAbajo + 8;
        const xTroncalL = pos[2].x + 30; const xTroncalN = pos[2].x + 38;

        // evaluamos cuáles ramas o rutas siguen vivas para que los electrones fluyan por ellas
        let rutasActivas = [];
        if (modelo.topologia === 'serie' && modelo.focoFundidoIndex === -1) {
            rutasActivas = this.obtenerRutaSerie(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncalL);
        } else if (modelo.topologia === 'paralelo') {
            const rutasParticulas = this.obtenerRutasParticulasParalelo(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN);
            let algunFocoActivo = false;
            for(let i=0; i<6; i++) { 
                if (i !== modelo.focoFundidoIndex) { 
                    rutasActivas.push(rutasParticulas[i + 2]); 
                    algunFocoActivo = true;
                } 
            }
            if (algunFocoActivo) {
                // Agregamos el anillo Fase y Neutro del "Cuadrado general" para que siempre lleven energía visible
                rutasActivas.push(rutasParticulas[0]);
                rutasActivas.push(rutasParticulas[1]);
            }
        } else if (modelo.topologia === 'mixto') {
            if (modelo.secuenciaMixta[0].startsWith('S')) {
                if (modelo.focoFundidoIndex !== 0 && modelo.focoFundidoIndex !== 1) {
                    const rutas = this.obtenerRutasMixtoSeriePrimero(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN);
                    for(let i=2; i<6; i++) { if (i !== modelo.focoFundidoIndex) rutasActivas.push(rutas[i-2]); }
                }
            } else {
                if (modelo.focoFundidoIndex !== 4 && modelo.focoFundidoIndex !== 5) {
                    const rutas = this.obtenerRutasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN);
                    for(let i=0; i<4; i++) { if (i !== modelo.focoFundidoIndex) rutasActivas.push(rutas[i]); }
                }
            }
        }
        if (rutasActivas.length === 0) return;

        const velocidad = Math.min(resultados.iTotal * 0.25, 1.5);
        ctx.fillStyle = '#00E5FF'; ctx.shadowBlur = 6; ctx.shadowColor = '#00E5FF';

        // distribuimos inteligentemente los electrones entre las ramas que esten sanas
        particulas.forEach((p, index) => {
            p.prog = (p.prog + velocidad) % 100;
            const rutaAsignada = rutasActivas[index % rutasActivas.length];
            const posP = this.obtenerPosicionRuta(rutaAsignada, p.prog);
            ctx.beginPath(); ctx.arc(posP.x, posP.y, 2.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    static dibujarFocoEdison(ctx, x, y, potencia, estaFundido, etiqueta) {
        // determinamos el nivel de intensidad en funcion de la energia simulada
        const ratio = Math.min((potencia / 60), 1); 
        const r = Math.floor(30 + ratio * (255 - 30));
        const g = Math.floor(30 + ratio * (191 - 30));
        const b = Math.floor(30 + ratio * (0 - 30));

        // si recibe energia y no esta quemado, proyectamos una luz radial en la pared posterior
        if (ratio > 0.01 && !estaFundido) {
            const radioLuz = 180 * ratio; 
            const grad = ctx.createRadialGradient(x, y, 10, x, y, radioLuz);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.5 * ratio})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.globalCompositeOperation = 'source-over'; 
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, radioLuz, 0, Math.PI*2); ctx.fill();
        }

        // si le pasamos una etiqueta, pintamos el cuadrito flotante cerca de la base
        if (etiqueta) {
            const colorEtiqueta = etiqueta === 'S' ? 'rgba(233, 75, 122, 0.9)' : 'rgba(0, 200, 255, 0.9)'; // Rosa para S, Cyan para P
            ctx.fillStyle = colorEtiqueta;
            ctx.beginPath();
            ctx.roundRect(x + 15, y - 25, 18, 18, 4);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(etiqueta, x + 24, y - 12);
        }

        // construimos la base negra del conector
        ctx.fillStyle = '#111'; ctx.fillRect(x - 8, y - 25, 16, 8);

        // formamos la silueta de cristal usando curvas bezier
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 17);
        ctx.bezierCurveTo(x - 20, y, x - 18, y + 25, x, y + 25);
        ctx.bezierCurveTo(x + 18, y + 25, x + 20, y, x + 8, y - 17);
        ctx.closePath();
        // rellenamos el cristal con cierta opacidad si esta iluminado
        ctx.fillStyle = ratio > 0 && !estaFundido ? `rgba(${r}, ${g}, ${b}, ${0.2 + ratio * 0.4})` : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();

        // si provocamos una falla critica, cortamos el filamento por la mitad y ponemos una equis roja
        if (estaFundido) {
            ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x - 3, y - 10); ctx.lineTo(x - 5, y); ctx.stroke(); 
            ctx.fillStyle = '#E94B7A'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('❌', x, y + 10);
        } else {
            // si todo esta bien, dibujamos el alambre continuo interno
            ctx.strokeStyle = ratio > 0 ? '#FFF' : '#333'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x - 3, y - 10); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x, y + 15); ctx.lineTo(x + 5, y + 5); ctx.lineTo(x + 3, y - 10); ctx.stroke();

            // coronamos con un resplandor fuerte justo en el nucleo del filamento
            if (ratio > 0.05) {
                ctx.shadowBlur = 60 * ratio; ctx.shadowColor = '#FFBF00';
                ctx.fillStyle = `rgb(255, 255, 200)`;
                ctx.beginPath(); ctx.arc(x, y + 5, 8, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    static dibujarBreaker(ctx, x, y, estado) {
        // creamos la caja externa de los fusibles
        ctx.fillStyle = '#1e212b'; ctx.fillRect(x - 10, y - 20, 20, 40);
        ctx.strokeStyle = '#4A4A4A'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 10, y - 20, 20, 40);
        // colocamos un diodo LED que cambiara a rojo si simulamos un corto o a verde si esta estable
        ctx.fillStyle = estado === 'sobrecarga' ? '#FF3333' : '#00FF00';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
    }

    // ====================================================================
    // GENERADORES DE RUTAS (MATEMÁTICA Y TRAZADOS)
    // ====================================================================
    
    static trazarRutas(ctx, rutas) {
        rutas.forEach(ruta => {
            if (ruta.length === 0) return;
            ctx.moveTo(ruta[0].x, ruta[0].y);
            for(let i=1; i<ruta.length; i++) ctx.lineTo(ruta[i].x, ruta[i].y);
        });
    }

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

    static obtenerRutaSerie(pos, xBreaker, yBreaker, yTechoArriba, yTechoAbajo, xTroncal) {
        const ruta = [];
        ruta.push({x: xBreaker, y: yBreaker}); ruta.push({x: xBreaker, y: yTechoArriba});
        for(let i=0; i<3; i++) {
            ruta.push({x: pos[i].x - 10, y: yTechoArriba}); ruta.push({x: pos[i].x - 10, y: pos[i].y - 25});
            ruta.push({x: pos[i].x + 10, y: pos[i].y - 25}); ruta.push({x: pos[i].x + 10, y: yTechoArriba});
        }
        ruta.push({x: xTroncal, y: yTechoArriba}); ruta.push({x: xTroncal, y: yTechoAbajo});
        for(let i=5; i>=3; i--) {
            ruta.push({x: pos[i].x + 10, y: yTechoAbajo}); ruta.push({x: pos[i].x + 10, y: pos[i].y - 25});
            ruta.push({x: pos[i].x - 10, y: pos[i].y - 25}); ruta.push({x: pos[i].x - 10, y: yTechoAbajo});
        }
        ruta.push({x: xBreaker + 15, y: yTechoAbajo}); ruta.push({x: xBreaker + 15, y: yBreaker});
        return [ruta]; 
    }

    static obtenerRutasParalelo(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN) {
        const rutas = [];
        
        // Trazamos el Loop Principal de la Fase (El cuadrado exterior)
        rutas.push([
            {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yL_Arriba}, 
            {x: xTroncalL, y: yL_Arriba}, {x: xTroncalL, y: yL_Abajo}, 
            {x: xBreaker, y: yL_Abajo}, {x: xBreaker, y: yBreaker}
        ]);
        
        // Trazamos el Loop Principal del Neutro (El cuadrado interior)
        rutas.push([
            {x: xBreaker + 8, y: yBreaker}, {x: xBreaker + 8, y: yN_Arriba}, 
            {x: xTroncalN, y: yN_Arriba}, {x: xTroncalN, y: yN_Abajo}, 
            {x: xBreaker + 8, y: yN_Abajo}, {x: xBreaker + 8, y: yBreaker}
        ]);

        for(let i=0; i<6; i++) {
            const yL = i < 3 ? yL_Arriba : yL_Abajo;
            const yN = i < 3 ? yN_Arriba : yN_Abajo;
            
            const ruta = [];
            ruta.push({x: pos[i].x - 5, y: yL}); 
            ruta.push({x: pos[i].x - 5, y: pos[i].y - 25}); 
            rutas.push(ruta);
            
            const rutaN = [];
            rutaN.push({x: pos[i].x + 5, y: yN}); 
            rutaN.push({x: pos[i].x + 5, y: pos[i].y - 25}); 
            rutas.push(rutaN);
        }
        return rutas;
    }

    static obtenerRutasParticulasParalelo(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN) {
        const rutas = [];
        // Permitimos que los electrones naveguen de forma continua alrededor de las troncales
        rutas.push([{x: xBreaker, y: yBreaker}, {x: xBreaker, y: yL_Arriba}, {x: xTroncalL, y: yL_Arriba}, {x: xTroncalL, y: yL_Abajo}, {x: xBreaker, y: yL_Abajo}, {x: xBreaker, y: yBreaker}]);
        rutas.push([{x: xBreaker + 8, y: yBreaker}, {x: xBreaker + 8, y: yN_Arriba}, {x: xTroncalN, y: yN_Arriba}, {x: xTroncalN, y: yN_Abajo}, {x: xBreaker + 8, y: yN_Abajo}, {x: xBreaker + 8, y: yBreaker}]);

        // Y también creamos el recorrido completo que hacen a través de cada foco
        for(let i=0; i<6; i++) {
            const yL = i < 3 ? yL_Arriba : yL_Abajo;
            const yN = i < 3 ? yN_Arriba : yN_Abajo;
            rutas.push([
                {x: xBreaker, y: yBreaker}, {x: xBreaker, y: yL}, {x: pos[i].x - 5, y: yL}, {x: pos[i].x - 5, y: pos[i].y - 25}, 
                {x: pos[i].x + 5, y: pos[i].y - 25}, {x: pos[i].x + 5, y: yN}, {x: xBreaker + 8, y: yN}, {x: xBreaker + 8, y: yBreaker}
            ]);
        }
        return rutas;
    }

    static obtenerRutasMixtoSeriePrimero(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN) {
        const rutas = [];
        for(let j=2; j<6; j++) {
            const ruta = [];
            ruta.push({x: xBreaker, y: yBreaker}); ruta.push({x: xBreaker, y: yL_Arriba});
            ruta.push({x: pos[0].x - 10, y: yL_Arriba}); ruta.push({x: pos[0].x - 10, y: pos[0].y - 25});
            ruta.push({x: pos[0].x + 10, y: pos[0].y - 25}); ruta.push({x: pos[0].x + 10, y: yL_Arriba});
            ruta.push({x: pos[1].x - 10, y: yL_Arriba}); ruta.push({x: pos[1].x - 10, y: pos[1].y - 25});
            ruta.push({x: pos[1].x + 10, y: pos[1].y - 25}); ruta.push({x: pos[1].x + 10, y: yL_Arriba}); 
            const yL = j < 3 ? yL_Arriba : yL_Abajo;
            const yN = j < 3 ? yN_Arriba : yN_Abajo;
            if (j >= 3) { ruta.push({x: xTroncalL, y: yL_Arriba}); ruta.push({x: xTroncalL, y: yL_Abajo}); }
            ruta.push({x: pos[j].x - 5, y: yL}); ruta.push({x: pos[j].x - 5, y: pos[j].y - 25});
            ruta.push({x: pos[j].x + 5, y: pos[j].y - 25}); ruta.push({x: pos[j].x + 5, y: yN}); 
            if (j >= 3) { ruta.push({x: xTroncalN, y: yN_Abajo}); ruta.push({x: xTroncalN, y: yN_Arriba}); }
            ruta.push({x: xBreaker - 5, y: yN_Arriba}); ruta.push({x: xBreaker - 5, y: yBreaker});
            rutas.push(ruta);
        }
        return rutas;
    }

    static obtenerRutasMixtoParaleloPrimero(pos, xBreaker, yBreaker, yL_Arriba, yN_Arriba, yL_Abajo, yN_Abajo, xTroncalL, xTroncalN) {
        const rutas = [];
        const xMerge = pos[4].x - 30; 
        for(let j=0; j<4; j++) {
            const ruta = [];
            ruta.push({x: xBreaker, y: yBreaker});
            const yL = j < 3 ? yL_Arriba : yL_Abajo;
            ruta.push({x: xBreaker, y: yL}); 
            if (j === 3) ruta.push({x: pos[3].x - 5, y: yL_Abajo});
            else ruta.push({x: pos[j].x - 5, y: yL_Arriba});
            ruta.push({x: pos[j].x - 5, y: pos[j].y - 25}); ruta.push({x: pos[j].x + 5, y: pos[j].y - 25}); 
            if (j < 3) {
                ruta.push({x: pos[j].x + 5, y: yN_Arriba}); ruta.push({x: pos[2].x + 20, y: yN_Arriba});
                ruta.push({x: pos[2].x + 20, y: yN_Abajo - 20}); ruta.push({x: xMerge, y: yN_Abajo - 20});
                ruta.push({x: xMerge, y: yN_Abajo});
            } else {
                ruta.push({x: pos[3].x + 5, y: yN_Abajo}); ruta.push({x: xMerge, y: yN_Abajo});
            }
            ruta.push({x: pos[4].x - 10, y: yN_Abajo}); ruta.push({x: pos[4].x - 10, y: pos[4].y - 25});
            ruta.push({x: pos[4].x + 10, y: pos[4].y - 25}); ruta.push({x: pos[4].x + 10, y: yN_Abajo});
            ruta.push({x: pos[5].x - 10, y: yN_Abajo}); ruta.push({x: pos[5].x - 10, y: pos[5].y - 25});
            ruta.push({x: pos[5].x + 10, y: pos[5].y - 25}); ruta.push({x: pos[5].x + 10, y: yN_Abajo});
            ruta.push({x: xTroncalN, y: yN_Abajo}); ruta.push({x: xTroncalN, y: yN_Arriba - 20});
            ruta.push({x: xBreaker - 10, y: yN_Arriba - 20}); ruta.push({x: xBreaker - 10, y: yBreaker - 10});
            rutas.push(ruta);
        }
        return rutas;
    }
}