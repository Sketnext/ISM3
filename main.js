const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
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
function rand(min, max) { const argc = arguments.length; if (argc === 0) { min = 0; max = 2147483647; } else if (argc === 1) { throw new Error('Warning: rand() expects exactly 2 parameters, 1 given'); } return Math.floor(Math.random() * (max - min + 1)) + min; }


function dbPush_cambioMinuto() {
  fecha = new Date;
  if (ping.muestra.length != 60) return;

  let stmt = db.prepare(
    `INSERT INTO "main"."estadisticas"("min","max","med","drops","dia","hora","mes","minuto")` +
    `VALUES (?,?,?,?,?,?,?,?);`
  )
  stmt.run(
    ping.minimo, ping.maximo, ping.media, ping.perdidas[1], fecha.getDate(), fecha.getHours(), fecha.getMonth(),
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
      
        tray.setToolTip(`Media: ${ping.media}ms, Loss: ${ping.perdidas[1]}%`);

        if (ping.perdidas[1] <= 1 && ping.media < 200) letraTray = "b";
        else if (ping.perdidas[1] <= 3 && ping.media < 250) letraTray = "r";
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

    function calcularPing(entrada){
      if (ping.muestra.length >= 60) ping.muestra.shift();

      ping.muestra.push(parseInt(entrada));

      ping.minimo = Math.min(...ping.muestra.filter((ms) =>{ if (ms < 999 && ms != 0) return true; }));
      ping.media = media(ping.muestra);
      ping.maximo = Math.max(0,...ping.muestra.filter((ms) =>{ if (ms < 999) return true; }));

      ping.perdidas = [0, 0];
      ping.muestra.forEach(ms => { if (ms == 999 || ms == 0) ping.perdidas[0] ++; });
      ping.perdidas[1] =Math.floor((ping.perdidas[0] / ping.muestra.length) * 100);
    }
    
    pingSpawn = spawn('ping', ['8.8.8.8', '-w', '1000', '-t',]);
    pingSpawn.stdout.on('data', function (data) {
      let stdout = data.toString();
      let entrada = 0;

      if (stdout.startsWith("Tiempo") || stdout.startsWith("Request")) entrada = 999;
      if ((m = /=([0-9]{0,3})ms/.exec(stdout)) !== null) {
        entrada = m[1];
      }

      calcularPing(entrada);
      mw.webContents.send('monitor_update', ping);
      actualizarIconoTray();
    });

    // setInterval(() => {
    //   calcularPing(rand(120, 320));
    //   console.log(ping);
    //   mw.webContents.send('monitor_update', ping);
    //   actualizarIconoTray();
    // }, 100);

    pingSpawn.stderr.on('data', function (data) { 
      mw.webContents.send('cmd_ping_stream', data.toString()); 
    });
});

app.on('before-quit', ()=>{
    if (pingSpawn != undefined) pingSpawn.kill();
});