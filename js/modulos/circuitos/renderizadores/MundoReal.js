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
        const xTroncal = pos[2].x + 30; // el troncal bajara justo despues del ultimo foco derecho

        // empezamos a trazar todo el cableado basandonos en la topologia elegida
        ctx.beginPath();
        if (modelo.topologia === 'serie') {
            // para el circuito en serie, ruteamos un solo cable que pasa por todos los focos secuencialmente
            ctx.moveTo(xBreaker, yBreaker);
            ctx.lineTo(xBreaker, yTechoArriba);
            // conectamos la linea superior pasando por los primeros 3 focos
            ctx.lineTo(pos[0].x, yTechoArriba); ctx.lineTo(pos[0].x, pos[0].y - 15); ctx.moveTo(pos[0].x, yTechoArriba);
            ctx.lineTo(pos[1].x, yTechoArriba); ctx.lineTo(pos[1].x, pos[1].y - 15); ctx.moveTo(pos[1].x, yTechoArriba);
            ctx.lineTo(pos[2].x, yTechoArriba); ctx.lineTo(pos[2].x, pos[2].y - 15); ctx.moveTo(pos[2].x, yTechoArriba);
            // bajamos el cable principal
            ctx.lineTo(xTroncal, yTechoArriba); ctx.lineTo(xTroncal, yTechoAbajo);
            // regresamos la conexion pasando por los focos inferiores
            ctx.lineTo(pos[5].x, yTechoAbajo); ctx.lineTo(pos[5].x, pos[5].y - 15); ctx.moveTo(pos[5].x, yTechoAbajo);
            ctx.lineTo(pos[4].x, yTechoAbajo); ctx.lineTo(pos[4].x, pos[4].y - 15); ctx.moveTo(pos[4].x, yTechoAbajo);
            ctx.lineTo(pos[3].x, yTechoAbajo); ctx.lineTo(pos[3].x, pos[3].y - 15); ctx.moveTo(pos[3].x, yTechoAbajo);
            ctx.lineTo(xBreaker + 15, yTechoAbajo); ctx.lineTo(xBreaker + 15, yBreaker);

        } else if (modelo.topologia === 'paralelo') {
            // para el paralelo, dibujamos un anillo principal exterior que no se interrumpe
            ctx.moveTo(xBreaker, yBreaker); ctx.lineTo(xBreaker, yTechoArriba);
            ctx.lineTo(xTroncal, yTechoArriba); ctx.moveTo(xTroncal, yTechoArriba);
            ctx.lineTo(xTroncal, yTechoAbajo); ctx.lineTo(xBreaker + 15, yTechoAbajo);
            ctx.lineTo(xBreaker + 15, yBreaker);
            // creamos derivaciones independientes (ramas) bajando hacia cada foco
            for(let i=0; i<6; i++) {
                const yTecho = i < 3 ? yTechoArriba : yTechoAbajo;
                ctx.moveTo(pos[i].x, yTecho); ctx.lineTo(pos[i].x, pos[i].y - 15);
            }

        } else if (modelo.topologia === 'mixto') {
            // en topologia mixta evaluamos como empieza la secuencia para combinar las conexiones
            if (modelo.secuenciaMixta[0].startsWith('S')) {
                ctx.moveTo(xBreaker, yBreaker); ctx.lineTo(xBreaker, yTechoArriba);
                // unimos los primeros dos focos en forma de serie
                ctx.lineTo(pos[0].x, yTechoArriba); ctx.lineTo(pos[0].x, pos[0].y - 15); ctx.moveTo(pos[0].x, yTechoArriba);
                ctx.lineTo(pos[1].x, yTechoArriba); ctx.lineTo(pos[1].x, pos[1].y - 15); ctx.moveTo(pos[1].x, yTechoArriba);
                
                // despues de la seccion en serie, abrimos el cable en ramas paralelas para los demas focos
                ctx.lineTo(xTroncal, yTechoArriba); ctx.lineTo(xTroncal, yTechoAbajo);
                ctx.lineTo(xBreaker + 15, yTechoAbajo); ctx.lineTo(xBreaker + 15, yBreaker);
                for(let i=2; i<6; i++) {
                    const yTecho = i < 3 ? yTechoArriba : yTechoAbajo;
                    ctx.moveTo(pos[i].x, yTecho); ctx.lineTo(pos[i].x, pos[i].y - 15);
                }
            } else {
                // si comenzamos con paralelo, calculamos el punto donde los cables volveran a juntarse
                const xMerge = pos[4].x - 30; 
                
                // enlazamos de manera paralela los focos de arriba
                ctx.moveTo(xBreaker, yBreaker); ctx.lineTo(xBreaker, yTechoArriba);
                ctx.lineTo(pos[2].x + 20, yTechoArriba); ctx.lineTo(pos[2].x + 20, yTechoAbajo - 20);
                ctx.lineTo(xMerge, yTechoAbajo - 20); ctx.lineTo(xMerge, yTechoAbajo); // Converge abajo
                for(let i=0; i<3; i++) { ctx.moveTo(pos[i].x, yTechoArriba); ctx.lineTo(pos[i].x, pos[i].y - 15); }

                // enlazamos tambien el primer foco de abajo en su propia rama paralela
                ctx.moveTo(xBreaker, yBreaker); ctx.lineTo(xBreaker, yTechoAbajo);
                ctx.lineTo(xMerge, yTechoAbajo); // Converge abajo
                ctx.moveTo(pos[3].x, yTechoAbajo); ctx.lineTo(pos[3].x, pos[3].y - 15);

                // a partir del punto de union, pasamos por los ultimos dos focos en serie obligatoria
                ctx.moveTo(xMerge, yTechoAbajo);
                ctx.lineTo(pos[4].x, yTechoAbajo); ctx.lineTo(pos[4].x, pos[4].y - 15); ctx.moveTo(pos[4].x, yTechoAbajo);
                ctx.lineTo(pos[5].x, yTechoAbajo); ctx.lineTo(pos[5].x, pos[5].y - 15); ctx.moveTo(pos[5].x, yTechoAbajo);

                // regresamos el cable al origen dando la vuelta para cerrar el circuito limpiamente
                ctx.lineTo(xTroncal, yTechoAbajo); ctx.lineTo(xTroncal, yTechoArriba - 20);
                ctx.lineTo(xBreaker - 10, yTechoArriba - 20); ctx.lineTo(xBreaker - 10, yBreaker - 10);
            }
        }
        // hacemos que los trazos de los cables se hagan visibles en pantalla
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
    const velocidad = Math.min(resultados.iTotal * 0.25, 1.5);
    const yTechoArriba = h * 0.30 - 40;
    const yTechoAbajo  = h * 0.75 - 40;
    const xBreaker     = w * 0.05;
    const xTroncal     = w * 0.80 + 30;
    const color        = '#00E5FF';

    ctx.fillStyle  = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;

    particulas.forEach(p => {
        p.prog = (p.prog + velocidad) % 100;
        // recorrido simple: eje superior → troncal → eje inferior
        const totalX = xTroncal - xBreaker;
        const dist   = (p.prog / 100) * (totalX * 2 + (yTechoAbajo - yTechoArriba));
        let px, py;
        if (dist < totalX) {
            px = xBreaker + dist; py = yTechoArriba;
        } else if (dist < totalX + (yTechoAbajo - yTechoArriba)) {
            px = xTroncal; py = yTechoArriba + (dist - totalX);
        } else {
            px = xTroncal - (dist - totalX - (yTechoAbajo - yTechoArriba));
            py = yTechoAbajo;
        }
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
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
}