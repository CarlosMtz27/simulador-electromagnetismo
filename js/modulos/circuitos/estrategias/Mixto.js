import { RenderizadorBase } from '../../../shared/RenderizadorBase.js';
import { AnimadorElectrones } from '../../../shared/AnimadorElectrones.js';

/**
 * Clase EstrategiaMixto
 * Nos encargamos de renderizar la representacion visual de un circuito mixto,
 * combinando conexiones en serie y en paralelo segun la secuencia definida
 * por el usuario en el modelo.
 */
export class EstrategiaMixto {
    /**
     * Dibujamos el circuito mixto en el lienzo, calculando dinamicamente
     * las distancias, la ubicacion de cada nodo y animando el paso de los electrones.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del area de dibujo.
     * @param {number} h - Alto del area de dibujo.
     * @param {Object} modelo - El estado fisico actual del sistema.
     * @param {Object} resultados - Los calculos matematicos de potencia y corriente.
     * @param {Array} particulas - La lista de electrones para animar.
     */
    static dibujar(ctx, w, h, modelo, resultados, particulas) {
        // preparamos las medidas iniciales donde encajaremos nuestro circuito mixto
        const margen = 60; const x0 = margen; const y0 = margen;
        const altoLazo = h - margen * 2; const anchoDisponible = w - margen * 2 - 40;
        const secuencia = modelo.secuenciaMixta; const N = secuencia.length;

        // precalculamos en que posicion horizontal (X) caera cada elemento de la secuencia
        const totalItems = Math.max(1, N);
        const espaciado = Math.min(100, anchoDisponible / totalItems);
        let nodosX = [];
        for(let i=0; i<totalItems; i++) nodosX.push(x0 + (i + 0.5) * espaciado);
        const xFinal = x0 + totalItems * espaciado;

        // cambiamos el esquema de colores si sobrepasamos el limite termico
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

        // buscamos hasta donde debe llegar el lazo cuadrado principal para cerrarlo correctamente
        let xLoopEnd = xFinal;
        if (N > 0 && secuencia[N-1] === 'P') xLoopEnd = nodosX[N-1];
        
        // trazamos el contorno general del circuito
        ctx.beginPath();
        ctx.roundRect(x0, y0, xLoopEnd - x0, altoLazo, 25);
        
        // revisamos la secuencia para anadir lineas verticales unicamente donde hay derivaciones paralelas (P)
        secuencia.forEach((tipo, i) => {
            if (tipo === 'P' && nodosX[i] !== xLoopEnd) {
                ctx.moveTo(nodosX[i], y0); ctx.lineTo(nodosX[i], y0 + altoLazo);
            }
        });
        ctx.stroke();
        ctx.shadowBlur = 0; 
        
        // limpiamos el cable donde va la bateria para que parezca conectada a los polos
        ctx.clearRect(x0 - 20, y0 + altoLazo / 2 - 35, 40, 70);

        // plantamos nuestra fuente de energia principal
        RenderizadorBase.dibujarBateria(ctx, x0, y0 + altoLazo/2, modelo.voltaje, modelo.estadoSistema);
        
        // colocamos cada componente evaluando su tipo para saber si va arriba, abajo, o en medio
        let idx = 1;
        secuencia.forEach((tipo, i) => {
            const cx = nodosX[i]; const activo = modelo.estadoSistema === 'operativo';
            const potencia = (resultados.pMixto && resultados.pMixto.length > i) ? resultados.pMixto[i] : 0;
            
            let boxY = 0;
            if (tipo === 'S_top') boxY = y0 - 30;
            else if (tipo === 'S_bot') boxY = y0 + altoLazo - 30;
            else if (tipo === 'P') boxY = y0 + altoLazo/2 - 30;
            
            ctx.clearRect(cx - 25, boxY, 50, 60);
            RenderizadorBase.dibujarCajaHUD(ctx, cx - 25, boxY, 50, 60, `R${idx++}`, activo, potencia);
        });

        // si todo marcha bien, damos la orden para que los electrones viajen dividiendose segun la topologia
        if (modelo.estadoSistema === 'operativo' && resultados.iTotal > 0 && N > 0) {
            const velocidad = Math.min(resultados.iTotal * 0.5, 12);
            let caminosX = [];
            secuencia.forEach((tipo, i) => { if (tipo === 'P') caminosX.push(nodosX[i]); });
            if (caminosX.length === 0 || caminosX[caminosX.length - 1] !== xLoopEnd) caminosX.push(xLoopEnd);

            const caminosW = caminosX.map(cx => cx - x0);
            AnimadorElectrones.dibujar(ctx, particulas, velocidad, colorActivo, x0, y0, caminosW, altoLazo);
        }
        
        // integramos el switch para cortar corriente en caso de emergencia
        RenderizadorBase.dibujarBreaker(ctx, x0 - 15, y0 + altoLazo/4, modelo.estadoSistema);
    }
}