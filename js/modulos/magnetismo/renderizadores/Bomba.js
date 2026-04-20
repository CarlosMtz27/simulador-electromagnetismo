export class RenderizadorBomba {
    static dibujar(ctx, w, h, modelo, angulo, gotas, dt) {
        ctx.clearRect(0, 0, w, h);

        if (modelo.zoomActivo) {
            this.dibujarModoZoom(ctx, w, h, modelo, angulo);
        } else {
            this.dibujarModoGeneral(ctx, w, h, modelo, angulo, gotas, dt);
        }

        // Efecto de humo si está quemado
        if (modelo.estadoSistema === 'quemado') {
            this.dibujarHumo(ctx, w, h);
        }
    }

    //VISTA GENERAL (Bomba y Regadera)
    static dibujarModoGeneral(ctx, w, h, modelo, angulo, gotas, dt) {
        const xMotor = w * 0.3;
        const yBase = h * 0.8; // Piso
        const xBomba = w * 0.6;
        const yRegadera = h * 0.2;

        //Tubería (Sube de la bomba a la regadera)
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 15;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(xBomba, yBase - 30);
        ctx.lineTo(xBomba, yRegadera);
        ctx.lineTo(xBomba + 100, yRegadera);
        ctx.stroke();

        // Animación del agua fluyendo dentro de la tubería
        if (modelo.caudal > 0 && modelo.estadoSistema !== 'quemado') {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
            ctx.lineWidth = 8;
            ctx.setLineDash([15, 10]);
            // La velocidad de la animación es proporcional al caudal
            ctx.lineDashOffset = -(performance.now() * 0.005 * modelo.caudal);
            ctx.beginPath();
            ctx.moveTo(xBomba, yBase - 30);
            ctx.lineTo(xBomba, yRegadera);
            ctx.lineTo(xBomba + 100, yRegadera);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        //Cabezal de la Regadera
        ctx.fillStyle = '#718096';
        ctx.beginPath();
        ctx.arc(xBomba + 100, yRegadera, 25, 0, Math.PI, true);
        ctx.fill();

        //Partículas de Agua cayendo
        // Se llama siempre para que las gotas activas terminen de caer con la gravedad aunque se apague el motor
        this.actualizarFluidos(ctx, xBomba + 100, yRegadera, yBase, modelo, gotas, dt);

        // Batería y Cables (Izquierda)
        ctx.fillStyle = '#1e212b';
        ctx.fillRect(xMotor - 120, yBase - 40, 60, 80);
        ctx.fillStyle = '#60A5FA'; ctx.fillRect(xMotor - 120, yBase - 40, 60, 20); // Polo Azul
        ctx.fillStyle = '#E94B7A'; ctx.fillRect(xMotor - 120, yBase + 20, 60, 20); // Polo Rojo
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = modelo.corrienteBomba > 0 && modelo.estadoSistema !== 'quemado' ? '#D4AF37' : '#444';
        ctx.shadowBlur = modelo.corrienteBomba > 0 && modelo.estadoSistema !== 'quemado' ? 10 : 0;
        ctx.shadowColor = '#FFBF00';
        ctx.beginPath(); ctx.moveTo(xMotor - 60, yBase - 30); ctx.lineTo(xMotor, yBase - 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xMotor - 60, yBase + 30); ctx.lineTo(xMotor, yBase + 30); ctx.stroke();
        ctx.shadowBlur = 0;

        //Motor Exterior
        let colorMotor = '#2d3748';
        if (modelo.temperatura > 50) {
            const ratio = Math.min((modelo.temperatura - 50) / 70, 1);
            colorMotor = `rgb(${45 + ratio * 200}, 55, 72)`; // Se pone rojo
        }
        ctx.fillStyle = colorMotor;
        ctx.beginPath(); ctx.arc(xMotor, yBase, 45, 0, Math.PI*2); ctx.fill();
        
        //Eje de transmisión
        ctx.fillStyle = '#718096';
        ctx.fillRect(xMotor + 45, yBase - 5, xBomba - xMotor - 45, 10);

        // Bomba Centrífuga
        ctx.fillStyle = '#1a202c';
        ctx.beginPath(); ctx.arc(xBomba, yBase, 40, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#4A5568'; ctx.lineWidth = 4; ctx.stroke();
        
        // Impulsor rotando
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
                    // La fuerza con la que sale disparada el agua depende del caudal
                    g.velY = 2 + Math.random() * 2 + (modelo.caudal * 0.2);
                }
            } else {
                // Gravedad constante (caen naturalmente aunque se apague la bomba)
                g.y += g.velY * (dt * 60);
                g.velY += 0.1 * (dt * 60); // Aceleración por gravedad

                ctx.beginPath(); ctx.arc(g.x, g.y, 2.5, 0, Math.PI*2); ctx.fill();
                // Si toca el suelo o sale de pantalla, se recicla
                if (g.y > yBase) g.activo = false;
            }
        });
        ctx.shadowBlur = 0;
    }

    // VISTA INTERNA DEL MOTOR (ZOOM)
    static dibujarModoZoom(ctx, w, h, modelo, angulo) {
        const cx = w / 2;
        const cy = h / 2;

        // Líneas de Campo Magnético (Estator)
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)'; // Verde neón muy suave
        ctx.lineWidth = 2;
        for (let i = -100; i <= 100; i += 20) {
            // Animación de flujo magnético
            const offset = (performance.now() / 20) % 20;
            ctx.beginPath();
            ctx.setLineDash([10, 10]);
            ctx.moveTo(cx - 200, cy + i);
            ctx.lineTo(cx + 200, cy + i);
            ctx.lineDashOffset = -offset;
            ctx.stroke();
        }
        ctx.setLineDash([]); // Reset

        //Imanes del Estator
        ctx.fillStyle = '#E94B7A'; ctx.fillRect(cx - 250, cy - 150, 80, 300); // Norte
        ctx.fillStyle = '#60A5FA'; ctx.fillRect(cx + 170, cy - 150, 80, 300); // Sur
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 40px Arial';
        ctx.fillText('N', cx - 225, cy + 15); ctx.fillText('S', cx + 195, cy + 15);

        //Rotor Central
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angulo);

        // Chasis del rotor (rojo si se calienta)
        let colorRotor = '#2d3748';
        if (modelo.temperatura > 50) {
            const r = Math.min((modelo.temperatura - 50) / 70, 1);
            colorRotor = `rgb(${45 + r * 200}, 55, 72)`;
        }
        ctx.fillStyle = colorRotor;
        ctx.fillRect(-40, -120, 80, 240);

        // Bobinas de Cobre
        const intensidad = Math.min(modelo.corrienteBomba / 15, 1);
        ctx.strokeStyle = modelo.estadoSistema === 'quemado' ? '#333' : '#D4AF37';
        ctx.lineWidth = 6;
        if (intensidad > 0 && modelo.estadoSistema !== 'quemado') {
            ctx.shadowBlur = 20 * intensidad;
            ctx.shadowColor = '#FFBF00';
            ctx.strokeStyle = `rgb(255, ${200 - intensidad*100}, 50)`; 
        }

        // Trazado del enrollado
        for(let i = -100; i <= 100; i += 20) {
            ctx.beginPath(); ctx.moveTo(-40, i); ctx.lineTo(40, i); ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();

        //Conmutador y Escobillas
        ctx.fillStyle = '#A0AEC0'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(cx - 35, cy - 10, 10, 20); ctx.fillRect(cx + 25, cy - 10, 10, 20);
    }

    static dibujarHumo(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        for(let i=0; i<20; i++) {
            ctx.beginPath();
            ctx.arc(w/2 + (Math.random() - 0.5)*200, h/2 - 50 - Math.random()*150, 20 + Math.random()*40, 0, Math.PI*2);
            ctx.fill();
        }
    }
}