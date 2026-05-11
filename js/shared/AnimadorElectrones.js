/**
 * Clase AnimadorElectrones
 * Nos encargamos de dar vida a los electrones que fluyen por los circuitos.
 * Calculamos su posicion exacta a lo largo de un perimetro rectangular para que 
 * la animacion sea fluida y represente visualmente la corriente electrica.
 */
export class AnimadorElectrones {
    /**
     * Dibujamos y animamos las particulas (electrones) a lo largo de un circuito rectangular.
     * Recibimos las dimensiones del cable y movemos cada electron segun la velocidad indicada.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel o contexto del canvas que usamos para dibujar.
     * @param {Array} particulas - La coleccion de electrones con su progreso y camino asignado.
     * @param {Number} velocidad - Que tan rapido movemos los electrones en este frame.
     * @param {String} color - El color de los electrones y su resplandor (glow).
     * @param {Number} x0 - Posicion inicial X donde empezamos a dibujar el lazo rectangular.
     * @param {Number} y0 - Posicion inicial Y donde empezamos a dibujar el lazo rectangular.
     * @param {Array<Number>} caminosW - Arreglo con los anchos de las ramas paralelas disponibles.
     * @param {Number} altoLazo - Altura del circuito rectangular.
     */
    static dibujar(ctx, particulas, velocidad, color, x0, y0, caminosW, altoLazo) {
        // Preparamos el pincel con el color y el brillo neon
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;

        // Recorremos el arreglo de particulas para moverlas y dibujarlas una por una
        particulas.forEach((p, i) => {
            // Si la particula es nueva y no tiene camino, le asignamos uno al azar
            if (p.caminoIdx === undefined) p.caminoIdx = Math.floor(Math.random() * caminosW.length);
            
            // Avanzamos la particula segun la velocidad
            p.prog += velocidad;
            
            // Si completa la vuelta (pasa del 100%), la reiniciamos
            if (p.prog > 100) { 
                p.prog = 0; 
                // Si tenemos varias ramas paralelas, le damos la oportunidad de tomar un nuevo camino
                if (caminosW && caminosW.length > 0) {
                    p.caminoIdx = Math.floor(Math.random() * caminosW.length);
                }
            }

            // Obtenemos el ancho de la rama por la que esta viajando este electron
            const wPath = caminosW[p.caminoIdx || 0] || caminosW[0];
            // Calculamos la longitud total de este perimetro (ancho * 2 + alto * 2)
            const pathLength = wPath * 2 + altoLazo * 2; 
            // Obtenemos la distancia recorrida en pixeles segun el porcentaje de progreso
            const pDist = (p.prog / 100) * pathLength;
            
            let px, py;
            // Determinamos exactamente en que segmento del rectangulo se encuentra la particula
            // Lado superior (movimiento hacia la derecha)
            if (pDist < wPath) { px = x0 + pDist; py = y0; }
            // Lado derecho (movimiento hacia abajo)
            else if (pDist < wPath + altoLazo) { px = x0 + wPath; py = y0 + (pDist - wPath); }
            // Lado inferior (movimiento hacia la izquierda)
            else if (pDist < wPath * 2 + altoLazo) { px = (x0 + wPath) - (pDist - wPath - altoLazo); py = y0 + altoLazo; }
            // Lado izquierdo (movimiento hacia arriba)
            else { px = x0; py = (y0 + altoLazo) - (pDist - wPath * 2 - altoLazo); }

            // Le damos un tamano ligeramente aleatorio para que se vea mas organico
            const size = 3 + (i % 3);
            // Dibujamos la particula en el canvas
            ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
        });
        
        // Limpiamos el resplandor para no ensuciar otros dibujos que se hagan despues
        ctx.shadowBlur = 0;
    }
}