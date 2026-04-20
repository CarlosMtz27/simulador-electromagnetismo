export class ModeloMagnetismo {
    constructor() {
        this.corriente = 0; // Amperios (puede ser negativo)
        this.fuerzaIman = 50; // Magnitud del campo B
        this.imanPos = { x: 0, y: 0 };
        this.imanPolaridad = 1; // 1: Norte arriba, -1: Sur arriba
        
        this.mostrarVectores = true;
        this.mostrarCampo = true;
        
        this.modoVista = 'diagrama';

        // Variables de la Bomba
        this.voltaje = 0; // V
        this.corrienteBomba = 0; // A
        this.rpm = 0;
        this.caudal = 0; // L/min
        this.temperatura = 25; // °C
        this.eficiencia = 0; // %
        this.resistenciaInterna = 1.5;
        this.kv = 80;
        this.tempAmbiente = 25;
        this.tempCritica = 130;
        this.estadoSistema = 'apagado';
        this.zoomActivo = false;

        // Propiedades del cable (Cuerda física)
        this.puntosCable = [];
        this.numSegmentos = 20;
        this.inicializarCable(450, 600); // Dimensiones iniciales del canvas

        this.alActualizar = null;
    }

    inicializarCable(w, h) {
        this.puntosCable = [];
        const xFijo = w / 2;
        const pasoY = h / (this.numSegmentos - 1);
        
        for (let i = 0; i < this.numSegmentos; i++) {
            this.puntosCable.push({
                x: xFijo,
                y: i * pasoY,
                oldX: xFijo,
                oldY: i * pasoY,
                fijo: (i === 0 || i === this.numSegmentos - 1), // Extremos anclados
                fuerzaX: 0 // Caché de la fuerza aplicada
            });
        }
    }

    setCorriente(val) { this.corriente = parseFloat(val); }
    setFuerzaIman(val) { this.fuerzaIman = parseFloat(val); }
    setImanPos(x, y) { this.imanPos = { x, y }; }
    invertirIman() { this.imanPolaridad *= -1; }

    setModoVista(modo) { this.modoVista = modo; }
    setVoltajeBomba(v) { 
        if (this.estadoSistema !== 'quemado') {
            this.voltaje = parseFloat(v); 
        }
    }
    
    toggleZoom() { this.zoomActivo = !this.zoomActivo; }
    
    repararBomba() {
        this.estadoSistema = 'apagado';
        this.temperatura = 25;
        this.voltaje = 0;
        this.rpm = 0;
    }

    // MOTOR DE FÍSICA (Verlet, Termodinámica)
    actualizarFisica(dtReal) {
        // LORENTZ (Física Verlet, Usamos dt fijo para estabilidad)
        const dtLorentz = 0.16;
        for (let p of this.puntosCable) {
            if (p.fijo) continue;

            // Calcular distancia al imán
            const dx = p.x - this.imanPos.x;
            const dy = p.y - this.imanPos.y;
            const distSq = dx * dx + dy * dy + 500; // Usamos Offset para evitar división por cero
            
            // Fuerza de Lorentz Simplificada: F = I * (L x B)
            // La fuerza es perpendicular a la corriente (Eje Y) y al campo B (Eje Z simulado)
            // Esto empuja el cable en el eje X
            const bLocal = (this.fuerzaIman * this.imanPolaridad * 1000) / distSq;
            const fuerzaX = this.corriente * bLocal;
            p.fuerzaX = fuerzaX; // Guardamos la fuerza para no recalcularla en el render

            // Guardar posición actual
            const tempX = p.x;
            const tempY = p.y;

            // Verlet: pos = pos + (pos - oldPos) + fuerza * dt^2
            p.x += (p.x - p.oldX) + fuerzaX * dtLorentz * dtLorentz;
            p.y += (p.y - p.oldY); // El cable no se mueve mucho en Y por la tensión

            // Fricción/Amortiguación para que no oscile infinitamente
            p.x = tempX + (p.x - tempX) * 0.95;

            p.oldX = tempX;
            p.oldY = tempY;
        }

        // Restricciones de distancia (Mantener el cable unido)
        const distanciaDeseada = 450 / (this.numSegmentos - 1);
        for (let i = 0; i < 5; i++) { // Varias iteraciones para estabilidad
            for (let j = 0; j < this.puntosCable.length - 1; j++) {
                const p1 = this.puntosCable[j];
                const p2 = this.puntosCable[j+1];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const diferencia = (distanciaDeseada - dist) / dist;
                const offsetX = dx * diferencia * 0.5;
                const offsetY = dy * diferencia * 0.5;

                if (!p1.fijo) { p1.x -= offsetX; p1.y -= offsetY; }
                if (!p2.fijo) { p2.x += offsetX; p2.y += offsetY; }
            }
        }

        //BOMBA (Física Termodinámica, usamos dt real)
        if (this.estadoSistema === 'quemado') {
            this.rpm *= 0.95; // Frena por inercia
            this.caudal = 0;
            this.corrienteBomba = 0;
            if (this.temperatura > 25) this.temperatura -= 5 * dtReal;
            return;
        }

        //Dinámica del Motor
        this.corrienteBomba = this.voltaje * 0.5; // Relación simple V=IR
        const rpmObjetivo = this.voltaje * 60; // 60 RPM por cada Voltio
        // Suavizado de aceleración
        this.rpm += (rpmObjetivo - this.rpm) * 5 * dtReal;

        //Dinámica de Fluidos (La regadera necesita al menos 1000 RPM para subir el agua)
        if (this.rpm > 1000) {
            this.caudal = (this.rpm - 1000) * 0.01;
        } else {
            this.caudal = 0;
        }

        //Termodinámica (Sobrevoltaje)
        if (this.voltaje > 48) {
            this.estadoSistema = 'sobrevoltaje';
            // Calentamiento exponencial rápido
            const exceso = this.voltaje - 48;
            this.temperatura += (exceso * exceso * 0.5) * dtReal; 
        } else {
            // Operación normal: se enfría o mantiene
            if (this.voltaje > 0) this.estadoSistema = 'optimo';
            else this.estadoSistema = 'apagado';
            
            if (this.temperatura > 25) {
                this.temperatura -= 10 * dtReal; // Enfriamiento activo
            }
        }

        // Comprobar falla
        if (this.temperatura >= this.tempCritica) {
            this.estadoSistema = 'quemado';
            this.temperatura = this.tempCritica;
            this.voltaje = 0; // Cortar energía si explota
        }
    }
}