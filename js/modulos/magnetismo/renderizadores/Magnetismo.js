export class RenderizadorMagnetismo {
    static dibujar(ctx, w, h, modelo) {
        // Limpiar el lienzo
        ctx.clearRect(0, 0, w, h);

        // Dibujar elementos en orden de profundidad (fondo a frente)
        if (modelo.mostrarCampo) {
            this.dibujarCampoMagnetico(ctx, modelo);
        }
        
        this.dibujarIman(ctx, modelo);
        
        if (modelo.mostrarVectores && modelo.corriente !== 0) {
            this.dibujarVectores(ctx, modelo);
        }

        this.dibujarCable(ctx, modelo);
    }

    static dibujarCampoMagnetico(ctx, modelo) {
        const ancho = 100; const x = modelo.imanPos.x; const y = modelo.imanPos.y;
        const intensidad = modelo.fuerzaIman / 200; // Normalizado 0 a 1
        
        ctx.save();
        ctx.translate(x, y);
        
        // Flujo animado (las líneas viajan de Norte a Sur)
        const tiempo = performance.now() * 0.02;
        ctx.setLineDash([8, 12]);
        ctx.lineDashOffset = modelo.imanPolaridad === 1 ? -tiempo : tiempo;

        ctx.lineWidth = 1.5;
        const opacidadBase = 0.1 + (0.3 * intensidad);
        
        // Dibujar curvas tipo dipolo
        for (let i = 1; i <= 6; i++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacidadBase * (1 - i/7)})`;
            const rx = ancho / 2 - 10;
            const ry = i * 35; // Expansión vertical de las líneas
            const cx = rx + (i * 20); // Curvatura horizontal
            
            // Arco Superior
            ctx.beginPath();
            ctx.moveTo(-rx, 0);
            ctx.bezierCurveTo(-cx, -ry * 1.5, cx, -ry * 1.5, rx, 0);
            ctx.stroke();
            
            // Arco Inferior
            ctx.beginPath();
            ctx.moveTo(-rx, 0);
            ctx.bezierCurveTo(-cx, ry * 1.5, cx, ry * 1.5, rx, 0);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        ctx.restore();
    }

    static dibujarIman(ctx, modelo) {
        const ancho = 100;
        const alto = 40;
        const x = modelo.imanPos.x;
        const y = modelo.imanPos.y;
        
        ctx.save();
        ctx.translate(x, y);

        // Sombra del imán para darle profundidad
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowOffsetY = 5;

        // Polo Izquierdo (Depende de la polaridad)
        ctx.fillStyle = modelo.imanPolaridad === 1 ? '#E94B7A' : '#60A5FA'; // Rojo/Rosa (N) o Azul (S)
        ctx.beginPath();
        ctx.roundRect(-ancho/2, -alto/2, ancho/2, alto, {tl: 6, bl: 6, tr: 0, br: 0});
        ctx.fill();

        // Polo Derecho
        ctx.fillStyle = modelo.imanPolaridad === 1 ? '#60A5FA' : '#E94B7A'; // Azul (S) o Rojo/Rosa (N)
        ctx.beginPath();
        ctx.roundRect(0, -alto/2, ancho/2, alto, {tl: 0, bl: 0, tr: 6, br: 6});
        ctx.fill();

        // Gradiente metálico 3D sobre el imán
        const grad = ctx.createLinearGradient(0, -alto/2, 0, alto/2);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-ancho/2, -alto/2, ancho, alto, 6);
        ctx.fill();

        // Textos N y S
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textoIzq = modelo.imanPolaridad === 1 ? 'N' : 'S';
        const textoDer = modelo.imanPolaridad === 1 ? 'S' : 'N';
        
        ctx.fillText(textoIzq, -ancho/4, 0);
        ctx.fillText(textoDer, ancho/4, 0);

        ctx.restore();
    }

    static dibujarCable(ctx, modelo) {
        const puntos = modelo.puntosCable;
        if (puntos.length === 0) return;

        const intensidadAbs = Math.abs(modelo.corriente);
        
        // Estilo del cable
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Si hay corriente, el cable brilla. Si no, es gris opaco.
        if (intensidadAbs > 0) {
            // Color según dirección de corriente
            const colorGlow = modelo.corriente > 0 ? '#E94B7A' : '#60A5FA'; // Rosa hacia un lado, Azul hacia el otro
            
            ctx.lineWidth = 6 + (intensidadAbs * 0.3);
            ctx.strokeStyle = colorGlow;
            ctx.shadowBlur = 10 + (intensidadAbs * 2);
            ctx.shadowColor = colorGlow;
        } else {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#3D4150'; // Cobre apagado/oxidado
            ctx.shadowBlur = 0;
        }

        // Trazar la curva del cable
        ctx.beginPath();
        ctx.moveTo(puntos[0].x, puntos[0].y);
        for (let i = 1; i < puntos.length; i++) {
            ctx.lineTo(puntos[i].x, puntos[i].y);
        }
        ctx.stroke();
        
        // Overlay animado para simular electrones fluyendo en el núcleo del cable
        if (intensidadAbs > 0) {
            ctx.beginPath();
            ctx.moveTo(puntos[0].x, puntos[0].y);
            for (let i = 1; i < puntos.length; i++) ctx.lineTo(puntos[i].x, puntos[i].y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FFFFFF';
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -(performance.now() * 0.05 * modelo.corriente);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.shadowBlur = 0; // Resetear sombras

        // Dibujar los "Nodos" o terminales en los extremos
        ctx.fillStyle = '#2D313F';
        ctx.strokeStyle = intensidadAbs > 0 ? '#FFFFFF' : '#4A4A4A';
        ctx.lineWidth = 2;
        
        ctx.beginPath(); ctx.arc(puntos[0].x, puntos[0].y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(puntos[puntos.length-1].x, puntos[puntos.length-1].y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    static dibujarVectores(ctx, modelo) {
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)'; // Flechas verdes neón
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.lineWidth = 2;

        // No dibujar vectores en cada puntito para no saturar la pantalla
        for (let i = 2; i < modelo.puntosCable.length - 2; i += 2) {
            const p = modelo.puntosCable[i];
            
            // Usar la fuerza ya calculada por el modelo físico
            const fuerzaX = p.fuerzaX;

            // Escalar la fuerza para que la flecha se vea bien en pantalla
            const escalaVisual = 3.0; 
            const finX = p.x + (fuerzaX * escalaVisual);
            const finY = p.y; // Asumimos fuerza horizontal pura para simplificar la visualización didáctica

            // Solo dibujar si la fuerza es mínimamente notable
            if (Math.abs(fuerzaX) > 0.5) {
                this.dibujarFlecha(ctx, p.x, p.y, finX, finY);
            }
        }
    }

    // Utilidad para dibujar flechas
    static dibujarFlecha(ctx, fromx, fromy, tox, toy) {
        const headlen = 8; // longitud de la cabeza de la flecha
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        
        // Cabeza de la flecha
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
}