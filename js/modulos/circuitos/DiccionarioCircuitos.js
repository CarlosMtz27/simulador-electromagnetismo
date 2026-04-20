export const DiccionarioCircuitos = {
    // archivamos de forma estructurada los conceptos de apoyo visual para nuestras topologias
    diagrama: {
        serie: {
            titulo: "Topología en Serie (Divisor de Voltaje)",
            analisis: "La corriente (Amperios) fluye por un solo camino, por lo que es idéntica en todo el circuito. Sin embargo, al conectar componentes en cadena, la Resistencia Equivalente se suma (Req = R1 + R2). Por la Ley de Ohm, a mayor resistencia total, menor corriente fluirá, haciendo que el voltaje se divida y los focos brillen cada vez menos.",
            alertaCarga: "Baja eficiencia: Si agregas más resistencias, el flujo de electrones se frena y la luz general disminuye drásticamente."
        },
        paralelo: {
            titulo: "Topología en Paralelo (Divisor de Corriente)",
            analisis: "El voltaje llega íntegro a todas las ramas. Cada camino nuevo ofrece a los electrones una vía extra para fluir, lo que increíblemente DISMINUYE la Resistencia Equivalente total (1/Req = 1/R1 + 1/R2). Al bajar la resistencia general, el circuito exige más corriente a la fuente.",
            alertaCarga: "Alta eficiencia pero mayor riesgo: Añadir demasiadas cargas aumentará los Amperios totales. Mantén vigilancia en el cable troncal para evitar un sobrecalentamiento."
        },
        mixto: {
            titulo: "Topología Mixta (Híbrida)",
            analisis: "Combina ambas topologías. La corriente principal fluye y produce fuertes caídas de voltaje en los bloques en Serie. Luego, al llegar a los bloques en Paralelo, la corriente se divide en múltiples caminos. La resistencia equivalente requiere calcular primero cada sub-bloque por separado.",
            alertaCarga: "Observa la distribución: Los componentes que están ubicados en la línea principal (Serie) soportan el impacto de toda la corriente antes de que esta se divida."
        }
    },
    
    // conservamos la plantilla de avisos urgentes segun operen los rangos electricos
    alertas: {
        sobrecarga: "ERROR CRÍTICO: El exceso de corriente generó calor por Efecto Joule y superó el límite térmico del cable principal. Breaker disparado.",
        peligro: "ADVERTENCIA: Consumo elevado. Aproximación al límite térmico.",
        seguro: "Estado del sistema: Operación estable y segura."
    },
    
    // evaluamos las variables dinamicas para entregarle al usuario una explicacion fisica realista
    obtenerExplicacionFalla: (modelo, index) => {
        const numFoco = index + 1; // traducimos nuestro indice de computadora a un numero simple
        const topologia = modelo.topologia;

        if (topologia === 'serie') {
            // damos contexto exacto sobre el daño lineal que ocasiona la conexion de una sola pista
            return `FÍSICA DEL FALLO (FOCO ${numFoco}): Al fundirse el filamento, el circuito se 'abre'. Como en Serie solo existe UN único camino para los electrones, cortar cualquier punto destruye el puente completo para todos los demás. \n\nRESULTADO: Toda la casa se ha quedado a oscuras instantáneamente.`;
        } 
        
        else if (topologia === 'paralelo') {
            // ensenamos al usuario como se aisla el dano si usamos los principios de una red dividida
            return `FÍSICA DEL FALLO (FOCO ${numFoco}): En Paralelo, cada foco tiene su propia 'tubería' conectada directamente a la fuente. Al romperse el Foco ${numFoco}, solo se bloquea el flujo en su propia derivación, mientras que las demás ramas siguen intactas. \n\nRESULTADO: Solo esta habitación se apaga. El resto de la casa sigue iluminada con normalidad. (Es el estándar mundial en viviendas).`;
        } 
        
        else if (topologia === 'mixto') {
            // filtramos el tipo de fallo de la topologia combinada porque el resultado final cambiara muchisimo
            const tipo = modelo.secuenciaMixta[index];
            if (tipo && tipo.startsWith('S')) {
                // alertamos si el usuario desconecto intencionalmente el pase central general
                return `FÍSICA DEL FALLO MAESTRO (FOCO ${numFoco}): ¡Cuidado! Has fundido un foco ubicado en la línea troncal principal (en SERIE). Toda la corriente del sistema dependía de pasar por aquí antes de distribuirse al resto de habitaciones. \n\nRESULTADO: Al romperse este filamento central, actúa como un interruptor maestro dañado. Toda la red colapsa y la casa pierde energía.`;
            } 
            else {
                // explicamos lo que ocurre si el dano solo existio en un bloque secundario
                return `FÍSICA DEL FALLO SECUNDARIO (FOCO ${numFoco}): Has fundido un foco que pertenece a una derivación PARALELA. Su ruptura elimina esta ruta, pero no interrumpe el camino principal del circuito. \n\nRESULTADO: Solo se apaga esta habitación específica. \n\nDATO FÍSICO: Al perder un camino disponible, la Resistencia Equivalente Total de la casa sube. Por Ley de Ohm, esto reduce la corriente general, por lo que podrías notar que los focos en la línea troncal atenúan levemente su brillo.`;
            }
        }
        return "Sistema interrumpido.";
    }
};