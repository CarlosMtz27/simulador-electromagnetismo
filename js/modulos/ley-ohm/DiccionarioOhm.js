/**
 * DiccionarioOhm
 * Almacenamos los mensajes de retroalimentacion y explicaciones tecnicas
 * que mostraremos al usuario dependiendo del estado del circuito.
 */
export const DiccionarioOhm = {
    // Preparamos los mensajes visuales de advertencia para nuestras pruebas en el laboratorio
    laboratorio: {
        quemado: {
            texto: "¡RESISTENCIA CARBONIZADA! Limite termico superado.",
            color: "var(--accent)",
            bg: "rgba(233, 75, 122, 0.2)"
        },
        critico: {
            texto: "PELIGRO: TEMPERATURA CRITICA (Riesgo de ignicion)",
            color: "#FFA500",
            bg: "rgba(255, 165, 0, 0.2)"
        },
        seguro: {
            texto: "SISTEMA SEGURO (Disipacion termica estable)",
            color: "#00FF00",
            bg: "rgba(0, 255, 0, 0.1)"
        }
    },
    // Archivamos las explicaciones de que pasara cuando le conectemos el cargador al celular
    celular: {
        quemado: {
            texto: "PMIC DESTRUIDO (Fuga Termica): El voltaje excedio el limite del chip regulador perforando su dielectrico, lo que crea un cortocircuito (R = 0.01 Ohmios). La corriente masiva evapora el electrolito de la bateria de litio detonando una reaccion en cadena.",
            color: "var(--accent)",
            bg: "rgba(233, 75, 122, 0.2)"
        },
        rapido: {
            texto: "CARGA RAPIDA (USB-PD / PPS): Cargador y celular negocian un voltaje mayor para enviar gran cantidad de Watts sin elevar la corriente (Amperios) a niveles que derretirian el cable. La bateria se carga veloz y fresca.",
            color: "#00FF00",
            bg: "rgba(0, 255, 0, 0.2)"
        },
        lento: {
            texto: "CARGA LENTA (USB BC 1.2): Por proteccion o limitacion de hardware, el PMIC restringe el ingreso de energia (W). La resistencia equivalente (Req) se ajusta para tomar unicamente corrientes bajas y evitar danos.",
            color: "#FFA500",
            bg: "rgba(255, 165, 0, 0.2)"
        }
    }
};