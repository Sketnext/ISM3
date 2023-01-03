const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const spawn = require('child_process').spawn;
const path = require('path');

var fecha = new Date;
var interval_db_push;

const db = new sqlite3.Database(__dirname + '/src/db.sqlite3');

var ipc = ipcMain;
var mw_show, 
    tray, 
    ultimo_icono_tray, 
    pingSpawn;

var ping = {
  // Muestra de ejemplo para calibrar
  muestra: [
    158, 149, 141, 128, 131, 137, 133, 164, 143,
    140, 146, 137, 132, 146, 148, 144, 154, 145,
    135, 161, 137, 142, 126, 129, 140, 149, 136,
    129, 152, 999, 148, 138, 142, 159, 146, 130,
    142, 135, 144, 152, 142, 128, 160, 147, 130,
    139, 135, 131, 139, 145, 147, 165, 999, 140,
    135, 142, 126, 147, 129],
  perdidas: 0,
  porcentajeDePerdidas: 0,
  minimo: 0,
  maximo: 0,
  media: 0,
};


const media = arr => {
  if (arr.length == 0) return 0;
  arr.sort((a, b) => a - b);
  const midpoint = Math.floor(arr.length / 2);
  const median = arr.length % 2 === 1 ?
    arr[midpoint] :
    (arr[midpoint - 1] + arr[midpoint]) / 2;
  return median;
};


function dbPush_cambioMinuto() {
  fecha = new Date;
  if (ping.muestra.length != 60) return;

  const media = arr => {
    if (arr.length == 0) return 0;
    arr.sort((a, b) => a - b);
    const midpoint = Math.floor(arr.length / 2);
    const median = arr.length % 2 === 1 ?
      arr[midpoint] :
      (arr[midpoint - 1] + arr[midpoint]) / 2;
    return median;
  };

  let est = {
    min: parseInt(Math.min.apply(null, ping.muestra.filter(Boolean))),
    max: parseInt(Math.max(...ping.muestra)),
    med: parseInt(media(ping.muestra)),
    dops: parseInt(ping.muestra.filter((ms) => ms == 0).length)
  };

  let stmt = db.prepare(
    `INSERT INTO "main"."estadisticas"("min","max","med","drops","dia","hora","mes","minuto")` +
    `VALUES (?,?,?,?,?,?,?,?);`
  )
  stmt.run(
    est.min, est.max, est.med, est.dops, fecha.getDate(), fecha.getHours(), fecha.getMonth(),
    fecha.getMinutes()
  )
}

// Registra el estado del intrernet en la DB a cada minuto
setTimeout(() => {
  dbPush_cambioMinuto();
  interval_db_push = setInterval(dbPush_cambioMinuto, 60000);
}, (60 - fecha.getSeconds()) * 1000);


app.whenReady().then(() => {
    mw = new BrowserWindow({
      width: 270, height: 150, 
      frame: false, resizable: false, maximizable: false,
      backgroundColor: '#1a1d22',
      icon: __dirname + '/src/tray/defecto.ico',
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: true,
        preload: path.join(__dirname, '/preload.js')
      }
    });

    mw.setAlwaysOnTop(true, 'floating');
    mw.loadFile(__dirname + '/src/mw.html');
    mw.on('show', () => { mw_show = true; app.focus()});
    mw.on('hide', () => { mw_show = false; });
    mw_show = true;

    
    tray = new Tray(__dirname + '/src/tray/c.png')
    tray.setToolTip('Calculando...');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Mostar / Ocultar', click: () => { mw_show ? mw.hide() : mw.show(); } },
      { label: 'Salir', role: 'quit' }
    ]));
    tray.on('click', () => { mw_show ? mw.hide() : mw.show(); });

    ipc.on('cerrar_ventana', () => { mw.hide(); });

    function actualizarIconoTray(){

      if (ping.muestra.length == 60){
        let letraTray = 'c';
        let ultimoPaqueteDrops = ping.muestra.at(-1) == 0 || ping.muestra.at(-1) == 999;
        
        ping.perdidas = 0;
        ping.media = media(ping.muestra);
        ping.muestra.forEach(ms => { if (ms == 999 || ms == 0) ping.perdidas ++; });
        ping.porcentajeDePerdidas = Math.round( (ping.muestra.length * ping.perdidas) / 100 );
        tray.setToolTip(`Media: ${ping.media}ms, Loss: ${ping.porcentajeDePerdidas}%`);

        if (ping.porcentajeDePerdidas <= 1 && ping.media < 200) letraTray = "b";
        else if (ping.porcentajeDePerdidas <= 3 && ping.media < 250) letraTray = "r";
        else letraTray = "m";

        let numero = ultimoPaqueteDrops ? '0' : '1';
        let icono = letraTray + '_' + numero + '.png';

        if (ultimo_icono_tray != icono){
          tray.setImage(__dirname + '/src/tray/' + icono);
        }
        mw.webContents.send('icono_tray', icono);
        ultimo_icono_tray = icono

      }
    }

    pingSpawn = spawn('ping', ['8.8.8.8', '-w', '1000', '-t',]);
    pingSpawn.stdout.on('data', function (data) {
      let stdout = data.toString();
      let entrada = 0;
      mw.webContents.send('ping_stdout_stream', stdout);

      if (stdout.startsWith("Tiempo") || stdout.startsWith("Request")) entrada = 999;
      if ((m = /=([0-9]{0,3})ms/.exec(stdout)) !== null) {
        entrada = m[1];
      }
      if (ping.muestra.length >= 60) ping.muestra.shift();
      ping.muestra.push(parseInt(entrada));
      actualizarIconoTray();
    });
    pingSpawn.stderr.on('data', function (data) { 
      mw.webContents.send('cmd_ping_stream', data.toString()); 
    });
});

app.on('before-quit', ()=>{
    if (pingSpawn != undefined) pingSpawn.kill();
});