/**
 * Clase RenderizadorMagnetismo
 * Nos encargamos de dibujar el laboratorio interactivo para visualizar 
 * la interaccion entre el campo magnetico y el cable con corriente.
 */
export class RenderizadorMagnetismo {
    /**
     * Trazamos todos los componentes del experimento en el orden correcto de profundidad.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del lienzo.
     * @param {number} h - Alto del lienzo.
     * @param {Object} modelo - Estado y fisicas del sistema electromagnetico.
     */
    static dibujar(ctx, w, h, modelo) {
        // Limpiamos el lienzo para preparar el nuevo frame
        ctx.clearRect(0, 0, w, h);

        // Dibujamos los elementos en orden de profundidad (del fondo al frente)
        if (modelo.mostrarCampo) {
            this.dibujarCampoMagnetico(ctx, modelo);
        }
        
        this.dibujarIman(ctx, modelo);
        
        if (modelo.mostrarVectores && modelo.corriente !== 0) {
            this.dibujarVectores(ctx, modelo);
        }

        this.dibujarCable(ctx, modelo);
        
        // Inyectamos el panel HUD flotante con los datos telemetricos
        this.dibujarHUD(ctx, w, h, modelo);
    }

    /**
     * Dibujamos el panel transparente de telemetria en la esquina superior derecha.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del lienzo.
     * @param {number} h - Alto del lienzo.
     * @param {Object} modelo - Las variables fisicas para extraer los calculos.
     */
    static dibujarHUD(ctx, w, h, modelo) {
        if (modelo.modoVista !== 'diagrama') return;

        const padding = 20;
        const boxW = 340;
        const boxH = 150;
        const boxX = w - boxW - padding;
        const boxY = padding;

        ctx.save();
        ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
        ctx.strokeStyle = '#E94B7A';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Escribimos el titulo del panel HUD
        ctx.fillStyle = '#E94B7A';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('TELEMETRIA: FUERZA DE LORENTZ', boxX + 15, boxY + 25);

        // Extraemos los datos calculados por el motor de fisicas
        const I = modelo.corriente || 0;
        const L = 0.01; // Usamos una longitud efectiva fija para este tramo del experimento
        const B = modelo.maxBLocal || 0;
        const F = I * L * B;
        const deflexion = modelo.deflexionMax || 0;

        //Escribimos el desglose y la sustitucion en vivo de la formula
        ctx.fillStyle = '#A0AEC0';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('1. Ecuacion   : F = I x L x B', boxX + 15, boxY + 50);
        ctx.fillStyle = '#00E5FF';
        ctx.fillText(`2. Sustitución: F = ${Math.abs(I).toFixed(1)}A × ${L}m × ${Math.abs(B).toFixed(1)}T`, boxX + 15, boxY + 70);
        ctx.fillStyle = '#FFBF00';
        ctx.fillText(`3. Resultado  : ${Math.abs(F).toFixed(3)} N`, boxX + 15, boxY + 90);

        //Escribimos la informacion complementaria del campo y flexografia
        const pctDeflexion = (deflexion / (w / 2)) * 100; 
        ctx.fillStyle = '#A0AEC0';
        ctx.fillText(`4. Campo B max: ${Math.abs(B).toFixed(2)} Tesla`, boxX + 15, boxY + 115);
        ctx.fillText(`5. Deflexion  : ${deflexion.toFixed(1)} px (${pctDeflexion.toFixed(1)}%)`, boxX + 15, boxY + 135);

        //Indicamos la direccion de la fuerza basandonos en la Regla de la Mano Derecha
        let dirText = 'ESTATICO';
        let dirColor = '#A0AEC0';
        if (Math.abs(F) > 0.001) {
            if (F > 0) { dirText = 'DERECHA ->'; dirColor = '#00FF00'; }
            else { dirText = '<- IZQUIERDA'; dirColor = '#FF3333'; }
        }
        
        ctx.fillStyle = dirColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(dirText, boxX + boxW - 15, boxY + 25);

        ctx.restore();
    }

    /**
     * Trazamos las lineas de flujo del campo magnetico que emanan del iman.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {Object} modelo - El estado fisico del sistema.
     */
    static dibujarCampoMagnetico(ctx, modelo) {
        const ancho = 100; const x = modelo.imanPos.x; const y = modelo.imanPos.y;
        const intensidad = modelo.fuerzaIman / 200; 
        
        ctx.save();
        ctx.translate(x, y);
        
        // Calculamos el flujo animado haciendo que las lineas viajen visualmente
        const tiempo = performance.now() * 0.02;
        ctx.setLineDash([8, 12]);
        ctx.lineDashOffset = modelo.imanPolaridad === 1 ? -tiempo : tiempo;

        ctx.lineWidth = 1.5;
        const opacidadBase = 0.1 + (0.3 * intensidad);
        
        // Dibujamos las multiples curvas expansivas tipo dipolo
        for (let i = 1; i <= 6; i++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacidadBase * (1 - i/7)})`;
            const rx = ancho / 2 - 10;
            const ry = i * 35; 
            const cx = rx + (i * 20); 
            
            // Trazamos el arco superior
            ctx.beginPath();
            ctx.moveTo(-rx, 0);
            ctx.bezierCurveTo(-cx, -ry * 1.5, cx, -ry * 1.5, rx, 0);
            ctx.stroke();
            
            // Trazamos el arco inferior
            ctx.beginPath();
            ctx.moveTo(-rx, 0);
            ctx.bezierCurveTo(-cx, ry * 1.5, cx, ry * 1.5, rx, 0);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        ctx.restore();
    }

    /**
     * Dibujamos el bloque fisico del iman permanente con sus polos coloreados.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {Object} modelo - El estado fisico del sistema.
     */
    static dibujarIman(ctx, modelo) {
        const ancho = 100;
        const alto = 40;
        const x = modelo.imanPos.x;
        const y = modelo.imanPos.y;
        
        ctx.save();
        ctx.translate(x, y);

        // Proyectamos la sombra del iman para darle una sensacion de profundidad
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowOffsetY = 5;

        // Dibujamos el polo izquierdo dependiendo de la polaridad activa
        ctx.fillStyle = modelo.imanPolaridad === 1 ? '#E94B7A' : '#60A5FA'; 
        ctx.beginPath();
        ctx.roundRect(-ancho/2, -alto/2, ancho/2, alto, {tl: 6, bl: 6, tr: 0, br: 0});
        ctx.fill();

        // Dibujamos el polo derecho con su color opuesto
        ctx.fillStyle = modelo.imanPolaridad === 1 ? '#60A5FA' : '#E94B7A'; 
        ctx.beginPath();
        ctx.roundRect(0, -alto/2, ancho/2, alto, {tl: 0, bl: 0, tr: 6, br: 6});
        ctx.fill();

        // Aplicamos un gradiente transparente para darle un acabado metalico 3D
        const grad = ctx.createLinearGradient(0, -alto/2, 0, alto/2);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-ancho/2, -alto/2, ancho, alto, 6);
        ctx.fill();

        // Grabamos las letras indicadoras de los polos (Norte y Sur)
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

    /**
     * Dibujamos la estructura del cable conductor y animamos el paso de los electrones.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {Object} modelo - El estado fisico del sistema.
     */
    static dibujarCable(ctx, modelo) {
        const puntos = modelo.puntosCable;
        if (puntos.length === 0) return;

        const intensidadAbs = Math.abs(modelo.corriente);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Determinamos el estilo del cable: si hay corriente lo hacemos brillar
        if (intensidadAbs > 0) {
            const colorGlow = modelo.corriente > 0 ? '#E94B7A' : '#60A5FA'; 
            
            ctx.lineWidth = 6 + (intensidadAbs * 0.3);
            ctx.strokeStyle = colorGlow;
            ctx.shadowBlur = 10 + (intensidadAbs * 2);
            ctx.shadowColor = colorGlow;
        } else {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#3D4150'; 
            ctx.shadowBlur = 0;
        }

        // Trazamos la curva flexible conectando los nodos
        ctx.beginPath();
        ctx.moveTo(puntos[0].x, puntos[0].y);
        for (let i = 1; i < puntos.length; i++) {
            ctx.lineTo(puntos[i].x, puntos[i].y);
        }
        ctx.stroke();
        
        // Dibujamos un patron discontinuo animado en el centro del cable para simular la corriente
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
        
        ctx.shadowBlur = 0; 

        // Rematamos dibujando las terminales de conexion en los extremos
        ctx.fillStyle = '#2D313F';
        ctx.strokeStyle = intensidadAbs > 0 ? '#FFFFFF' : '#4A4A4A';
        ctx.lineWidth = 2;
        
        ctx.beginPath(); ctx.arc(puntos[0].x, puntos[0].y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(puntos[puntos.length-1].x, puntos[puntos.length-1].y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    /**
     * Trazamos los vectores (flechas) que indican la direccion y magnitud de la fuerza.
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {Object} modelo - El estado fisico del sistema.
     */
    static dibujarVectores(ctx, modelo) {
        // Configuramos el color verde brillante para distinguir facilmente las flechas
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)'; 
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.lineWidth = 2;

        // Dibujamos las flechas omitiendo algunos nodos para no saturar visualmente la pantalla
        for (let i = 2; i < modelo.puntosCable.length - 2; i += 2) {
            const p = modelo.puntosCable[i];
            
            // Utilizamos la magnitud de fuerza que ya calculamos previamente en el modelo
            const fuerzaX = p.fuerzaX;

            // Escalamos el tamano del vector para que resulte util a nivel visual
            const escalaVisual = 3.0; 
            const finX = p.x + (fuerzaX * escalaVisual);
            const finY = p.y; 

            if (Math.abs(fuerzaX) > 0.5) {
                this.dibujarFlecha(ctx, p.x, p.y, finX, finY);
            }
        }
    }

    /**
     * Herramienta auxiliar para construir matematicamente una flecha apuntando
     * hacia las coordenadas deseadas.
     */
    static dibujarFlecha(ctx, fromx, fromy, tox, toy) {
        const headlen = 8; 
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        
        // Dibujamos el triangulo que forma la punta de la flecha
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
}