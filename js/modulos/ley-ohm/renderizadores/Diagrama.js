import { RenderizadorCelular } from './Celular.js';
import { AnimadorElectrones } from '../../../shared/AnimadorElectrones.js';
import { RenderizadorBase } from '../../../shared/RenderizadorBase.js';

export class RenderizadorDiagrama {
    static dibujar(ctx, w, h, modelo, particulas, humoObj) {
        // definimos las coordenadas internas y los tamanos que nos serviran de guia para centrar nuestro grafico
        const x = 80; const y = 80; const rw = w - 160; const rh = h - 160;

        // trazamos un camino rectangular redondeado que funcionara como nuestro cable conductor principal
        ctx.beginPath(); ctx.roundRect(x, y, rw, rh, 25);
        ctx.strokeStyle = modelo.estadoLab === 'critico' ? 'rgba(255, 165, 0, 0.6)' : '#2D313F'; 
        ctx.lineWidth = 12; 
        // si llevamos la corriente al limite, encendemos un brillo naranja para advertir que el cable se esta calentando
        if (modelo.estadoLab === 'critico') { ctx.shadowBlur = 10; ctx.shadowColor = 'orange'; }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // obtenemos el valor de la corriente y, si hay flujo y no rompimos nada, invocamos las particulas
        const corriente = modelo.getCorrienteLab();
        if (modelo.estadoLab !== 'quemado' && corriente > 0) {
            // definimos el color de los electrones y su velocidad; si estamos cerca del fallo los pintamos rojos
            const colorParticula = modelo.estadoLab === 'critico' ? '#FF5722' : '#00E5FF';
            const velocidad = Math.min(corriente * 0.4, 20);
            AnimadorElectrones.dibujar(ctx, particulas, velocidad, colorParticula, x, y, [rw], rh);
        }

        // evaluamos si mandamos demasiada potencia para pintar la bateria de rojo, luego la pegamos al lado derecho
        const estadoBateria = modelo.estadoLab === 'critico' ? 'sobrecarga' : 'operativo';
        RenderizadorBase.dibujarBateria(ctx, x + rw, y + rh/2, modelo.voltaje, estadoBateria);

        // preparamos las posiciones del costado izquierdo para instalar nuestra resistencia termica
        const rx = x - 20; const ry = y + rh/2 - 40;
        if (modelo.estadoLab === 'quemado') {
            // si provocamos un accidente, rompemos el dibujo de la resistencia separandola en dos mitades carbonizadas
            ctx.fillStyle = '#1a1a1a'; 
            ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 40, ry); ctx.lineTo(rx + 40, ry + 25); ctx.lineTo(rx + 20, ry + 35); ctx.lineTo(rx, ry + 25); ctx.fill();
            ctx.beginPath(); ctx.moveTo(rx, ry + 80); ctx.lineTo(rx + 40, ry + 80); ctx.lineTo(rx + 40, ry + 55); ctx.lineTo(rx + 20, ry + 45); ctx.lineTo(rx, ry + 55); ctx.fill();
            
            // reubicamos rapidamente nuestro origen al centro roto para soltar el humo sin afectar el resto del dibujo
            ctx.save();
            ctx.translate(x, y + rh/2);
            RenderizadorCelular.animarHumoYFuego(ctx, 0, 0, humoObj);
            ctx.restore();
        } else {
            // si todo resiste, verificamos si necesitamos aplicar un brillo rojizo porque el componente se esta sofocando
            if (modelo.estadoLab === 'critico') { ctx.shadowBlur = 15; ctx.shadowColor = 'red'; }
            
            // construimos el bloque solido de la resistencia pintandolo de un tono beige o rojo segun su temperatura
            ctx.fillStyle = modelo.estadoLab === 'critico' ? '#D84315' : '#E8C396'; 
            ctx.beginPath(); ctx.roundRect(rx, ry, 40, 80, 8); ctx.fill();
            ctx.shadowBlur = 0;

            // pintamos el famoso codigo de tres bandas de colores encima del material ceramico
            ctx.fillStyle = '#8B4513'; ctx.fillRect(rx, ry + 15, 40, 8);
            ctx.fillStyle = '#000000'; ctx.fillRect(rx, ry + 35, 40, 8);
            ctx.fillStyle = '#B8860B'; ctx.fillRect(rx, ry + 55, 40, 8);

            // flotamos el texto con los ohms exactos justo a un lado para que el usuario pueda tomar la lectura
            ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText(`${modelo.resistencia}Ω`, x - 30, y + rh/2 + 5);
            ctx.textAlign = 'left';
        }
    }
}