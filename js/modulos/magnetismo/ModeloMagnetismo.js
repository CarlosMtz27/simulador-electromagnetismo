/**
 * Clase ModeloMagnetismo
 * Gestionamos el estado fisico, las matematicas y la termodinamica tanto del 
 * experimento de la Fuerza de Lorentz como del Motor de Corriente Directa (Bomba).
 */
export class ModeloMagnetismo {
    /**
     * Inicializamos todas las variables fisicas necesarias para nuestras simulaciones.
     */
    constructor() {
        this.corriente = 0; // Amperios (puede ser negativo)
        this.fuerzaIman = 50; // Magnitud del campo B
        this.imanPos = { x: 0, y: 0 };
        this.imanPolaridad = 1; // 1: Norte arriba, -1: Sur arriba
        
        this.maxBLocal = 0;
        this.deflexionMax = 0;

        this.mostrarVectores = true;
        this.mostrarCampo = true;
        
        this.modoVista = 'diagrama';

        // Variables de la bomba termodinamica
        this.voltaje = 0; // V
        this.corrienteBomba = 0; // A
        this.rpm = 0;
        this.caudal = 0; // L/min
        this.temperatura = 25; // °C
        this.eficiencia = 0; // %
        this.potenciaElectrica = 0;
        this.potenciaMecanica = 0;
        this.tiempoFalla = 0; // Segundos
        this.resistenciaInterna = 1.5;
        this.kv = 80;
        this.tempAmbiente = 25;
        this.tempCritica = 130;
        this.estadoSistema = 'apagado';
        this.zoomActivo = false;

        // Propiedades del cable (Cuerda fisica)
        this.puntosCable = [];
        this.numSegmentos = 20;
        this.inicializarCable(450, 600); 

        this.alActualizar = null;
    }

    /**
     * Creamos la estructura de nodos encadenados que representara nuestro cable flexible.
     * @param {number} w - Ancho inicial del lienzo.
     * @param {number} h - Alto inicial del lienzo.
     */
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
                fijo: (i === 0 || i === this.numSegmentos - 1), 
                fuerzaX: 0 
            });
        }
    }

    /**
     * Ajustamos la corriente electrica que circula por el cable en el modo diagrama.
     * @param {number|string} val - Amperios.
     */
    setCorriente(val) { this.corriente = parseFloat(val); }
    
    /**
     * Modificamos la fuerza del campo magnetico del iman.
     * @param {number|string} val - Teslas (simulados).
     */
    setFuerzaIman(val) { this.fuerzaIman = parseFloat(val); }
    
    /**
     * Actualizamos la ubicacion del iman arrastrable en la pantalla.
     * @param {number} x - Posicion horizontal.
     * @param {number} y - Posicion vertical.
     */
    setImanPos(x, y) { this.imanPos = { x, y }; }
    
    /**
     * Cambiamos la orientacion (Norte/Sur) de nuestro iman.
     */
    invertirIman() { this.imanPolaridad *= -1; }

    /**
     * Cambiamos la vista activa del simulador.
     * @param {string} modo - 'diagrama' o 'mundoReal'.
     */
    setModoVista(modo) { this.modoVista = modo; }
    
    /**
     * Inyectamos voltaje al motor DC de la bomba de agua.
     * @param {number|string} v - Voltios.
     */
    setVoltajeBomba(v) { 
        if (this.estadoSistema !== 'quemado') {
            this.voltaje = parseFloat(v); 
        }
    }
    
    /**
     * Alternamos la visualizacion con rayos X (Zoom) del interior del motor.
     */
    toggleZoom() { this.zoomActivo = !this.zoomActivo; }
    
    /**
     * Restauramos los valores termicos y de operacion del motor si este se daño.
     */
    repararBomba() {
        this.estadoSistema = 'apagado';
        this.temperatura = 25;
        this.voltaje = 0;
        this.rpm = 0;
        this.eficiencia = 0;
        this.potenciaElectrica = 0;
        this.potenciaMecanica = 0;
        this.tiempoFalla = 0;
    }

    /**
     * Motor principal de fisicas. Calculamos las fuerzas de Lorentz, resolvemos las
     * restricciones del cable y procesamos la termodinamica del motor.
     * @param {number} dtReal - Delta de tiempo transcurrido entre frames.
     */
    actualizarFisica(dtReal) {
        // LORENTZ (Fisica Verlet, usamos dt fijo para estabilidad)
        const dtLorentz = 0.16;
        this.maxBLocal = 0;
        this.deflexionMax = 0;
        const centroX = this.puntosCable.length > 0 ? this.puntosCable[0].x : 225;

        for (let p of this.puntosCable) {
            if (p.fijo) continue;

            // Calculamos la distancia de cada punto del cable hacia nuestro iman
            const dx = p.x - this.imanPos.x;
            const dy = p.y - this.imanPos.y;
            const distSq = dx * dx + dy * dy + 500; 
            
            // Fuerza de Lorentz Simplificada: F = I * (L x B)
            // La fuerza es perpendicular a la corriente (Eje Y) y al campo B (Eje Z simulado)
            // Esto empuja nuestro cable en el eje X
            const bLocal = (this.fuerzaIman * this.imanPolaridad * 1000) / distSq;
            
            // Extraemos el campo magnetico B maximo a lo largo del cable para la telemetria HUD
            if (Math.abs(bLocal) > Math.abs(this.maxBLocal)) {
                this.maxBLocal = bLocal;
            }

            const fuerzaX = this.corriente * bLocal;
            p.fuerzaX = fuerzaX; // Guardamos la fuerza calculada para que el renderizador la use directo

            // Guardamos la posicion actual antes de aplicar el movimiento
            const tempX = p.x;
            const tempY = p.y;

            // Ecuacion de Verlet: pos = pos + (pos - oldPos) + fuerza * dt^2
            p.x += (p.x - p.oldX) + fuerzaX * dtLorentz * dtLorentz;
            p.y += (p.y - p.oldY); // El cable casi no se mueve en Y gracias a la tension

            // Aplicamos friccion o amortiguacion para que el cable no oscile infinitamente
            p.x = tempX + (p.x - tempX) * 0.95;

            p.oldX = tempX;
            p.oldY = tempY;

            const deflexionActual = Math.abs(p.x - centroX);
            if (deflexionActual > this.deflexionMax) {
                this.deflexionMax = deflexionActual;
            }
        }

        // Resolvemos las restricciones de distancia (mantenemos el cable unido)
        const distanciaDeseada = 450 / (this.numSegmentos - 1);
        for (let i = 0; i < 5; i++) { // Ejecutamos multiples iteraciones para asegurar estabilidad
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

        // BOMBA (Fisica Termodinamica, usamos dt real)
        if (this.estadoSistema === 'quemado') {
            this.rpm *= 0.95; // Frenamos la velocidad del rotor por inercia
            this.caudal = 0;
            this.corrienteBomba = 0;
            this.potenciaElectrica = 0;
            this.potenciaMecanica = 0;
            this.eficiencia = 0;
            this.tiempoFalla = 0;
            if (this.temperatura > 25) this.temperatura -= 5 * dtReal;
            return;
        }

        // Dinamica del Motor
        this.corrienteBomba = this.voltaje * 0.5; 
        const rpmObjetivo = this.voltaje * 60; 
        // Suavizamos la aceleracion del rotor
        this.rpm += (rpmObjetivo - this.rpm) * 5 * dtReal;

        // Calculos de Potencia y Eficiencia
        this.potenciaElectrica = this.voltaje * this.corrienteBomba;
        
        let eta = 85; 
        if (this.voltaje > 48) {
            const exceso = this.voltaje - 48;
            eta = Math.max(5, 85 - (exceso * 6)); // La eficiencia cae drasticamente por la fuga de calor
        } else if (this.voltaje === 0) {
            eta = 0;
        }
        this.eficiencia = eta;
        this.potenciaMecanica = this.potenciaElectrica * (eta / 100);

        // Dinamica de Fluidos (la regadera necesita al menos 1000 RPM para subir el agua)
        if (this.rpm > 1000) {
            this.caudal = (this.rpm - 1000) * 0.01;
        } else {
            this.caudal = 0;
        }

        // Termodinamica (calculamos el calentamiento por sobrevoltaje)
        if (this.voltaje > 48) {
            this.estadoSistema = 'sobrevoltaje';
            // Simulamos un calentamiento exponencial rapido
            const exceso = this.voltaje - 48;
            this.temperatura += (exceso * exceso * 0.5) * dtReal; 
        } else {
            // En operacion normal: dejamos que se enfrie o mantenga la temperatura
            if (this.voltaje > 0) this.estadoSistema = 'optimo';
            else this.estadoSistema = 'apagado';
            
            if (this.temperatura > 25) {
                this.temperatura -= 10 * dtReal; 
            }
        }

        // Calculamos el tiempo estimado que resta hasta una falla inminente
        if (this.voltaje > 48 && this.estadoSistema !== 'quemado') {
            const exceso = this.voltaje - 48;
            const tasa = (exceso * exceso * 0.5); 
            if (tasa > 0) {
                this.tiempoFalla = Math.max(0, (this.tempCritica - this.temperatura) / tasa);
            }
        } else {
            this.tiempoFalla = 0;
        }

        // Comprobamos si la temperatura supero el umbral critico
        if (this.temperatura >= this.tempCritica) {
            this.estadoSistema = 'quemado';
            this.temperatura = this.tempCritica;
            this.voltaje = 0; // Cortamos la energia internamente para simular el corto
        }
    }
}