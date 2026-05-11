import { EstrategiaSerie } from '../estrategias/Serie.js';
import { EstrategiaParalelo } from '../estrategias/Paralelo.js';
import { EstrategiaMixto } from '../estrategias/Mixto.js';

/**
 * Clase RenderizadorDiagrama
 * Actuamos como un director que delega el trabajo de dibujado a la estrategia
 * correspondiente segun la topologia seleccionada por el usuario.
 */
export class RenderizadorDiagrama {
    /**
     * Limpiamos el lienzo y dirigimos el dibujado hacia el modulo adecuado.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del area de dibujo.
     * @param {number} h - Alto del area de dibujo.
     * @param {Object} modelo - El estado fisico actual del sistema.
     * @param {Object} resultados - Los calculos matematicos en tiempo real.
     * @param {Array} particulas - La lista de electrones para animar.
     */
    static dibujar(ctx, w, h, modelo, resultados, particulas) {
        // Limpiamos toda la superficie de dibujo antes de iniciar el siguiente frame
        ctx.clearRect(0, 0, w, h);
        
        // Revisamos que tipo de configuracion usamos y llamamos al modulo correspondiente
        if (modelo.topologia === 'serie') {
            // Delegamos el trabajo de trazar para la configuracion en serie
            EstrategiaSerie.dibujar(ctx, w, h, modelo, resultados, particulas);
        } else if (modelo.topologia === 'paralelo') {
            // Delegamos el trabajo de trazar para la configuracion en paralelo
            EstrategiaParalelo.dibujar(ctx, w, h, modelo, resultados, particulas);
        } else if (modelo.topologia === 'mixto') {
            // Delegamos el trabajo de trazar para nuestra topologia combinada
            EstrategiaMixto.dibujar(ctx, w, h, modelo, resultados, particulas);
        }
    }
}