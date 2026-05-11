# ElectroLabJS: Simulador Interactivo de Electricidad y Magnetismo

![Estado del Proyecto](https://img.shields.io/badge/Estado-Completado-success)
![Tecnologías](https://img.shields.io/badge/Tecnologías-HTML5%20|%20CSS3%20|%20Vanilla%20JS-blue)
![Arquitectura](https://img.shields.io/badge/Arquitectura-MVC%20|%20SOLID-orange)

**ElectroLabJS** es una aplicación web interactiva creada para la demostración de temas aprendidos en la materia de electricidad y magnetismo. El simulador incluye tres módulos principales: la Ley de Ohm con revisión del riesgo por calentamiento, los circuitos eléctricos en serie, paralelo y mixto con fallas reales, y el electromagnetismo basado en la fuerza de Lorentz aplicado a un motor de corriente directa.

La aplicación fue construida con tecnologías web básicas como HTML5, CSS3, JavaScript y Canvas API, sin usar librerías externas. Además, se organizó con el modelo MVC y siguiendo principios SOLID. Los temas incluidos están relacionados con las prácticas, ejemplos y ejercicios realizados durante el semestre, como la electrización por frotamiento, la comprobación de la Ley de Coulomb y la construcción de capacitores caseros. Los resultados muestran que usar animaciones y representaciones visuales ayuda a entender mejor conceptos que normalmente son difíciles, como la resistencia equivalente, el reparto de corriente y la inducción electromagnética.

## Módulos de Simulación

El simulador está dividido en tres módulos principales, cada uno diseñado para explicar escenarios físicos específicos y casos de uso del mundo real:

### 1. Ley de Ohm y Efecto Joule
* **Simulación interactiva:** Visualiza el flujo de electrones a velocidades proporcionales a $I = V/R$.
* **Análisis de riesgo térmico:** Calcula en tiempo real los valores críticos de operación ($V_{crítico}$ y $R_{crítica}$) basados en la potencia máxima ($P = V^2/R$).
* **Casos de uso:** Demostración de carga segura de smartphones y los peligros del sobrevoltaje (destrucción del PMIC).

### 2. Topologías de Circuitos Eléctricos
* **Cálculo dinámico:** Motor matemático para obtener la Resistencia Equivalente ($R_{eq}$) en topologías en **Serie, Paralelo y Mixtas**.
* **Simulación de fallas ("Mundo Real"):** Alterna entre un diagrama técnico y una vista realista de una casa. Observa la diferencia crítica entre fundir un foco en serie (toda la red colapsa) vs. en paralelo (falla aislada).
* **Algoritmo inteligente:** Tratamiento matemático de componentes dañados asignando $R \to \infty$ para propagar la interrupción del flujo eléctrico.

### 3. Electromagnetismo y Fuerza de Lorentz
* **Laboratorio de Lorentz:** Interactúa arrastrando un imán cerca de un cable con corriente para visualizar la Fuerza de Lorentz ($F = I L B \sin\theta$).
* **Física de Simulación (Verlet):** El cable flexible está modelado usando integración de Verlet para un movimiento físico natural y conservación de energía.
* **Motor DC y Bombas de Agua:** Simulación de un motor de corriente continua. Muestra la rotación normal y las fallas catastróficas por sobrecalentamiento debido a excesos de voltaje.

## Tecnologías Utilizadas

El proyecto fue construido desde cero enfocándose en rendimiento, accesibilidad matemática y transparencia del código:

* **HTML5 y CSS3:** Estructura semántica, diseño responsivo y tema oscuro diseñado para reducir la fatiga visual.
* **JavaScript Vanilla (ES6+):** Toda la lógica de negocio, cálculos matemáticos espaciales y renderizado está escrita sin frameworks. Esto garantiza que las fórmulas físicas se implementen de manera transparente (ej. `I = V / R`).
* **HTML5 Canvas API:** Motor gráfico nativo utilizado para redibujar animaciones de partículas (electrones), campos vectoriales y componentes físicos a 60 FPS sin sobrecarga de estado reactivo.
* **Cero Dependencias Externa:** No requiere Node.js, NPM, React, Vue, ni librerías gráficas de terceros.

## Arquitectura de Software

El proyecto aplica estrictamente patrones de diseño profesionales para garantizar mantenibilidad y escalabilidad:

* **Patrón MVC (Modelo-Vista-Controlador):**
  * **Modelo:** Clases exclusivas para estado y física (`ModeloOhm`, `ModeloCircuitos`). No conocen el DOM.
  * **Vista:** Clases que gestionan el HTML dinámico y el Canvas API (`VistaOhm`, `VistaCircuitos`).
  * **Controlador:** Enlazan eventos, bucles de animación (`requestAnimationFrame`) y el ciclo de vida del módulo.
* **Principios SOLID:** Responsabilidad única por archivo (ej. renderizadores separados del estado).
* **Gestión de Memoria:** El bucle de animación vive en el Controlador y se cancela explícitamente al cambiar de módulo para evitar fugas de memoria (*Memory Leaks*).

## Cómo ejecutar el proyecto localmente

Debido al uso intensivo de **Módulos ES6** (`import`/`export`), los navegadores modernos bloquean la ejecución directa de archivos locales (protocolo `file://`) por políticas estrictas de seguridad (CORS).

Para visualizar el simulador, debes servir los archivos mediante un servidor HTTP local:

**Opción recomendada (Visual Studio Code):**
1. Clona o descarga este repositorio en tu computadora.
2. Abre la carpeta del proyecto en Visual Studio Code.
3. Instala la extensión **"Live Server"** desde el panel de extensiones.
4. Haz clic derecho sobre el archivo `index.html` y selecciona **"Open with Live Server"**.

## Guía: Cómo añadir un nuevo módulo de simulación

Gracias a la arquitectura MVC modularizada, agregar un nuevo simulador (por ejemplo, "Termodinámica" o "Capacitores") es un proceso estandarizado:

### 1. Crear la estructura de carpetas
Crea una nueva carpeta dentro de `js/modulos/`, por ejemplo: `js/modulos/capacitores/`.

### 2. Implementar el patrón MVC
Deberás crear tres archivos clave:
* **`ModeloCapacitores.js`**: Define el estado y la lógica matemática/física. Expone un método para disparar notificaciones (`this.alActualizar()`).
* **`VistaCapacitores.js`**: Inyecta el HTML (`this.contenedor.innerHTML`), obtiene referencias del DOM y configura el Canvas. Expone métodos como `actualizarUI(modelo)` y `dibujar(modelo)`.
* **`ControladorCapacitores.js`**: Instancia el Modelo y la Vista. Agrega los *Event Listeners*, suscribe la vista a los cambios del modelo y gestiona el bucle de animación (`requestAnimationFrame`). Incluye un método `destruir()`.

### 3. Organizar Renderizadores (Recomendado)
Para lógicas de dibujo complejas, crea una subcarpeta `renderizadores/` y divide el dibujo del Canvas en clases estáticas.

### 4. Registrar el módulo en el enrutador
Abre el archivo principal (usualmente `app.js` o `Router.js` en `js/nucleo/`):
* Importa el nuevo controlador.
* Agrega la condición para instanciar tu controlador cuando se seleccione la ruta.

### 5. Actualizar la navegación HTML
Añade un nuevo botón o enlace en la barra de navegación de `index.html` apuntando a la nueva ruta.

## Interfaz de Usuario (UI/UX)

El simulador emplea un sistema de diseño estructurado para guiar el aprendizaje intuitivamente:
* **Fondo Base:** Negro profundo (`#0B0C10`) - Mejora el contraste de partículas brillantes.
* **Acento Principal:** Rosa/Rojo (`#E94B7A`) - Para controles y llamadas a la acción.
* **Alertas Físicas Estandarizadas:**
  * **Verde:** Operación estable y segura.
  * **Naranja:** Riesgos térmicos o componentes cerca de sus límites (advertencia).
  * **Rojo/Efectos Brillantes:** Fallo catastrófico, sobrecarga o quemado.

---
*Proyecto final de curso - Electricidad y magnetismo.*