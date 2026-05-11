import { Tema } from './Tema.js';

/**
 * Clase RenderizadorBase
 * Proporcionamos herramientas graficas compartidas para dibujar los componentes 
 * basicos y comunes que se utilizan a lo largo de los diferentes modulos de simulacion.
 */
export class RenderizadorBase {
    /**
     * Dibujamos una caja de informacion (HUD) que representa visualmente un componente.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} x - Posicion horizontal de origen.
     * @param {number} y - Posicion vertical de origen.
     * @param {number} w - Ancho de la caja.
     * @param {number} h - Alto de la caja.
     * @param {string} texto - Etiqueta descriptiva del componente.
     * @param {boolean} activo - Indica si la corriente esta fluyendo por aqui.
     * @param {number} potencia - Nivel de watts para calcular la intensidad del brillo.
     */
    static dibujarCajaHUD(ctx, x, y, w, h, texto, activo, potencia = 60) {
        // Trazamos el fondo oscuro de la caja con bordes redondeados
        ctx.fillStyle = '#0f111a'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = activo ? Tema.acento : '#4A4A4A'; ctx.stroke();

        // Si el elemento esta activo y genera potencia, le agregamos un efecto visual de resplandor
        if (activo && texto.startsWith('R') && potencia > 0) {
            const brillo = Math.min(potencia / 60, 1);
            ctx.fillStyle = `rgba(233, 75, 122, ${0.1 + brillo * 0.4})`;
            ctx.shadowBlur = 20 * brillo; ctx.shadowColor = Tema.acento; ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(233, 75, 122, ${0.1 + brillo * 0.4})`; ctx.beginPath(); ctx.arc(x + w/2, y + h/2 - 5, 8, 0, Math.PI * 2); ctx.fill();
        }
        
        // Escribimos la etiqueta identificadora en la parte baja de la caja
        ctx.fillStyle = Tema.acento; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(texto, x + w/2, y + h - 10);
    }

    /**
     * Dibujamos un interruptor termomagnetico (breaker) para mostrar si el circuito es seguro.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} x - Posicion horizontal.
     * @param {number} y - Posicion vertical.
     * @param {string} estado - Estado actual del sistema (ej. operativo, sobrecarga).
     */
    static dibujarBreaker(ctx, x, y, estado) {
        // Pintamos el bloque base del interruptor
        ctx.fillStyle = '#161821'; ctx.fillRect(x, y - 10, 30, 20);
        
        // Evaluamos si el sistema colapso por sobrecarga para pintar los bordes de rojo o verde
        ctx.strokeStyle = estado === 'sobrecarga' ? 'red' : '#00FF00'; ctx.lineWidth = 2; ctx.strokeRect(x, y - 10, 30, 20);
        
        // Colocamos el texto de estado (TRIP para disparo por fallo, ON para operacion normal)
        ctx.fillStyle = estado === 'sobrecarga' ? 'red' : '#00FF00'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(estado === 'sobrecarga' ? 'TRIP' : 'ON', x + 15, y + 3);
    }

    /**
     * Dibujamos la fuente de energia principal (bateria) que alimenta la simulacion.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} x - Posicion horizontal central.
     * @param {number} y - Posicion vertical central.
     * @param {number|string} voltaje - Valor en voltios de la fuente.
     * @param {string} estado - Condicion del circuito (para cambiar colores de alerta).
     */
    static dibujarBateria(ctx, x, y, voltaje, estado) {
        // Dibujamos el cuerpo principal de la bateria
        ctx.fillStyle = '#0B0C10'; 
        ctx.fillRect(x - 35, y - 70, 70, 140);
        
        // Dibujamos el borne o terminal superior, diferenciando el polo
        ctx.fillStyle = '#C0C0C0'; ctx.fillRect(x - 15, y - 65, 30, 15);
        ctx.fillStyle = '#E94B7A'; ctx.fillRect(x - 15, y - 65, 30, 4); 
        
        // Trazamos el contorno interno que cambia de color bajo estres termico
        ctx.fillStyle = '#1e212b'; ctx.fillRect(x - 30, y - 50, 60, 100);
        ctx.strokeStyle = estado === 'sobrecarga' ? '#FFA500' : '#4A4A4A'; 
        ctx.lineWidth = 3; ctx.strokeRect(x - 30, y - 50, 60, 100);

        // Agregamos un indicador visual en el centro del componente
        ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('PWR', x, y);
        
        // Colocamos el valor numerico del voltaje en la zona inferior de la bateria
        ctx.font = '14px sans-serif';
        ctx.fillStyle = estado === 'sobrecarga' ? '#FFA500' : '#00E5FF';
        ctx.fillText(`${voltaje}V`, x, y + 25);
        ctx.textAlign = 'left';
    }
}