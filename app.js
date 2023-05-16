const { 
  app, 
  BrowserWindow, 
  ipcMain, 
  Tray, 
  Menu, 
  screen,
  clipboard
} = require('electron');

const sqlite3 = require('sqlite3').verbose();
const spawn = require('child_process').spawn;
const path = require('path');
var colors = require('colors');

const log = (str) => {console.log("["+"Info".blue+"]: "+str); };
const error = (str) => {console.log("["+"Error".red+"]: "+str); };
const warn = (str) => {console.log("["+"Warn".yellow+"]: "+str); };
const ev = (str) => {console.log("["+"Event".green+"]: "+str); };

const { info } = require('console');
const util = require('./modules/util.js');












var fecha = new Date;
var interval_db_push;
var interval = {
  velocidadRed: {
    interval_obj: null,
    interval: 1000,
    oldRx: 0,
    oldTx: 0,
  },
}
var cache = {};

let conf = {
  mw: {
    minWidth: 220,
    minHeight: 100
  },
  monitor: {
    tamañoMuestra:  60
  }
};

log("Iniciando..");

var ipc = ipcMain;
var mw_show, 
    tray, 
    ultimo_icono_tray, 
    pingSpawn;

var ping = {
  muestra: [],
  perdidas: 0,
  minimo: 0,
  maximo: 0,
  media: 0,
};


const media = arr => {
  let sumatoria = 0;
  arr = arr.filter(item => item != 0);
  arr.forEach(n => { sumatoria += parseInt(n); });
  return Math.round(sumatoria / arr.length);
};


// Registra el estado del intrernet en la DB a cada minuto
function evento_cambio_minuto(){
  util.registrar_estado(ping);
}

log(`Registrando minuto en: ${((60 - fecha.getSeconds()))}s`);
setTimeout(() => {
  evento_cambio_minuto();
  interval_db_push = setInterval(evento_cambio_minuto, 60000);
}, (60 - fecha.getSeconds()) * 1000);





/* +----------------------+ */
/* |       APP-Ready      | */
/* +----------------------+ */

app.whenReady().then(() => {
  let sw; /* Stats Window */

  /* Pre-calculado */
  const { screen } = require('electron');
  const pantallaPrimaria = screen.getPrimaryDisplay();
  let dimencionesVentana = pantallaPrimaria.workAreaSize;

  let posicion_esquina = {
    x: dimencionesVentana.width - (conf.mw.minWidth + 20),
    y: dimencionesVentana.height - (conf.mw.minHeight + 20),
  }


  sw = new BrowserWindow({
    autoHideMenuBar: true,
    icon: __dirname + '/src/tray/defecto.ico',
    webPreferences: {
      preload: __dirname + '/modules/preload.js'
    },
  });

  sw.loadFile(__dirname + '/src/html/sw.html');

  function swHasChanged() {
    sw.webContents.send('ewindowHasChanged');
  }

  sw.on('maximize', swHasChanged);
  sw.on('unmaximize', swHasChanged);
  sw.on('restore', swHasChanged);
  sw.on('resized', swHasChanged);
  sw.on('moved', swHasChanged);


  /* Ventana principal (MW-MainWindow) */
  mw = new BrowserWindow({
    x: posicion_esquina.x,
    y: posicion_esquina.y,

    type:'toolbar',
    width: conf.mw.minWidth, 
    height: conf.mw.minHeight, 
    minWidth: conf.mw.minWidth, 
    minHeight: conf.mw.minHeight,
    frame: false, 
    resizable: true, 
    maximizable: true,
    backgroundColor: '#1a1d22',
    icon: __dirname + '/src/tray/defecto.ico',
    // skipTaskbar: false,
    webPreferences: {
      devTools: true,
      preload: __dirname + '/modules/preload.js'
    },
  });

  mw.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mw.setAlwaysOnTop(true, "screen-saver");

  mw.loadFile(__dirname + '/src/html/mw.html');
  mw.on('show', () => { mw_show = true; app.focus()});
  mw.on('hide', () => { mw_show = false; });
  mw_show = true;

  mw.on('resize', function () {
    const size = mw.getSize();
    if(size[0] == cache.windowW && size[1] == cache.windowH) return;
    cache.windowW = size[0];
    cache.windowH = size[1];

    mw.webContents.send('eWindowResize', {ancho: size[0], alto: size[1]});
  });


  /* ------------------------ */
  /* -         TRAY         - */
  /* ------------------------ */

  tray = new Tray(__dirname + '/src/tray/c.png')
  tray.setToolTip('Calculando...');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mostar / Ocultar', click: () => { mw_show ? mw.hide() : mw.show(); } },
    { label: 'Salir', role: 'quit' }
  ]));
  tray.on('click', () => { mw_show ? mw.hide() : mw.show(); });

  /* ------------------------ */
  /* -      IPC Stuff       - */
  /* ------------------------ */

  ipc.on('cerrar_ventana', () => { mw.hide(); });
  ipc.on('toggle_maximizar', () => {
      if (mw.isMaximized()) mw.unmaximize();
      else mw.maximize();
  });
  ipc.on('minimizar_ventana', ()=>{ mw.minimize(); });
  ipc.on('cambiar_tamaño_ventana', (e, tamaño)=>{ 
    if(tamaño > 3 || tamaño < 0) return;
    switch (tamaño) {
      case 1: mw.setSize(0, 0); break;
      case 2: mw.setSize(435, 200); break;
      case 3: mw.setSize(1010, 648); break;
    }
    mw.center();
  });
  ipc.on('posicionar_ventana', (e, posicion)=>{
    let p = [0, 0];
    switch (posicion) {
      case 'tl': break;
      case 'tc': break;
      case 'tr': break;
      case 'cl': break;
      case 'cc': break;
      case 'cr': break;
      case 'bl': break;
      case 'bc': break;
      case 'br': break;
    }
    mw.setPosition(p[0], p[1]);
  });

  ipcMain.on('accion:cambiarSizeVentana', (e, ancho, alto)=>{
    log(`Solictud de cambio de Size de ventana, w:${ancho}, h:${alto}`);
    const wPosition = mw.getPosition();
    const wSize = mw.getSize();
    const posicionCompensada = [
      (wPosition[0] + wSize[0]) - ancho,
      (wPosition[1] + wSize[1]) - alto,
    ];

    mw.setPosition(posicionCompensada[0], posicionCompensada[1]);
    mw.setSize(ancho, alto);
    
  });
  ipcMain.on('accion:cambiarTamañoMuestra', (e, segundos = 60)=>{
    conf.monitor.tamañoMuestra = parseInt(segundos);
    enviarMonitorUpdate();
  });
  ipcMain.on('accion:minimizarVentana', () => {
    mw.hide();
  });
  ipcMain.handle('obtenerDatos:mwSize', () => {
    const size = mw.getSize();
    return {
      ancho: size[0],
      alto: size[1]
    };
  });
  ipcMain.handle('obtenerDatos:dia', async (e, dia, mes, año) => {
    return await util.obtener_estado_dia(dia, mes, año);
  });
  ipcMain.handle('obtenerDatos:ultimosDias', () => {
    return util.obtener_estado_ultimos_dias();
  })




    function actualizarIconoTray(){
      if (ping.muestra.length == 60){
        let letraTray = 'c';
        let ultimoPaqueteDrops = ping.muestra.at(-1) <= 0 || ping.muestra.at(-1) == 999;
      
        tray.setToolTip(`Media: ${ping.media}ms, Loss: ${ping.perdidas[1]}%`);

        if (ping.perdidas[1] <= 1 && ping.media < 200) letraTray = "b";
        else if (ping.perdidas[1] <= 3 && ping.media < 250) letraTray = "r";
        else letraTray = "m";

        let numero = ultimoPaqueteDrops ? '0' : '1';
        let nombreIcono = letraTray + '_' + numero + '.png';

        if (cache.nombreIconoTray != nombreIcono){
          tray.setImage(__dirname + '/src/tray/' + nombreIcono);
        }
        mw.webContents.send('eActualizarTray', nombreIcono);
        cache.nombreIconoTray = nombreIcono
      }
    }

    function calcularPing(entrada){
      if (ping.muestra.length >= 60) ping.muestra.shift();
      ping.muestra.push(parseInt(entrada));

      ping.minimo = Math.min(999, ...ping.muestra.filter((ms) =>{ if (ms > 0) return true; }));
      ping.media = media(ping.muestra);
      ping.maximo = Math.max(0,...ping.muestra.filter((ms) =>{ if (ms > 0) return true; }));

      ping.perdidas = [0, 0];
      ping.muestra.forEach(ms => { if (ms == -1 || ms == 0) ping.perdidas[0] ++; });
      ping.perdidas[1] = Math.floor((ping.perdidas[0] / ping.muestra.length) * 100);
    }











    function enviarMonitorUpdate(){
      mw.webContents.send('eMonitorUpdate', calcularLatencia(cache.paquetes, conf.monitor.tamañoMuestra));
    }
    function calcularLatencia(paquetes=[], numeroMaxPaquetes=60) {
      const paquetesRecortados = paquetes.slice(0 - numeroMaxPaquetes);
      const paquetesPositivos = paquetesRecortados.filter((ms) => { if (ms > 0) return true; })
      const paquetesPerdidos = paquetesRecortados.length - paquetesPositivos.length;
      const monitorUpdate = {
        paquetes: paquetesRecortados,
        maximo_paquetes: numeroMaxPaquetes,
        paquetes_perdidos: paquetesPerdidos,
        porcentaje_paquetes_perdidos: Math.floor(
          (paquetesPerdidos / paquetesRecortados.length) * 100
        ),

        latencia: {
          minimo: Math.min(999, ...paquetesPositivos),
          media:  media(paquetesRecortados),
          maximo: Math.max(0, ...paquetesPositivos),
        }
      };

      return monitorUpdate;
    }



    interval.velocidadRed.interval_obj = setInterval(async ()=>{
      let { rx, tx } = await util.getCurrentSpeed();

      const rxKbps = ((rx - interval.velocidadRed.oldRx) * 8 / (interval.velocidadRed.interval / 1000)) / 1000;
      const txKbps = ((tx - interval.velocidadRed.oldTx) * 8 / (interval.velocidadRed.interval / 1000)) / 1000;

      if (interval.velocidadRed.oldRx != 0){
        mw.webContents.send('eMonitorNetSpeed', {
          in: rxKbps,
          out: txKbps
        });
      }

      interval.velocidadRed.oldRx = rx;
      interval.velocidadRed.oldTx = tx;

      // console.log(`rxKbps ${rxKbps}; txKbps ${txKbps}`);

    }, interval.velocidadRed.interval);

    //     await new Promise(resolve => setTimeout(resolve, this.interval));
    //     const { rx, tx } = await this.getCurrentSpeed();
    //     const rxMbps = ((rx - this.oldRx) * 8 / (this.interval / 1000)) / 1000 / 1000;
    //     const txMbps = ((tx - this.oldTx) * 8 / (this.interval / 1000)) / 1000 / 1000;
    //     const rxKbps = ((rx - this.oldRx) * 8 / (this.interval / 1000)) / 1000;
    //     const txKbps = ((tx - this.oldTx) * 8 / (this.interval / 1000)) / 1000;
    //     const rxbps = ((rx - this.oldRx) * 8 / (this.interval / 1000));
    //     const txbps = ((tx - this.oldTx) * 8 / (this.interval / 1000));
    //     const object = { uplink: { bps: `${rxbps.toFixed(2)}`, kbps: `${rxKbps.toFixed(2)}`, mbps: `${rxMbps.toFixed(2)}` }, downlink: { bps: `${txbps.toFixed(2)}`, kbps: `${txKbps.toFixed(2)}`, mbps: `${txMbps.toFixed(2)}` } }
    //     this.callback(object);
    //     this.oldRx = rx;
    //     this.oldTx = tx;
    //     if (typeof this.callback === 'function') {
    //         this.callback(object);
    //     }
    //   }











    
    // Crear un proceso para registrar la latencia
    pingSpawn = spawn('ping', ['8.8.8.8', '-w', '1000', '-t',]);
    pingSpawn.stdout.on('data', function (data) {
      let stdout = data.toString();
      let entrada = -2;

      if (stdout.startsWith("Tiempo") || stdout.startsWith("Request")) entrada = -1;
      if ((m = /=([0-9]{0,3})ms/.exec(stdout)) !== null) {
        entrada = m[1];
      }

      /* Guardar los ultimos 300 paquetes (5 minutos) */
      if (typeof cache.paquetes != 'object') cache.paquetes = [];
      if (cache.paquetes.length >= 300) cache.paquetes.shift();
      cache.paquetes.push( parseInt(entrada) );

      calcularPing(entrada);
      
      enviarMonitorUpdate();
      actualizarIconoTray();
    });

    pingSpawn.stderr.on('data', function (data) { 
      mw.webContents.send('cmd_ping_stream', data.toString()); 
    });




    // Registrar el nacho de banda usado...
});

app.on('before-quit', ()=>{
    if (pingSpawn != undefined) pingSpawn.kill();
});