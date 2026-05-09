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
            texto: "🔥 PMIC DESTRUIDO (Fuga Térmica): El voltaje excedió el límite del chip regulador perforando su dieléctrico, lo que crea un cortocircuito (R ≈ 0.01Ω). La corriente masiva evapora el electrolito de la batería de litio detonando una reacción en cadena.",
            color: "var(--accent)",
            bg: "rgba(233, 75, 122, 0.2)"
        },
        rapido: {
            texto: "⚡ CARGA RÁPIDA (USB-PD / PPS): Cargador y celular negocian un voltaje mayor para enviar gran cantidad de Watts sin elevar la corriente (Amperios) a niveles que derretirían el cable. La batería se carga veloz y fresca.",
            color: "#00FF00",
            bg: "rgba(0, 255, 0, 0.2)"
        },
        lento: {
            texto: "🐢 CARGA LENTA (USB BC 1.2): Por protección o limitación de hardware, el PMIC restringe el ingreso de energía (W). La resistencia equivalente (Req) se ajusta para tomar únicamente corrientes bajas y evitar daños.",
            color: "#FFA500",
            bg: "rgba(255, 165, 0, 0.2)"
        }
    }
};