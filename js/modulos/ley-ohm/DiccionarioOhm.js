export const DiccionarioOhm = {
    // preparamos los mensajes visuales de advertencia para nuestras pruebas en el laboratorio
    laboratorio: {
        quemado: {
            texto: "¡RESISTENCIA CARBONIZADA! Límite térmico superado.",
            color: "var(--accent)",
            bg: "rgba(233, 75, 122, 0.2)"
        },
        critico: {
            texto: "PELIGRO: TEMPERATURA CRÍTICA (Riesgo de ignición)",
            color: "#FFA500",
            bg: "rgba(255, 165, 0, 0.2)"
        },
        seguro: {
            texto: "SISTEMA SEGURO (Disipación térmica estable)",
            color: "#00FF00",
            bg: "rgba(0, 255, 0, 0.1)"
        }
    },
    // archivamos las explicaciones de que pasara cuando le conectemos el cargador al celular
    celular: {
        quemado: {
            texto: "¡PMIC DESTRUIDO! El voltaje genérico frió el controlador del celular.",
            color: "var(--accent)",
            bg: "rgba(233, 75, 122, 0.2)"
        },
        rapido: {
            texto: "CARGA RÁPIDA (Protocolo USB-PD Óptimo)",
            color: "#00FF00",
            bg: "rgba(0, 255, 0, 0.2)"
        },
        lento: {
            texto: "CARGA LENTA (Cargador de baja potencia para este modelo)",
            color: "#FFA500",
            bg: "rgba(255, 165, 0, 0.2)"
        }
    }
};