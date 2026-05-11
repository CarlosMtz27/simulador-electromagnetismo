import { RenderizadorBase } from '../../../shared/RenderizadorBase.js';
import { AnimadorElectrones } from '../../../shared/AnimadorElectrones.js';

/**
 * Clase EstrategiaParalelo
 * Nos encargamos de trazar y animar visualmente un circuito electrico
 * configurado completamente en paralelo, dividiendo la corriente en multiples ramas.
 */
export class EstrategiaParalelo {
    /**
     * Dibujamos el circuito en paralelo, ajustando el espaciado de cada rama
     * automaticamente para aprovechar todo el ancho del lienzo de manera estetica.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del area de dibujo.
     * @param {number} h - Alto del area de dibujo.
     * @param {Object} modelo - El estado fisico actual del sistema.
     * @param {Object} resultados - Los calculos matematicos de potencia y corriente.
     * @param {Array} particulas - La lista de electrones para animar.
     */
    static dibujar(ctx, w, h, modelo, resultados, particulas) {
        // definimos los margenes y el tamano util que tendremos para el area de dibujo
        const margen = 60; const x0 = margen; const y0 = margen;
        const altoLazo = h - margen * 2; const anchoDisponible = w - margen * 2 - 40;

        // calculamos el espaciado para distribuir de forma uniforme cada rama del circuito
        const totalItems = modelo.numParalelo;
        const espaciado = Math.min(100, anchoDisponible / totalItems);
        let nodosX = [];
        for(let i=0; i<totalItems; i++) nodosX.push(x0 + (i + 1) * espaciado);
        const xFinal = nodosX[totalItems - 1];

        // configuramos el color y el brillo del cable dependiendo de si detectamos una sobrecarga
        const colorLinea = modelo.estadoSistema === 'sobrecarga' ? 'rgba(255, 165, 0, 0.6)' : '#2D313F';
        const colorActivo = modelo.estadoSistema === 'sobrecarga' ? '#FF5722' : '#00E5FF';

        ctx.lineJoin = 'round';
        ctx.strokeStyle = colorLinea; 
        ctx.lineWidth = 12;
        if (modelo.estadoSistema === 'sobrecarga') {
            ctx.shadowBlur = 10; ctx.shadowColor = 'orange';
        } else {
            ctx.shadowBlur = 0;
        }

        // dibujamos el lazo perimetral y luego trazamos cada una de las lineas verticales (ramas paralelas)
        ctx.beginPath();
        ctx.roundRect(x0, y0, xFinal - x0, altoLazo, 25);
        for (let i = 0; i < totalItems - 1; i++) { 
            ctx.moveTo(nodosX[i], y0); 
            ctx.lineTo(nodosX[i], y0 + altoLazo); 
        }
        ctx.stroke(); 
        ctx.shadowBlur = 0;

        // limpiamos el cable donde va la bateria para que parezca conectada a los polos
        ctx.clearRect(x0 - 20, y0 + altoLazo / 2 - 35, 40, 70);

        // colocamos la fuente de alimentacion (bateria) en el lado izquierdo
        RenderizadorBase.dibujarBateria(ctx, x0, y0 + altoLazo/2, modelo.voltaje, modelo.estadoSistema);

        // recorremos todos los elementos paralelos para pintar su respectiva caja de datos o HUD
        for (let i = 0; i < totalItems; i++) {
            let boxX = nodosX[i] - 25; let boxY = y0 + altoLazo/2 - 30; 
            ctx.clearRect(boxX, boxY, 50, 60);
            RenderizadorBase.dibujarCajaHUD(ctx, boxX, boxY, 50, 60, `R${i+1}`, modelo.estadoSistema === 'operativo', resultados.pFocoSecundario);
        }

        // si el circuito funciona correctamente, animamos el flujo de electrones a lo largo de las ramas
        if (modelo.estadoSistema === 'operativo' && resultados.iTotal > 0) {
            const velocidad = Math.min(resultados.iTotal * 0.5, 12);
            const caminosW = nodosX.slice(0, totalItems).map(nx => nx - x0);
            AnimadorElectrones.dibujar(ctx, particulas, velocidad, colorActivo, x0, y0, caminosW, altoLazo);
        }
        
        // instalamos el switch de proteccion o breaker cerca de la bateria
        RenderizadorBase.dibujarBreaker(ctx, x0 - 15, y0 + altoLazo/4, modelo.estadoSistema);
    }
}