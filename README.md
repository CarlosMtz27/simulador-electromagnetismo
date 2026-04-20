# ElectroLab-JS: Simulador de Electromagnetismo y Circuitos

Una aplicacion web interactiva y educativa disenada para explicar visualmente conceptos fundamentales de la fisica electrica. El proyecto permite simular en tiempo real la Ley de Ohm, el comportamiento de las topologias de circuitos (serie, paralelo y mixto) frente a fallas o sobrecargas, y el funcionamiento basico de motores electricos basado en la Fuerza de Lorentz.

## Tecnologias Utilizadas

El simulador destaca por su enfoque ligero y de alto rendimiento, construido completamente desde cero:
* **HTML5 y CSS3:** Estructura semantica y diseno responsivo con variables CSS.
* **JavaScript Vanilla (ES6+):** Logica de negocio, matematicas y fisica sin frameworks.
* **HTML5 Canvas API:** Motor grafico nativo para la renderizacion y animacion fluida de electrones, componentes y particulas a 60 FPS.
* **Cero Dependencias:** No requiere Node.js, NPM, React, Vue, ni librerias de terceros.

## Arquitectura

El proyecto aplica estrictamente los principios de diseno de software **SOLID** y **GRASP**, y esta estructurado bajo el patron de diseno **MVC (Modelo-Vista-Controlador)**. Se hace un uso intensivo de Modulos ES6 para garantizar que el codigo sea escalable y mantenible.

### Estructura de Módulos:
* **Nucleo (`js/nucleo/`):** Contiene el enrutador principal y la maquina de estados de la aplicacion, gestionando que modulo se renderiza en pantalla y limpiando recursos en memoria (como requestAnimationFrame) al cambiar de vista.
* **Compartido (`js/shared/`):** Componentes visuales y utilidades que se reutilizan en toda la aplicacion (renderizado de baterias, interfaces HUD, animacion de particulas).
* **Modulos de Simulacion (`js/modulos/`):**
  * **Ley de Ohm:** Simulacion matematica de I = V/R con prediccion de riesgos termicos y prueba realista en carga de smartphones.
  * **Circuitos:** Motor de calculo de Resistencia Equivalente (Req) para redes Serie, Paralelo y Mixtas, incluyendo un algoritmo interactivo de tolerancia a fallos ("Mundo Real").
  * **Magnetismo:** Laboratorio virtual para comprender la deflexion de campos magneticos y el funcionamiento practico de una bomba de agua (Motor DC).

## Como ejecutar el proyecto localmente

Debido a que el proyecto utiliza Modulos ES6 (`import`/`export`), los navegadores modernos bloquean su ejecucion si abres el archivo `index.html` directamente (file://) por politicas estrictas de seguridad (CORS).

Para visualizar el simulador, debes servir los archivos mediante un servidor HTTP local:

**Usando Visual Studio Code (Recomendado):**
1. Clona o descarga el repositorio en tu computadora.
2. Abre la carpeta del proyecto en Visual Studio Code.
3. Instala la extension "Live Server" desde el panel de extensiones.
4. Haz clic derecho sobre el archivo `index.html` y selecciona "Open with Live Server".


## Guia: Como anadir un nuevo modulo de simulacion

Gracias a la arquitectura MVC modularizada, agregar un nuevo simulador (por ejemplo, "Termodinamica") es un proceso estandarizado. Sigue estos pasos:

### 1. Crear la estructura de carpetas
Crea una nueva carpeta dentro de `js/modulos/`, por ejemplo: `js/modulos/termodinamica/`.

### 2. Implementar el patron MVC
Dentro de la nueva carpeta, deberas crear al menos tres archivos clave:

* **`ModeloTermo.js`**: Define la clase que contendra exclusivamente la logica fisica, matematica y el estado del simulador (variables). No debe saber nada sobre la interfaz (DOM o Canvas). Debe exponer un metodo para disparar actualizaciones (`this.alActualizar()`).
* **`VistaTermo.js`**: Define la clase que se encarga de inyectar el HTML correspondiente (`this.contenedor.innerHTML`), obtener referencias a los elementos del DOM y configurar el Canvas. Expondra metodos como `actualizarUI(modelo)` y `dibujar(modelo)`.
* **`ControladorTermo.js`**: Actua como el puente. Instancia el Modelo y la Vista. Agrega los `addEventListener` a los inputs de la vista para modificar el modelo, suscribe la vista a los cambios del modelo e inicia el bucle infinito de animacion (`requestAnimationFrame`). Debe incluir un metodo `destruir()` para cancelar la animacion.

### 3. Organizar Renderizadores (Recomendado)
Si el dibujo en Canvas es complejo, crea una subcarpeta `renderizadores/` y divide la logica de dibujo en clases estaticas (ej. `RenderizadorParticulas.js`).

### 4. Registrar el modulo en el nucleo
Abre tu archivo principal de aplicacion (donde se gestiona el ruteo, usualmente `app.js` o `Router.js`).
* Importa el nuevo controlador: `import { ControladorTermo } from '../modulos/termodinamica/ControladorTermo.js';`
* Agrega la ruta o condicion en el gestor de vistas para instanciar tu controlador cuando el usuario seleccione este modulo.

### 5. Actualizar la navegacion HTML
Abre `index.html` y anade un boton de navegacion en la barra lateral (Sidebar) con el identificador que configuraste en tu enrutador.

## Principios de Diseno Aplicados

* **Single Responsibility Principle (SRP):** Cada clase tiene una unica responsabilidad. Por ejemplo, `ModeloOhm.js` solo calcula, mientras que `Celular.js` solo se encarga de dibujar el telefono en el Canvas.
* **Separation of Concerns:** El HTML estructural general esta separado, pero las interfaces especificas de cada simulador se inyectan dinamicamente mediante su respectiva clase Vista, evitando un documento HTML monstruoso.
* **Inversion de Control:** Los controladores manejan el ciclo de vida de las animaciones para poder montarlas y desmontarlas eficientemente sin causar fugas de memoria (Memory Leaks).

## Interfaz de Usuario (UI/UX)

El diseno utiliza un tema oscuro enfocado en minimizar la fatiga visual de los estudiantes, utilizando colores de acento especificos para guiar la atencion:
* Fondo Base: Negro profundo (`#0B0C10`)
* Paneles y Cajas HUD: Gris Oscuro (`#14151C`)
* Color de Acento Principal: Rosa/Rojo (`#E94B7A`) para elementos interactivos principales.
* Alertas Visuales: Uso estandarizado del Rojo para fallos catastroficos (quemado), Naranja para riesgos termicos y Verde para operacion optima.

---