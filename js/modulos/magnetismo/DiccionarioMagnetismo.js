/**
 * DiccionarioMagnetismo
 * Almacenamos los textos, titulos y explicaciones fisicas que se
 * mostraran en la interfaz del modulo de magnetismo y motor de corriente continua.
 */
export const DiccionarioMagnetismo = {
    titulos: {
        principal: "Laboratorio de Fuerza de Lorentz",
        analisis: "Analisis Electromagnetico",
        instrucciones: "Arrastra el iman cerca del cable para observar la interaccion."
    },
    teoria: {
        sinCorriente: "ESTADO: Circuito Abierto. Sin electrones en movimiento no hay campo magnetico, por lo que el iman no afecta al cable.",
        conCorriente: "ESTADO: Corriente Activa. El flujo de electrones genera un campo magnetico circular (Ley de Oersted) que interactua con el iman.",
        fuerzaLorentz: "Fuerza detectada: La deflexion del cable es proporcional a la intensidad (I) y al campo magnetico (B).",
        polaridad: "Nota: Al invertir la polaridad o el sentido de la corriente, la direccion de la fuerza se invierte (Regla de la mano derecha).",
        fuerzaFormula: "F = I · L · B (L = 0.01 m, longitud efectiva del segmento de cable)"

    },
    controles: {
        corriente: "Intensidad de Corriente (A)",
        fuerzaIman: "Fuerza del Iman (Tesla)",
        btnInvertir: "Invertir Polos N/S",
        mostrarVectores: "Visualizar Vectores de Fuerza",
        mostrarCampo: "Visualizar Campo Magnetico"
    },
    bomba: {
        titulos: {
            principal: "Sistema de Bombeo y Regadera",
            analisis: "Telemetria del Sistema",
            especificaciones: "Motor DC: Limite Operativo 48V | Voltaje Critico: >48V"
        },
        estados: {
            apagado: "SISTEMA EN ESPERA: Voltaje cero. Motor detenido.",
            optimo: "OPERACION NORMAL: El campo magnetico induce la rotacion de forma segura.",
            sobrevoltaje: "ADVERTENCIA - SOBREVOLTAJE: El exceso de voltaje (>48V) esta generando un calentamiento extremo por Efecto Joule (I^2R).",
            quemado: "FALLA CATASTROFICA: El calor ha derretido el esmalte de las bobinas, causando un cortocircuito. Motor destruido."
        }
    }
};