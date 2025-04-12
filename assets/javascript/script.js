 // --- Referencias a elementos del DOM ---
 const carouselContainer = document.getElementById('carouselContainer');
 const controlsOverlay = document.getElementById('controlsOverlay');
 const mediaContainer = document.getElementById('mediaContainer');
 const carouselImage = document.getElementById('carouselImage');
 const carouselVideo = document.getElementById('carouselVideo');
 const prevButton = document.getElementById('prevButton');
 const nextButton = document.getElementById('nextButton');
 const messageDiv = document.getElementById('message');
 const imageIndicator = document.getElementById('imageIndicator');
 const playPauseButton = document.getElementById('playPauseButton');
 const playIcon = document.getElementById('playIcon');
 const pauseIcon = document.getElementById('pauseIcon');
 const fullscreenButton = document.getElementById('fullscreenButton');
 const expandIcon = document.getElementById('expandIcon');
 const minimizeIcon = document.getElementById('minimizeIcon');
 const folderInput = document.getElementById('folderInput');
 const selectFolderLabel = document.getElementById('selectFolderLabel');
 const clearCacheButton = document.getElementById('clearCacheButton');

 // --- Variables de estado y configuración ---
 let mediaFiles = [];
 let currentMediaIndex = 0;
 let intervalId = null; // Timer para autoplay de IMÁGENES
 let isPlaying = true; // Controla si el autoplay de IMÁGENES está activo
 let objectUrls = [];
 const SLIDE_INTERVAL = 5000; // Duración para imágenes: 5 segundos
 let inactivityTimer = null;
 const INACTIVITY_TIMEOUT = 3000;

 // --- Constantes para tipos de archivo ---
 const MEDIA_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|webm|ogv)$/i;
 const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv)$/i;

 // --- Configuración IndexedDB ---
 const DB_NAME = 'carruselDB';
 const DB_VERSION = 2;
 const STORE_NAME = 'archivos';
 let db = null;

 // --- IndexedDB: Funciones (sin cambios) ---
 function initDB() {
     return new Promise((resolve, reject) => {
         messageDiv.textContent = 'Abriendo base de datos local...';
         const request = indexedDB.open(DB_NAME, DB_VERSION);
         request.onupgradeneeded = (event) => { console.log('Actualizando/Creando DB...'); const tempDb = event.target.result; if (!tempDb.objectStoreNames.contains(STORE_NAME)) { console.log(`Creando store: ${STORE_NAME}`); const objectStore = tempDb.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true }); objectStore.createIndex('nombre', 'name', { unique: false }); } else { console.log(`Store '${STORE_NAME}' ya existe.`); } };
         request.onsuccess = (event) => { console.log('DB abierta.'); db = event.target.result; resolve(db); };
         request.onerror = (event) => { console.error('Error DB:', event.target.error); messageDiv.textContent = 'Error DB.'; reject(event.target.error); };
     });
 }
 function loadFilesFromDB() {
     return new Promise((resolve, reject) => {
         if (!db) { return reject("DB no inicializada"); }
         messageDiv.textContent = 'Buscando archivos guardados...';
         if (!db.objectStoreNames.contains(STORE_NAME)) { console.error(`Store '${STORE_NAME}' no existe.`); messageDiv.textContent = `Error: Store '${STORE_NAME}' no encontrado.`; return reject(`Object store ${STORE_NAME} not found`); }
         const transaction = db.transaction(STORE_NAME, 'readonly'); const store = transaction.objectStore(STORE_NAME); const request = store.getAll();
         request.onsuccess = (event) => { const files = event.target.result; if (files && files.length > 0) { console.log(`Encontrados ${files.length} archivos.`); mediaFiles = files; resolve(true); } else { console.log('No hay archivos en DB.'); resolve(false); } };
         request.onerror = (event) => { console.error('Error leyendo DB:', event.target.error); messageDiv.textContent = 'Error leyendo DB.'; reject(event.target.error); };
     });
 }
 function saveFilesToDB(files) {
      return new Promise((resolve, reject) => {
          if (!db) { return reject("DB no inicializada"); }
          messageDiv.textContent = 'Guardando archivos...';
          if (!db.objectStoreNames.contains(STORE_NAME)) { console.error(`Store '${STORE_NAME}' no existe.`); messageDiv.textContent = `Error: Store '${STORE_NAME}' no encontrado.`; return reject(`Object store ${STORE_NAME} not found`); }
          const transaction = db.transaction(STORE_NAME, 'readwrite'); const store = transaction.objectStore(STORE_NAME); const clearRequest = store.clear();
          clearRequest.onsuccess = () => { console.log('Store limpiado.'); let count = 0; if (files.length === 0) { console.log('No habia archivos nuevos.'); } else { files.forEach(file => { const addRequest = store.add(file); addRequest.onsuccess = () => { count++; }; addRequest.onerror = (event) => { console.error('Error añadiendo:', file.name, event.target.error); }; }); } };
          clearRequest.onerror = (event) => { console.error('Error limpiando store:', event.target.error); messageDiv.textContent = 'Error guardando (clear).'; reject(event.target.error); };
          transaction.oncomplete = () => { if(files.length > 0){ console.log(`Guardados ${files.length} archivos.`); messageDiv.textContent = `Guardados ${files.length} archivos.`; } else { messageDiv.textContent = 'No se añadieron nuevos.';} resolve(); };
          transaction.onerror = (event) => { console.error('Error Tx guardado:', event.target.error); messageDiv.textContent = 'Error guardando.'; reject(event.target.error); };
      });
 }
  function clearFilesFromDB() {
      return new Promise((resolve, reject) => {
          if (!db) { return reject("DB no inicializada"); }
          messageDiv.textContent = 'Limpiando archivos...';
          if (!db.objectStoreNames.contains(STORE_NAME)) { console.warn(`Store '${STORE_NAME}' no existe.`); messageDiv.textContent = 'Almacén vacío.'; mediaFiles = []; cleanupObjectUrls(); resolve(); return; }
          const transaction = db.transaction(STORE_NAME, 'readwrite'); const store = transaction.objectStore(STORE_NAME); const request = store.clear();
          request.onsuccess = () => { console.log('Archivos borrados.'); messageDiv.textContent = 'Archivos eliminados.'; mediaFiles = []; cleanupObjectUrls(); resolve(); };
          request.onerror = (event) => { console.error('Error borrando DB:', event.target.error); messageDiv.textContent = 'Error limpiando.'; reject(event.target.error); };
      });
 }

 // --- Lógica del Carrusel ---
 function cleanupObjectUrls() {
     objectUrls.forEach(url => URL.revokeObjectURL(url));
     objectUrls = [];
     console.log("Object URLs limpiadas.");
 }

 // Listener reutilizable para el evento 'ended' del video
 const handleVideoEnd = () => {
     console.log("Video terminado, mostrando siguiente.");
     carouselVideo.removeEventListener('ended', handleVideoEnd); // Quita el listener actual
     showNextMedia(); // Avanza al siguiente
 };

 /**
  * Muestra el archivo multimedia (imagen o video) en el índice especificado.
  * Implementa una transición suave esperando a que el contenido cargue.
  * Configura el autoplay adecuado (timer para imagen, listener 'ended' para video).
  * @param {number} index - El índice del archivo en el array mediaFiles.
  */
 function displayMediaItem(index) {
     stopAutoPlay(); // Detiene timer/listener anterior

     if (!mediaFiles || mediaFiles.length === 0 || index < 0 || index >= mediaFiles.length) {
         console.warn("Índice inválido o no hay archivos:", index, mediaFiles);
         carouselImage.classList.add('hidden');
         carouselVideo.classList.add('hidden');
         currentMediaIndex = -1;
         updateIndicator(); updateButtonStates(); return;
     }

     const file = mediaFiles[index];
     if (!(file instanceof File || file instanceof Blob)) { console.error("Elemento no es File/Blob:", file); return; }

     const isVideo = VIDEO_EXTENSIONS.test(file.name) || file.type.startsWith('video/');
     const objectURL = URL.createObjectURL(file);
     objectUrls.push(objectURL);

     // Identifica el elemento que se va a mostrar y el que está actualmente visible
     const elementToShow = isVideo ? carouselVideo : carouselImage;
     const currentVisibleElement = document.querySelector('.carousel-media:not(.hidden)'); // Encuentra el visible actual

     // Prepara el nuevo elemento (establece src)
     elementToShow.src = objectURL;
      if (isVideo) {
          elementToShow.load(); // Llama a load para el video
          elementToShow.alt = `Video ${index + 1}: ${file.name || 'Archivo guardado'}`;
     } else {
          elementToShow.alt = `Imagen ${index + 1}: ${file.name || 'Archivo guardado'}`;
     }

     // --- Lógica de Transición Suave ---
     const onMediaReady = () => {
         console.log(`${isVideo ? 'Video' : 'Imagen'} listo para mostrar:`, file.name);

         // 1. Oculta el elemento viejo (si existe y es diferente al nuevo)
         if (currentVisibleElement && currentVisibleElement !== elementToShow) {
              currentVisibleElement.classList.add('hidden');
              // Detiene y limpia el video si se va a ocultar
              if (currentVisibleElement === carouselVideo && carouselVideo.pause) {
                  carouselVideo.pause();
                  carouselVideo.removeAttribute('src'); // Quita src para liberar
                  carouselVideo.load(); // Resetea estado
              }
         }

         // 2. Muestra el elemento nuevo
         elementToShow.classList.remove('hidden');

         // 3. Configura el autoplay para el nuevo elemento
         if (isVideo) {
             carouselVideo.removeEventListener('ended', handleVideoEnd); // Asegura remover listener viejo
             carouselVideo.addEventListener('ended', handleVideoEnd); // Añade listener para avanzar al terminar
             carouselVideo.play().then(() => {
                 console.log("Video autoplay iniciado.");
                 isPlaying = false; // Indica que NO está activo el timer de imágenes
                 updateButtonStates();
             }).catch(e => {
                 console.log("Autoplay video bloqueado.", e);
                 isPlaying = false; // Video no pudo iniciar solo
                 updateButtonStates();
             });
         } else {
             startAutoPlay(); // Inicia el timer para la imagen (isPlaying se pone true aquí)
         }

         // Limpia los listeners de carga/error una vez usados
         elementToShow.removeEventListener('load', onMediaReady);
         elementToShow.removeEventListener('loadeddata', onMediaReady);
         elementToShow.removeEventListener('error', onMediaError);
     };

     const onMediaError = (e) => {
         console.error(`Error cargando ${isVideo ? 'video' : 'imagen'}:`, file.name, e);
         elementToShow.removeEventListener('load', onMediaReady);
         elementToShow.removeEventListener('loadeddata', onMediaReady);
         elementToShow.removeEventListener('error', onMediaError);
         messageDiv.textContent = `Error al cargar ${file.name}. Saltando al siguiente.`;
         setTimeout(showNextMedia, 1500);
     };

     // Añade el listener apropiado
     if (isVideo) {
         // Para video, 'loadeddata' es más fiable para saber que se puede empezar a mostrar/reproducir
         elementToShow.addEventListener('loadeddata', onMediaReady);
     } else {
         elementToShow.addEventListener('load', onMediaReady);
     }
     elementToShow.addEventListener('error', onMediaError);

     // Actualiza índice y botones (el indicador visual se actualiza en onMediaReady)
     currentMediaIndex = index;
     updateIndicator();
     updateButtonStates();

 }


 function showNextMedia() {
     if (mediaFiles.length === 0) return;
     const nextIndex = (currentMediaIndex + 1) % mediaFiles.length;
     displayMediaItem(nextIndex);
 }
 function showPrevMedia() {
      if (mediaFiles.length === 0) return;
     const prevIndex = (currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length;
     displayMediaItem(prevIndex);
 }
 function updateIndicator() {
      if (mediaFiles.length > 0 && currentMediaIndex >= 0) {
         imageIndicator.textContent = `${currentMediaIndex + 1} / ${mediaFiles.length}`;
         imageIndicator.classList.remove('hidden');
     } else {
         imageIndicator.classList.add('hidden');
     }
 }

 function updateButtonStates() {
     const hasMedia = mediaFiles.length > 0;
     const hasMultipleMedia = mediaFiles.length > 1;

     prevButton.disabled = !hasMultipleMedia;
     nextButton.disabled = !hasMultipleMedia;
     fullscreenButton.classList.toggle('hidden', !hasMedia);
     selectFolderLabel.classList.toggle('hidden', hasMedia);
     clearCacheButton.classList.toggle('hidden', !hasMedia);
     carouselContainer.classList.toggle('hidden', !hasMedia);

     playPauseButton.classList.toggle('hidden', !hasMedia);
     if (hasMedia) {
         const videoVisible = !carouselVideo.classList.contains('hidden');
         const videoPaused = carouselVideo.paused;

         if (videoVisible) {
             // Video: Icono refleja estado del video
             playIcon.classList.toggle('hidden', !videoPaused);
             pauseIcon.classList.toggle('hidden', videoPaused);
             playPauseButton.setAttribute('aria-label', videoPaused ? 'Reproducir Video' : 'Pausar Video');
         } else {
             // Imagen: Icono refleja estado del timer (isPlaying)
              playIcon.classList.toggle('hidden', isPlaying);
              pauseIcon.classList.toggle('hidden', !isPlaying);
              playPauseButton.setAttribute('aria-label', isPlaying ? 'Pausar Autoplay' : 'Iniciar Autoplay');
         }
          playPauseButton.disabled = !hasMultipleMedia;
     }
 }


 /** Inicia el autoplay CON TIMER (solo para imágenes) */
 function startAutoPlay() {
     stopAutoPlay();
     if (mediaFiles.length > 1) {
          console.log(`Iniciando timer de ${SLIDE_INTERVAL}ms para imagen.`);
          intervalId = setInterval(showNextMedia, SLIDE_INTERVAL);
          isPlaying = true;
          updateButtonStates();
     }
 }

 /** Detiene el autoplay (timer de imagen Y listener de video) */
 function stopAutoPlay() {
     if (intervalId) {
         clearInterval(intervalId);
         intervalId = null;
         console.log("Timer de imagen detenido.");
     }
     // Siempre intenta remover el listener del video al detener
     carouselVideo.removeEventListener('ended', handleVideoEnd);
     console.log("Listener 'ended' de video removido (si existía).");

     isPlaying = false; // Indica que el timer de imágenes no está activo
     if (mediaFiles.length > 1) {
          updateButtonStates();
     }
 }

 /** Alterna Play/Pause para video o autoplay de imagen */
 function togglePlayPause() {
     const videoVisible = !carouselVideo.classList.contains('hidden');

     if (videoVisible) {
         // --- Controlar Video ---
         if (carouselVideo.paused) {
             // Si pausado, intenta reproducir y AÑADE el listener 'ended'
             // por si el usuario lo deja correr hasta el final.
             carouselVideo.removeEventListener('ended', handleVideoEnd); // Limpia primero
             carouselVideo.addEventListener('ended', handleVideoEnd);
             carouselVideo.play().then(() => updateButtonStates()).catch(e => console.log("Error al reanudar video", e));
             console.log("Video reanudado por usuario.");
         } else {
             // Si reproduciendo, pausa y QUITA el listener 'ended'
             // porque el usuario interrumpió la secuencia automática.
             carouselVideo.pause();
             carouselVideo.removeEventListener('ended', handleVideoEnd);
             updateButtonStates();
             console.log("Video pausado por usuario.");
         }
     } else {
         // --- Controlar Autoplay de Imágenes ---
         if (isPlaying) { // Si el timer estaba activo
             stopAutoPlay(); // Detiene el timer
         } else { // Si el timer estaba inactivo
             // Avanza inmediatamente y deja que displayMediaItem inicie el timer
             showNextMedia();
         }
     }
      resetInactivityTimer();
 }

 // --- Pantalla Completa (Sin cambios) ---
 function isFullscreen() { return !!document.fullscreenElement; }
 function toggleFullscreen() { if (!isFullscreen()) { carouselContainer.requestFullscreen().catch(err => alert(`Error pantalla completa: ${err.message}`)); } else { if (document.exitFullscreen) document.exitFullscreen(); } }
 function handleFullscreenChange() { const currentlyFullscreen = isFullscreen(); expandIcon.classList.toggle('hidden', currentlyFullscreen); minimizeIcon.classList.toggle('hidden', !currentlyFullscreen); fullscreenButton.setAttribute('aria-label', currentlyFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'); if (!currentlyFullscreen) { carouselContainer.classList.remove('cursor-hidden'); } resetInactivityTimer(); }

 // --- Lógica Ocultar/Mostrar Controles y Cursor (Sin cambios) ---
 function showControls() { controlsOverlay.classList.remove('controls-hidden'); carouselContainer.classList.remove('cursor-hidden'); }
 function hideControls() { controlsOverlay.classList.add('controls-hidden'); if (isFullscreen()) { carouselContainer.classList.add('cursor-hidden'); } }
 function resetInactivityTimer() { showControls(); clearTimeout(inactivityTimer); if (mediaFiles.length > 0) { inactivityTimer = setTimeout(hideControls, INACTIVITY_TIMEOUT); } }
 function setupInactivityListeners() { carouselContainer.addEventListener('mousemove', resetInactivityTimer); carouselContainer.addEventListener('mousedown', resetInactivityTimer); document.addEventListener('keydown', resetInactivityTimer); resetInactivityTimer(); console.log("Listeners inactividad ON."); }
 function removeInactivityListeners() { carouselContainer.removeEventListener('mousemove', resetInactivityTimer); carouselContainer.removeEventListener('mousedown', resetInactivityTimer); document.removeEventListener('keydown', resetInactivityTimer); clearTimeout(inactivityTimer); showControls(); console.log("Listeners inactividad OFF."); }

 // --- Inicialización y Event Listeners Principales ---
 async function main() {
     try {
         await initDB();
         const foundInDB = await loadFilesFromDB();
         if (foundInDB) {
             messageDiv.textContent = `Mostrando ${mediaFiles.length} archivos guardados.`;
             cleanupObjectUrls();
             displayMediaItem(0);
             setupInactivityListeners();
         } else {
             messageDiv.textContent = 'Selecciona una carpeta para empezar.';
             carouselContainer.classList.add('hidden'); selectFolderLabel.classList.remove('hidden'); clearCacheButton.classList.add('hidden'); removeInactivityListeners();
         }
          updateButtonStates();
     } catch (error) {
         console.error("Error durante la inicialización:", error);
         messageDiv.textContent = "Ocurrió un error al iniciar.";
         selectFolderLabel.classList.remove('hidden'); clearCacheButton.classList.add('hidden'); carouselContainer.classList.add('hidden'); removeInactivityListeners();
     }
 }

 folderInput.addEventListener('change', async (event) => {
     stopAutoPlay(); cleanupObjectUrls(); mediaFiles = [];
     const files = event.target.files; let loadedFiles = [];
     if (files.length === 0) { messageDiv.textContent = 'No se seleccionó carpeta.'; updateButtonStates(); return; }
     for (let i = 0; i < files.length; i++) { if (MEDIA_EXTENSIONS.test(files[i].name)) { loadedFiles.push(files[i]); } }
     if (loadedFiles.length > 0) {
         try {
             await saveFilesToDB(loadedFiles); mediaFiles = loadedFiles;
             displayMediaItem(0);
             setupInactivityListeners();
         } catch (error) { messageDiv.textContent = "Error al guardar archivos."; console.error("Error guardando DB:", error); }
     } else {
         messageDiv.textContent = 'No se encontraron imágenes o videos válidos.';
         carouselImage.classList.add('hidden'); carouselVideo.classList.add('hidden'); if(carouselVideo.pause) carouselVideo.pause(); carouselVideo.src = ''; removeInactivityListeners();
     }
     updateButtonStates(); folderInput.value = '';
 });

 clearCacheButton.addEventListener('click', async () => {
     if (confirm('¿Estás seguro de que quieres borrar todos los archivos guardados?')) {
         stopAutoPlay(); cleanupObjectUrls(); removeInactivityListeners();
          try {
             await clearFilesFromDB();
             carouselImage.classList.add('hidden'); carouselVideo.classList.add('hidden'); if(carouselVideo.pause) carouselVideo.pause(); carouselVideo.src = '';
             updateButtonStates();
          } catch(error) { messageDiv.textContent = "Error al limpiar archivos."; console.error("Error limpiando DB:", error); }
     }
 });

 // --- Listeners para Navegación Manual ---
 prevButton.addEventListener('click', () => {
     stopAutoPlay(); // Detiene timer/listener actual antes de cambiar
     showPrevMedia();
     resetInactivityTimer();
 });
 nextButton.addEventListener('click', () => {
     stopAutoPlay(); // Detiene timer/listener actual antes de cambiar
     showNextMedia();
     resetInactivityTimer();
 });

 // Otros listeners
 playPauseButton.addEventListener('click', togglePlayPause);
 fullscreenButton.addEventListener('click', () => { toggleFullscreen(); });
 document.addEventListener('fullscreenchange', handleFullscreenChange);
 window.addEventListener('beforeunload', cleanupObjectUrls);
 document.addEventListener('DOMContentLoaded', main);