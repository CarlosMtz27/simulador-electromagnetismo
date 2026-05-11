/**
 * Clase RenderizadorBomba
 * Nos encargamos de dibujar y animar el sistema industrial de la bomba de agua,
 * el motor DC y la fisica del flujo de particulas a traves de la tuberia.
 */
export class RenderizadorBomba {
    /**
     * Limpiamos el lienzo y delegamos el trabajo segun la vista activa (general o rayos X).
     * 
     * @param {CanvasRenderingContext2D} ctx - El pincel del canvas.
     * @param {number} w - Ancho del lienzo.
     * @param {number} h - Alto del lienzo.
     * @param {Object} modelo - El estado termico y mecanico del motor.
     * @param {number} angulo - La rotacion actual del eje en radianes.
     * @param {Array} gotas - La lista de particulas que simulan el agua.
     * @param {number} dt - Diferencia de tiempo para suavizar fisicas.
     */
    static dibujar(ctx, w, h, modelo, angulo, gotas, dt) {
        ctx.clearRect(0, 0, w, h);

        if (modelo.zoomActivo) {
            this.dibujarModoZoom(ctx, w, h, modelo, angulo);
        } else {
            this.dibujarModoGeneral(ctx, w, h, modelo, angulo, gotas, dt);
        }

        if (modelo.estadoSistema === 'quemado') {
            this.dibujarHumo(ctx, w, h);
        }
    }

    /**
     * Trazamos la vista exterior mostrando la fuente de poder, la tuberia,
     * la bomba y la animacion del agua fluyendo hacia la regadera.
     */
    static dibujarModoGeneral(ctx, w, h, modelo, angulo, gotas, dt) {
        const xMotor = w * 0.3;
        const yBase = h * 0.8; 
        const xBomba = w * 0.6;
        const yRegadera = h * 0.2;

        // Dibujamos la tuberia rigida que sube hacia la parte superior
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 15;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(xBomba, yBase - 30);
        ctx.lineTo(xBomba, yRegadera);
        ctx.lineTo(xBomba + 100, yRegadera);
        ctx.stroke();

        // Animamos el agua fluyendo por dentro del conducto
        if (modelo.caudal > 0 && modelo.estadoSistema !== 'quemado') {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
            ctx.lineWidth = 8;
            ctx.setLineDash([15, 10]);
            // Desplazamos las lineas discontinuas a una velocidad proporcional al caudal
            ctx.lineDashOffset = -(performance.now() * 0.005 * modelo.caudal);
            ctx.beginPath();
            ctx.moveTo(xBomba, yBase - 30);
            ctx.lineTo(xBomba, yRegadera);
            ctx.lineTo(xBomba + 100, yRegadera);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Agregamos la cabeza de la regadera en el extremo de la tuberia
        ctx.fillStyle = '#718096';
        ctx.beginPath();
        ctx.arc(xBomba + 100, yRegadera, 25, 0, Math.PI, true);
        ctx.fill();

        // Invocamos el trazado de las particulas de agua cayendo
        // Lo hacemos incondicionalmente para que el agua residual termine de caer por inercia
        this.actualizarFluidos(ctx, xBomba + 100, yRegadera, yBase, modelo, gotas, dt);

        // Dibujamos la bateria y los cables de alimentacion en el lado izquierdo
        ctx.fillStyle = '#1e212b';
        ctx.fillRect(xMotor - 120, yBase - 40, 60, 80);
        ctx.fillStyle = '#60A5FA'; ctx.fillRect(xMotor - 120, yBase - 40, 60, 20); 
        ctx.fillStyle = '#E94B7A'; ctx.fillRect(xMotor - 120, yBase + 20, 60, 20); 
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = modelo.corrienteBomba > 0 && modelo.estadoSistema !== 'quemado' ? '#D4AF37' : '#444';
        ctx.shadowBlur = modelo.corrienteBomba > 0 && modelo.estadoSistema !== 'quemado' ? 10 : 0;
        ctx.shadowColor = '#FFBF00';
        ctx.beginPath(); ctx.moveTo(xMotor - 60, yBase - 30); ctx.lineTo(xMotor, yBase - 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xMotor - 60, yBase + 30); ctx.lineTo(xMotor, yBase + 30); ctx.stroke();
        ctx.shadowBlur = 0;

        // Renderizamos la carcasa exterior del motor electrico
        let colorMotor = '#2d3748';
        if (modelo.temperatura > 50) {
            const ratio = Math.min((modelo.temperatura - 50) / 70, 1);
            colorMotor = `rgb(${45 + ratio * 200}, 55, 72)`; // Tintamos de rojo para indicar peligro termico
        }
        ctx.fillStyle = colorMotor;
        ctx.beginPath(); ctx.arc(xMotor, yBase, 45, 0, Math.PI*2); ctx.fill();
        
        // Conectamos el eje de transmision mecanica hacia la bomba
        ctx.fillStyle = '#718096';
        ctx.fillRect(xMotor + 45, yBase - 5, xBomba - xMotor - 45, 10);

        // Colocamos el contenedor de la bomba centrifuga
        ctx.fillStyle = '#1a202c';
        ctx.beginPath(); ctx.arc(xBomba, yBase, 40, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#4A5568'; ctx.lineWidth = 4; ctx.stroke();
        
        // Construimos y rotamos las aspas del impulsor interior
        ctx.save();
        ctx.translate(xBomba, yBase);
        ctx.rotate(angulo);
        ctx.strokeStyle = '#A0AEC0'; ctx.lineWidth = 4;
        for(let i=0; i<4; i++) {
            ctx.rotate(Math.PI/2);
            ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(15, 15, 30, 0); ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Procesamos la logica de las gotas de agua, calculando trayectorias parabolicas
     * y reciclando las particulas que caen al suelo.
     */
    static actualizarFluidos(ctx, xRegadera, yRegadera, yBase, modelo, gotas, dt) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00E5FF';
        
        const probGota = Math.min(modelo.caudal * 0.1, 1);

        gotas.forEach(g => {
            if (!g.activo) {
                if (modelo.caudal > 0 && Math.random() < probGota) {
                    g.activo = true;
                    g.x = xRegadera + g.offsetX;
                    g.y = yRegadera + 5;
                    // Inyectamos fuerza inicial hacia abajo proporcional a la rapidez del motor
                    g.velY = 2 + Math.random() * 2 + (modelo.caudal * 0.2);
                }
            } else {
                // Sometemos las gotas activas a una gravedad constante
                g.y += g.velY * (dt * 60);
                g.velY += 0.1 * (dt * 60); 

                ctx.beginPath(); ctx.arc(g.x, g.y, 2.5, 0, Math.PI*2); ctx.fill();
                // Reciclamos la particula si cruza la barrera del suelo
                if (g.y > yBase) g.activo = false;
            }
        });
        ctx.shadowBlur = 0;
    }

    /**
     * Trazamos el diagrama esquematico (rayos X) del interior del motor electrico.
     */
    static dibujarModoZoom(ctx, w, h, modelo, angulo) {
        const cx = w / 2;
        const cy = h / 2;

        // Trazamos el campo magnetico que cruza el estator
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)'; 
        ctx.lineWidth = 2;
        for (let i = -100; i <= 100; i += 20) {
            const offset = (performance.now() / 20) % 20;
            ctx.beginPath();
            ctx.setLineDash([10, 10]);
            ctx.moveTo(cx - 200, cy + i);
            ctx.lineTo(cx + 200, cy + i);
            ctx.lineDashOffset = -offset;
            ctx.stroke();
        }
        ctx.setLineDash([]); 

        // Colocamos los grandes imanes permanentes a los lados
        ctx.fillStyle = '#E94B7A'; ctx.fillRect(cx - 250, cy - 150, 80, 300); 
        ctx.fillStyle = '#60A5FA'; ctx.fillRect(cx + 170, cy - 150, 80, 300); 
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 40px Arial';
        ctx.fillText('N', cx - 225, cy + 15); ctx.fillText('S', cx + 195, cy + 15);

        // Rotamos el contexto para poder dibujar el nucleo central girando
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angulo);

        // Dibujamos el chasis del rotor y lo entintamos si alcanza temperaturas peligrosas
        let colorRotor = '#2d3748';
        if (modelo.temperatura > 50) {
            const r = Math.min((modelo.temperatura - 50) / 70, 1);
            colorRotor = `rgb(${45 + r * 200}, 55, 72)`;
        }
        ctx.fillStyle = colorRotor;
        ctx.fillRect(-40, -120, 80, 240);

        // Pintamos el embobinado de cobre que envuelve el rotor
        const intensidad = Math.min(modelo.corrienteBomba / 15, 1);
        ctx.strokeStyle = modelo.estadoSistema === 'quemado' ? '#333' : '#D4AF37';
        ctx.lineWidth = 6;
        if (intensidad > 0 && modelo.estadoSistema !== 'quemado') {
            ctx.shadowBlur = 20 * intensidad;
            ctx.shadowColor = '#FFBF00';
            ctx.strokeStyle = `rgb(255, ${200 - intensidad*100}, 50)`; 
        }

        for(let i = -100; i <= 100; i += 20) {
            ctx.beginPath(); ctx.moveTo(-40, i); ctx.lineTo(40, i); ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();

        // Dibujamos el conmutador electrico y las escobillas de grafito que hacen contacto
        ctx.fillStyle = '#A0AEC0'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(cx - 35, cy - 10, 10, 20); ctx.fillRect(cx + 25, cy - 10, 10, 20);
    }

    /**
     * Desplegamos nubes de humo animadas si el motor alcanza la falla catastrofica.
     */
    static dibujarHumo(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        for(let i=0; i<20; i++) {
            ctx.beginPath();
            ctx.arc(w/2 + (Math.random() - 0.5)*200, h/2 - 50 - Math.random()*150, 20 + Math.random()*40, 0, Math.PI*2);
            ctx.fill();
        }
    }
}