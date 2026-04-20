export class RenderizadorCelular {
    static dibujar(ctx, x, y, idCelular, estado, bateria, humoObj) {
        // guardamos la configuracion del lienzo y movemos nuestro punto cero al centro del dibujo para facilitar las matematicas
        ctx.save();
        ctx.translate(x, y); 
        
        // establecemos las medidas generales que tendra el dispositivo en pantalla
        const ancho = 90;
        const alto = 180;
        const cx = -ancho / 2;
        const cy = -alto / 2;

        // evaluamos que modelo de celular eligio el usuario para trazar sus detalles especificos
        switch (parseInt(idCelular)) {
            case 0: 
                // dibujamos el chasis metalico clasico del primer modelo
                this.dibujarChasis(ctx, cx, cy, ancho, alto, 12, '#FFFFFF'); 
                // colocamos el cristal frontal negro
                ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.roundRect(cx + 2, cy + 2, ancho - 4, alto - 4, 10); ctx.fill();
                // marcamos la zona de la pantalla respetando los bordes anchos arriba y abajo
                ctx.fillStyle = '#000000'; ctx.fillRect(cx + 4, cy + 28, ancho - 8, alto - 56);
                // anadimos la camara frontal justo en la parte de arriba
                ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, cy + 10, 2.5, 0, 7); ctx.fill();
                // detallamos la bocina del auricular
                ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.roundRect(-8, cy + 16, 16, 3, 2); ctx.fill();
                // dibujamos el boton de inicio circular con su cuadrito caracteristico adentro
                ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, cy + alto - 14, 8, 0, 7); ctx.stroke();
                ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.strokeRect(-2.5, cy + alto - 16.5, 5, 5);
                break;
            case 1: 
                // construimos el segundo modelo con una pantalla que abarca casi todo el frente
                this.dibujarChasis(ctx, cx, cy, ancho, alto, 14, '#FFFFFF');
                ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.roundRect(cx + 4, cy + 4, ancho - 8, alto - 8, 12); ctx.fill(); 
                // le ponemos la camara perforada flotando en la pantalla
                ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, cy + 14, 2.5, 0, 7); ctx.fill(); 
                break;
            case 2: 
                // trazamos el tercer modelo con esquinas mas cuadradas y sin bordes
                this.dibujarChasis(ctx, cx, cy, ancho, alto, 8, '#FFFFFF'); 
                ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.roundRect(cx + 2, cy + 2, ancho - 4, alto - 4, 6); ctx.fill(); 
                // le ponemos una camara frontal muy pequena
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, cy + 10, 2, 0, 7); ctx.fill(); 
                break;
            case 3: 
                // armamos el ultimo modelo premium con pantalla curva a los lados
                this.dibujarChasis(ctx, cx, cy, ancho, alto, 12, '#FFFFFF');
                ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.roundRect(cx + 1, cy + 2, ancho - 2, alto - 4, 10); ctx.fill();
                // pintamos unos brillos blancos en los costados para simular el cristal curvado
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(cx + 4, cy + 10); ctx.lineTo(cx + 4, cy + alto - 10); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + ancho - 4, cy + 10); ctx.lineTo(cx + ancho - 4, cy + alto - 10); ctx.stroke();
                // agregamos su sensor fotografico superior
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, cy + 12, 2.5, 0, 7); ctx.fill();
                break;
        }

        // revisamos si la corriente destruyo el telefono
        if (estado === 'quemado') {
            // simulamos los cristales rotos trazando lineas irregulares de color rojo vivo
            ctx.strokeStyle = '#E94B7A'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx + 10, cy + 20); ctx.lineTo(cx + ancho - 10, cy + alto - 30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + ancho - 20, cy + 10); ctx.lineTo(cx + 20, cy + alto - 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 40, cy + alto / 2); ctx.lineTo(cx + ancho - 10, cy + alto / 2 + 20); ctx.stroke();
            
            // invocamos nuestra animacion para que empiecen a salir chispas
            this.animarHumoYFuego(ctx, 0, 0, humoObj);
        } 
        else {
            // si el telefono esta a salvo, procedemos a mostrar su interfaz de carga normal
            this.dibujarInterfazCarga(ctx, 0, 0, bateria, estado, parseInt(idCelular));
        }

        // restauramos las coordenadas originales del lienzo para no afectar a otros dibujos
        ctx.restore(); 
    }

    static dibujarChasis(ctx, x, y, w, h, radio, color) {
        // generamos un rectangulo base con esquinas suavizadas que sirve como la carcasa del celular
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radio);
        ctx.fill();
        // le anadimos un contorno exterior para darle mas forma
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    static dibujarInterfazCarga(ctx, cx, cy, bateria, estado, idCelular) {
        // elegimos el color de la pila, verde si carga rapido o naranja si va muy lento
        const colorBat = estado === 'rapido' ? '#00FF00' : '#FFA500';
        
        // trazamos el icono vacio de la bateria justo en el centro de la pantalla
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
        ctx.strokeRect(-20, -10, 40, 20); 
        ctx.fillStyle = 'white'; ctx.fillRect(21, -4, 3, 8); 
        
        // calculamos el ancho del color interno para simular como se va llenando la energia
        ctx.fillStyle = colorBat;
        ctx.fillRect(-18, -8, (bateria / 100) * 36, 16);

        // preparamos el pincel para escribir los porcentajes
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        if (idCelular === 3 && estado === 'rapido') {
            // si elegimos el modelo gamer y va rapido, dibujamos unas letras mucho mas espectaculares
            ctx.fillStyle = 'var(--accent)';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(`${Math.floor(bateria)}%`, 0, cy + 50);
            ctx.font = '10px sans-serif';
            ctx.fillText("120W HYPER CHARGE", 0, 30);
            
            // anadimos un anillo brillante alrededor para que se vea mas agresivo
            ctx.shadowBlur = 20; ctx.shadowColor = 'var(--accent)';
            ctx.strokeStyle = 'var(--accent)'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // para los demas telefonos, escribimos los textos con la fuente normal
            ctx.fillText(`${Math.floor(bateria)}%`, 0, cy - 25);
            ctx.fillText(estado === 'rapido' ? 'Carga Rápida' : 'Carga Lenta', 0, 25);
        }
    }

    static animarHumoYFuego(ctx, cx, cy, humoObj) {
        // vamos girando y subiendo los valores para que el fuego parezca vivo
        humoObj.angulo += 0.1;
        
        // creamos varios cuadritos de luz amarilla y blanca simulando las chispas que saltan
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'white' : 'yellow';
            ctx.fillRect((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60, 3, 3);
        }

        // dibujamos unos circulos grises semitransparentes que suben oscilando para representar el humo
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        for (let i = 0; i < 4; i++) {
            const ox = Math.sin(humoObj.angulo + i) * 15;
            ctx.beginPath();
            ctx.arc(ox, -20 - (i * 25), 10 + (i * 5), 0, 7);
            ctx.fill();
        }
    }
}