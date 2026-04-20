# Simulador de Electricidad y Magnetismo

Una aplicación web interactiva y educativa diseñada para explicar visualmente conceptos fundamentales de física: la Ley de Ohm, las topologías de circuitos (serie y paralelo) y el funcionamiento básico de un motor eléctrico (magnetismo).

## Arquitectura

El proyecto está construido utilizando **HTML5, CSS3 y JavaScript puro (Vanilla JS)**, sin el uso de frameworks o librerías externas. 

Se aplican los principios de diseño de software **SOLID** y **GRASP**, estructurando el código bajo un patrón **MVC (Modelo-Vista-Controlador)**. Todo está dividido en módulos independientes (ES6 Modules) para asegurar que el código sea escalable, mantenible y fácil de entender.

### Estructura de Módulos:
* **Núcleo (`js/nucleo/`):** Contiene el enrutador principal (`app.js`) y un gestor de eventos (`GestorEventos.js`) para la comunicación entre componentes.
* **Módulo Ley de Ohm (`js/modulos/ley-ohm/`):** Simulación matemática de I = V/R con animación visual del flujo de corriente.
* **Módulo Circuitos (`js/modulos/circuitos/`):** Simulación de caída de voltaje y distribución de corriente en topologías serie y paralelo.
* **Módulo Magnetismo (`js/modulos/magnetismo/`):** Simulación del torque y la velocidad de un rotor basado en la fuerza electromotriz.

## Interfaz de Usuario

El diseño es moderno, utilizando un tema oscuro con colores de acento específicos para guiar la atención del usuario:
* **Fondo Base:** Negro profundo (`#0B0C10`)
* **Paneles de Control:** Gris Oscuro (`#14151C`)
* **Color de Acento Principal:** Rosa/Rojo (`#E94B7A`)

## Cómo ejecutar el proyecto localmente

Dado que el proyecto utiliza Módulos ES6 (`<script type="module">` en el HTML), el navegador bloqueará la ejecución si abres el archivo `index.html` directamente con doble clic (debido a las políticas de seguridad CORS).

Para verlo funcionar correctamente, **debes servirlo a través de un servidor local**. Se recomienda instalar y usar la extensión **Live Server** en Visual Studio Code.