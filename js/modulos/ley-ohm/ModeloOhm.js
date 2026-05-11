/**
 * Clase ModeloOhm
 * Gestionamos el estado logico y los calculos matematicos para el modulo
 * de la Ley de Ohm, incluyendo la evaluacion de limites termicos.
 */
export class ModeloOhm {
    /**
     * Inicializamos las variables principales para nuestro experimento.
     */
    constructor() {
        // Inicializamos los valores por defecto para nuestro experimento de laboratorio
        this.voltaje = 12; 
        this.resistencia = 100; 
        this.limitePotencia = 50; 
        this.estadoLab = 'seguro'; 
        
        // Configuramos nuestro catalogo de celulares que usaremos para probar la carga
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

    /**
     * Cambiamos la vista activa del simulador.
     * @param {string} modo - El modo a visualizar ('diagrama' o 'celular').
     */
    setModoVista(modo) { 
        this.modoVista = modo; 
        this.verificarEstado(); 
    }
    
    /**
     * Seleccionamos el modelo de telefono celular para la prueba.
     * @param {number|string} id - El identificador del telefono.
     */
    setCelular(id) { 
        this.celularSeleccionado = this.telefonos.find(t => t.id === parseInt(id)); 
        this.verificarEstado(); 
    }
    
    /**
     * Ajustamos el voltaje de la fuente de energia.
     * @param {number|string} v - Valor en voltios.
     */
    setVoltaje(v) { this.voltaje = parseFloat(v); this.verificarEstado(); }
    
    /**
     * Modificamos la resistencia del circuito.
     * @param {number|string} r - Valor en ohmios.
     */
    setResistencia(r) { this.resistencia = parseFloat(r); this.verificarEstado(); }
    
    /**
     * Definimos el limite maximo de potencia que soporta la resistencia.
     * @param {number|string} p - Valor en watts.
     */
    setLimitePotencia(p) { this.limitePotencia = parseFloat(p); this.verificarEstado(); }

    /**
     * Evaluamos el estado termico del circuito o del celular.
     */
    verificarEstado() {
        if (this.modoVista === 'diagrama') {
            // Comprobamos si mandamos demasiada energia a la resistencia y provocamos que se queme
            const pActual = this.getPotenciaLab();
            if (pActual > this.limitePotencia) this.estadoLab = 'quemado';
            else if (pActual > this.limitePotencia * 0.85) this.estadoLab = 'critico';
            else this.estadoLab = 'seguro';
        } else {
            // Evaluamos si conectamos un cargador muy fuerte que pueda freir nuestro celular
            const vCargador = this.voltaje;
            const pCargador = this.limitePotencia; 
            if (vCargador > this.celularSeleccionado.vMax + 1) { 
                this.estadoCelular = 'quemado';
            } else {
                // Si el voltaje es seguro, revisamos si la potencia nos da para una carga rapida o lenta
                if (pCargador >= this.celularSeleccionado.pMax) this.estadoCelular = 'rapido';
                else this.estadoCelular = 'lento';
            }
        }
        // Le avisamos a la interfaz que terminamos los calculos para que se actualice
        if (this.alActualizar) this.alActualizar();
    }

    /**
     * Obtenemos la corriente resultante segun la Ley de Ohm.
     * @returns {number} Corriente en amperios.
     */
    getCorrienteLab() { return this.estadoLab === 'quemado' ? 0 : this.voltaje / this.resistencia; }
    
    /**
     * Calculamos la potencia disipada por el componente elevando al cuadrado de forma nativa.
     * @returns {number} Potencia en watts.
     */
    getPotenciaLab() { return (this.voltaje ** 2) / this.resistencia; }
    
    /**
     * Descubrimos el voltaje exacto donde la resistencia no aguantara mas.
     * @returns {number} Voltaje critico en voltios.
     */
    getVoltajeCritico() { return Math.sqrt(this.limitePotencia * this.resistencia); }
    
    /**
     * Calculamos la resistencia minima segura para el voltaje actual.
     * @returns {number} Resistencia critica en ohmios.
     */
    getResistenciaCritica() { return (this.voltaje ** 2) / this.limitePotencia; }
}