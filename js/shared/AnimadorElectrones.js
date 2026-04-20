export class AnimadorElectrones {
    /**
     * Dibuja y anima partículas (electrones) a lo largo de un circuito rectangular.
     * @param {CanvasRenderingContext2D} ctx - El contexto del canvas.
     * @param {Array} particulas - Arreglo de objetos partícula {prog, caminoIdx}.
     * @param {Number} velocidad - Velocidad de avance (progreso).
     * @param {String} color - Color de los electrones y su resplandor.
     * @param {Number} x0 - Posición inicial X del lazo rectangular.
     * @param {Number} y0 - Posición inicial Y del lazo rectangular.
     * @param {Array<Number>} caminosW - Arreglo con los anchos de las ramas paralelas disponibles.
     * @param {Number} altoLazo - Altura del circuito rectangular.
     */
    static dibujar(ctx, particulas, velocidad, color, x0, y0, caminosW, altoLazo) {
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;

        particulas.forEach((p, i) => {
            p.prog += velocidad;
            if (p.prog > 100) { 
                p.prog = 0; 
                // Si hay múltiples ramas (ej. paralelo), elige una al azar al reiniciar el ciclo
                if (caminosW && caminosW.length > 0) {
                    p.caminoIdx = Math.floor(Math.random() * caminosW.length);
                }
            }

            const wPath = caminosW[p.caminoIdx || 0] || caminosW[0];
            const pathLength = wPath * 2 + altoLazo * 2; 
            const pDist = (p.prog / 100) * pathLength;
            
            let px, py;
            if (pDist < wPath) { px = x0 + pDist; py = y0; }
            else if (pDist < wPath + altoLazo) { px = x0 + wPath; py = y0 + (pDist - wPath); }
            else if (pDist < wPath * 2 + altoLazo) { px = (x0 + wPath) - (pDist - wPath - altoLazo); py = y0 + altoLazo; }
            else { px = x0; py = (y0 + altoLazo) - (pDist - wPath * 2 - altoLazo); }

            const size = 3 + (i % 3);
            ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
        });
        
        ctx.shadowBlur = 0;
    }
}