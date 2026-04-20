export class RenderizadorBase {
    static dibujarCajaHUD(ctx, x, y, w, h, texto, activo, potencia = 60) {
        ctx.fillStyle = '#0f111a'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = activo ? 'var(--accent)' : '#4A4A4A'; ctx.stroke();

        if (activo && texto.startsWith('R') && potencia > 0) {
            const brillo = Math.min(potencia / 60, 1);
            ctx.fillStyle = `rgba(233, 75, 122, ${0.1 + brillo * 0.4})`;
            ctx.shadowBlur = 20 * brillo; ctx.shadowColor = 'var(--accent)'; ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = 'var(--accent)'; ctx.beginPath(); ctx.arc(x + w/2, y + h/2 - 5, 8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#E2E8F0'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(texto, x + w/2, y + h - 10);
    }

    static dibujarBreaker(ctx, x, y, estado) {
        ctx.fillStyle = '#161821'; ctx.fillRect(x, y - 10, 30, 20);
        ctx.strokeStyle = estado === 'sobrecarga' ? 'red' : '#00FF00'; ctx.lineWidth = 2; ctx.strokeRect(x, y - 10, 30, 20);
        ctx.fillStyle = estado === 'sobrecarga' ? 'red' : '#00FF00'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(estado === 'sobrecarga' ? 'TRIP' : 'ON', x + 15, y + 3);
    }

    static dibujarBateria(ctx, x, y, voltaje, estado) {
        ctx.fillStyle = '#0B0C10'; 
        ctx.fillRect(x - 35, y - 70, 70, 140);
        
        ctx.fillStyle = '#C0C0C0'; ctx.fillRect(x - 15, y - 65, 30, 15);
        ctx.fillStyle = '#E94B7A'; ctx.fillRect(x - 15, y - 65, 30, 4); 
        
        ctx.fillStyle = '#1e212b'; ctx.fillRect(x - 30, y - 50, 60, 100);
        ctx.strokeStyle = estado === 'sobrecarga' ? '#FFA500' : '#4A4A4A'; 
        ctx.lineWidth = 3; ctx.strokeRect(x - 30, y - 50, 60, 100);

        ctx.fillStyle = '#E2E8F0'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚡', x, y);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = estado === 'sobrecarga' ? '#FFA500' : '#00E5FF';
        ctx.fillText(`${voltaje}V`, x, y + 25);
        ctx.textAlign = 'left';
    }
}