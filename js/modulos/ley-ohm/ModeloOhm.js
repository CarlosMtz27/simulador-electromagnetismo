export class ModeloOhm {
    constructor() {
        // inicializamos los valores por defecto para nuestro experimento de laboratorio
        this.voltaje = 12; 
        this.resistencia = 100; 
        this.limitePotencia = 50; 
        this.estadoLab = 'seguro'; 
        
        // configuramos nuestro catalogo de celulares que usaremos para probar la carga
        this.modoVista = 'diagrama'; 
        this.telefonos = [
            { id: 0, nombre: "iPhone 5 (5W)", vMax: 5, pMax: 5 },
            { id: 1, nombre: "Samsung Galaxy A54 (25W)", vMax: 9, pMax: 25 },
            { id: 2, nombre: "Samsung Galaxy S24 (45W)", vMax: 10, pMax: 45 },
            { id: 3, nombre: "Xiaomi 13 Pro (120W)", vMax: 20, pMax: 120 }
        ];
        this.celularSeleccionado = this.telefonos[0];
        this.estadoCelular = 'cargando'; 

        this.alActualizar = null;
    }

    // actualizamos las variables de configuracion y mandamos a comprobar si rompimos algo
    setModoVista(modo) { this.modoVista = modo; this.verificarEstado(); }
    setCelular(id) { this.celularSeleccionado = this.telefonos.find(t => t.id === parseInt(id)); this.verificarEstado(); }
    setVoltaje(v) { this.voltaje = parseFloat(v); this.verificarEstado(); }
    setResistencia(r) { this.resistencia = parseFloat(r); this.verificarEstado(); }
    setLimitePotencia(p) { this.limitePotencia = parseFloat(p); this.verificarEstado(); }

    verificarEstado() {
        if (this.modoVista === 'diagrama') {
            // comprobamos si mandamos demasiada energia a la resistencia y provocamos que se queme
            const pActual = this.getPotenciaLab();
            if (pActual > this.limitePotencia) this.estadoLab = 'quemado';
            else if (pActual > this.limitePotencia * 0.85) this.estadoLab = 'critico';
            else this.estadoLab = 'seguro';
        } else {
            // evaluamos si conectamos un cargador muy fuerte que pueda freir nuestro celular
            const vCargador = this.voltaje;
            const pCargador = this.limitePotencia; 
            if (vCargador > this.celularSeleccionado.vMax + 1) { 
                this.estadoCelular = 'quemado';
            } else {
                // si el voltaje es seguro, revisamos si la potencia nos da para una carga rapida o lenta
                if (pCargador >= this.celularSeleccionado.pMax) this.estadoCelular = 'rapido';
                else this.estadoCelular = 'lento';
            }
        }
        // le avisamos a la interfaz que terminamos los calculos para que se actualice
        if (this.alActualizar) this.alActualizar();
    }

    // aplicamos la formula clasica de la ley de ohm (I = V / R) para saber cuantos electrones pasan
    getCorrienteLab() { return this.estadoLab === 'quemado' ? 0 : this.voltaje / this.resistencia; }
    // calculamos cuanto calor va a generar nuestro circuito elevando al cuadrado de forma nativa (P = V^2 / R)
    getPotenciaLab() { return (this.voltaje ** 2) / this.resistencia; }
    // descubrimos el punto exacto donde la resistencia no aguantara mas
    getVoltajeCritico() { return Math.sqrt(this.limitePotencia * this.resistencia); }
    getResistenciaCritica() { return (this.voltaje ** 2) / this.limitePotencia; }
}