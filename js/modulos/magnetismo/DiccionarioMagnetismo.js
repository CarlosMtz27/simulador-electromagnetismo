export const DiccionarioMagnetismo = {
    titulos: {
        principal: "Laboratorio de Fuerza de Lorentz",
        analisis: "Análisis Electromagnético",
        instrucciones: "Arrastra el imán cerca del cable para observar la interacción."
    },
    teoria: {
        sinCorriente: "ESTADO: Circuito Abierto. Sin electrones en movimiento no hay campo magnético, por lo que el imán no afecta al cable.",
        conCorriente: "ESTADO: Corriente Activa. El flujo de electrones genera un campo magnético circular (Ley de Oersted) que interactúa con el imán.",
        fuerzaLorentz: "Fuerza detectada: La deflexión del cable es proporcional a la intensidad (I) y al campo magnético (B).",
        polaridad: "Nota: Al invertir la polaridad o el sentido de la corriente, la dirección de la fuerza se invierte (Regla de la mano derecha).",
        fuerzaFormula: "F = I · L · B (L = 0.01 m, longitud efectiva del segmento de cable)"

    },
    controles: {
        corriente: "Intensidad de Corriente (A)",
        fuerzaIman: "Fuerza del Imán (Tesla)",
        btnInvertir: "Invertir Polos N/S",
        mostrarVectores: "Visualizar Vectores de Fuerza",
        mostrarCampo: "Visualizar Campo Magnético"
    },
    bomba: {
        titulos: {
            principal: "Sistema de Bombeo y Regadera",
            analisis: "Telemetría del Sistema",
            especificaciones: "Motor DC: Límite Operativo 48V | Voltaje Crítico: >48V"
        },
        estados: {
            apagado: "SISTEMA EN ESPERA: Voltaje cero. Motor detenido.",
            optimo: "OPERACIÓN NORMAL: El campo magnético induce la rotación de forma segura.",
            sobrevoltaje: "¡ADVERTENCIA! SOBREVOLTAJE: El exceso de voltaje (>48V) está generando un calentamiento extremo por Efecto Joule (I²R).",
            quemado: "¡FALLA CATASTRÓFICA! El calor ha derretido el esmalte de las bobinas, causando un cortocircuito. Motor destruido."
        }
    }
};