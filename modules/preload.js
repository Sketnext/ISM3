const { contextBridge, ipcRenderer } = require('electron');
const ipc = ipcRenderer;

contextBridge.exposeInMainWorld('p', {
  ipcRenderer,
});

contextBridge.exposeInMainWorld('e', {
  windowResize: (callback) => ipcRenderer.on('eWindowResize', callback),
  windowHasChanged: (callback) => ipcRenderer.on('ewindowHasChanged', callback),
  actualizarTray: (callback) => ipcRenderer.on('eActualizarTray', callback),
  monitorUpdate: (callback) => ipcRenderer.on('eMonitorUpdate', callback),
  monitorNetSpeedUpdate: (callback) => ipcRenderer.on('eMonitorNetSpeed', callback)
});
contextBridge.exposeInMainWorld('s', {
  cambiarTamañoMuestra: (segundos) => ipcRenderer.send('accion:cambiarTamañoMuestra', segundos),
  cambiarSizeVentana: (ancho, alto) => ipcRenderer.send('accion:cambiarSizeVentana', ancho, alto),
  minimizarVentana: () => ipcRenderer.send('accion:minimizarVentana')
})


