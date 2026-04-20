import { EstrategiaSerie } from '../estrategias/Serie.js';
import { EstrategiaParalelo } from '../estrategias/Paralelo.js';
import { EstrategiaMixto } from '../estrategias/Mixto.js';

export class RenderizadorDiagrama {
    static dibujar(ctx, w, h, modelo, resultados, particulas) {
        // limpiamos toda la superficie de dibujo antes de iniciar el siguiente frame
        ctx.clearRect(0, 0, w, h);
        
        // revisamos que tipo de configuracion usamos y llamamos al modulo correspondiente
        if (modelo.topologia === 'serie') {
            // delegamos el trabajo de trazar para la configuracion en serie
            EstrategiaSerie.dibujar(ctx, w, h, modelo, resultados, particulas);
        } else if (modelo.topologia === 'paralelo') {
            // delegamos el trabajo de trazar para la configuracion en paralelo
            EstrategiaParalelo.dibujar(ctx, w, h, modelo, resultados, particulas);
        } else if (modelo.topologia === 'mixto') {
            // delegamos el trabajo de trazar para nuestra topologia combinada
            EstrategiaMixto.dibujar(ctx, w, h, modelo, resultados, particulas);
        }
    }
}