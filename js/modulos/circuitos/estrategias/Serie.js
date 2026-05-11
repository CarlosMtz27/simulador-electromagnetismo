import { RenderizadorBase } from '../../../shared/RenderizadorBase.js';
import { AnimadorElectrones } from '../../../shared/AnimadorElectrones.js';

/**
 * Clase EstrategiaSerie
 * Nos encargamos de representar de forma visual un circuito configurado
 * en serie, donde todos los componentes comparten el mismo camino principal.
 */
export class EstrategiaSerie {
    /**
     * Dibujamos el circuito en serie, distribuyendo los componentes a lo largo
     * de la linea superior del lazo electrico de manera uniforme.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del area de dibujo.
     * @param {number} h - Alto del area de dibujo.
     * @param {Object} modelo - El estado fisico actual del sistema.
     * @param {Object} resultados - Los calculos matematicos de potencia y corriente.
     * @param {Array} particulas - La lista de electrones para animar.
     */
    static dibujar(ctx, w, h, modelo, resultados, particulas) {
        // tomamos el tamano total y le aplicamos un margen para encuadrar nuestro dibujo
        const margen = 60; const x0 = margen; const y0 = margen;
        const altoLazo = h - margen * 2; const anchoDisponible = w - margen * 2 - 40;

        // dividimos el espacio disponible entre la cantidad de focos para ubicarlos a la misma distancia
        const totalItems = modelo.numSerie;
        const espaciado = Math.min(100, anchoDisponible / totalItems);
        let nodosX = [];
        for(let i=0; i<totalItems; i++) nodosX.push(x0 + (i + 0.5) * espaciado);
        const xFinal = x0 + totalItems * espaciado;

        // ajustamos los colores visuales para indicar si estamos operando normal o en sobrecarga
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

        // dibujamos un unico recuadro solido ya que en serie solo existe un camino para la corriente
        ctx.beginPath();
        ctx.roundRect(x0, y0, xFinal - x0, altoLazo, 25);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // limpiamos el cable donde va la bateria para que parezca conectada a los polos
        ctx.clearRect(x0 - 20, y0 + altoLazo / 2 - 35, 40, 70);

        // insertamos nuestra representacion de bateria en la parte izquierda del circuito
        RenderizadorBase.dibujarBateria(ctx, x0, y0 + altoLazo/2, modelo.voltaje, modelo.estadoSistema);

        // pasamos por cada componente para dibujar su panel de informacion justo en la linea superior
        for (let i = 0; i < totalItems; i++) {
            let boxX = nodosX[i] - 25; let boxY = y0 - 30; 
            ctx.clearRect(boxX, boxY, 50, 60); 
            RenderizadorBase.dibujarCajaHUD(ctx, boxX, boxY, 50, 60, `R${i+1}`, modelo.estadoSistema === 'operativo', resultados.pFocoPrincipal);
        }

        // si no hay falla en el sistema, generamos las particulas que simulan la corriente electrica
        if (modelo.estadoSistema === 'operativo' && resultados.iTotal > 0) {
            const velocidad = Math.min(resultados.iTotal * 0.5, 12);
            const anchoCaminoUnico = xFinal - x0;
            AnimadorElectrones.dibujar(ctx, particulas, velocidad, colorActivo, x0, y0, [anchoCaminoUnico], altoLazo);
        }
        
        // anadimos el breaker en el cable para indicar el punto de seguridad termica
        RenderizadorBase.dibujarBreaker(ctx, x0 - 15, y0 + altoLazo/4, modelo.estadoSistema);
    }
}