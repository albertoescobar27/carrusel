# Carrusel Interactivo de Imágenes y Videos 🎞️🖼️

Un carrusel web moderno y personalizable diseñado para mostrar fácilmente imágenes y videos desde una carpeta local seleccionada por el usuario. Ideal para presentaciones, salas de espera, catálogos de productos o simplemente para visualizar tu contenido multimedia de forma dinámica.

## ✨ Características Principales

* **Carga Local:** Permite al usuario seleccionar una carpeta completa de su computadora.
* **Soporte Multimedia:** Muestra tanto **imágenes** (JPG, PNG, GIF, WEBP, SVG, BMP) como **videos** (MP4, WEBM, OGV).
* **Persistencia Inteligente:** Utiliza **IndexedDB** (base de datos del navegador) para guardar los archivos seleccionados. ¡No necesitas volver a cargar la carpeta cada vez que abres la aplicación en el mismo navegador!
* **Autoplay Configurable:**
    * Las imágenes se muestran durante un intervalo definido (actualmente 5 segundos).
    * Los videos se reproducen automáticamente (en silencio) y el carrusel avanza **solo cuando el video termina**.
* **Controles Completos:**
    * Navegación manual (Anterior/Siguiente).
    * Botón Play/Pausa (controla el timer de imágenes o la reproducción del video).
    * Modo Pantalla Completa inmersivo.
    * Botón para limpiar los archivos guardados y seleccionar una nueva carpeta.
* **Interfaz Limpia:** Los controles y el cursor del mouse se ocultan automáticamente tras unos segundos de inactividad (especialmente útil en pantalla completa).
* **Transición Suave:** Efecto de deslizamiento horizontal al cambiar entre elementos.
* **Tecnología Moderna:** Construido con HTML5, CSS3 (Tailwind CSS vía CDN para estilos rápidos) y JavaScript moderno.

## 🚀 Cómo Usar

Puedes usar esta aplicación de dos maneras:

**1. Versión Desplegada (Recomendado para probar):**

   * Simplemente visita el enlace donde la hayas desplegado (por ejemplo, en GitHub Pages):
       [Pega aquí tu enlace de GitHub Pages si lo tienes]
   * Haz clic en "Seleccionar Carpeta" y elige la carpeta con tus imágenes y videos.

**2. Localmente:**

   * **Descarga el código:** Clona este repositorio o descárgalo como ZIP.
        ```bash
        git clone [https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives)
        ```
   * **Abre el archivo:** Navega a la carpeta donde descargaste los archivos y abre el archivo `index.html` directamente en tu navegador web preferido (Chrome, Firefox, Edge, etc.).
   * **Selecciona la carpeta:** Haz clic en el botón "Seleccionar Carpeta" y elige la que contiene tus archivos multimedia.

   *Nota:* Aunque la aplicación usa IndexedDB que generalmente funciona bien con `file:///`, para una experiencia más consistente (especialmente si se añaden funcionalidades futuras), podrías considerar usar un servidor local simple (como la extensión "Live Server" en VS Code o `python -m http.server` en la terminal).*

## 🛠️ Detalles Técnicos

* **Frontend:** HTML, CSS, JavaScript puro (Vanilla JS).
* **Estilos:** Tailwind CSS (cargado desde CDN).
* **Almacenamiento:** IndexedDB API del navegador para persistencia del lado del cliente.
* **APIs Usadas:** File System Access API (implícita en `input[type=file][directory]`), Fullscreen API, Media Events (load, loadeddata, ended).

## 🔮 Posibles Mejoras Futuras

* Añadir opción para configurar la duración de las imágenes desde la interfaz.
* Implementar diferentes tipos de transiciones (fade, zoom, etc.).
* Mostrar miniaturas de previsualización.
* Añadir soporte para arrastrar y soltar carpetas.
* Mejorar manejo de errores para archivos corruptos.

---

¡Espero que esta aplicación te sea útil!
