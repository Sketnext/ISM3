const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const spawn = require('child_process').spawn;
const path = require('path');

var fecha = new Date;
var interval_db_push;

const db = new sqlite3.Database(__dirname + '/src/db.sqlite3');
const conf = {
  mw: {
    minWidth: 240,
    minHeight: 100
  }
};

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

 function obtenerDatosFecha(dia, mes, año) {
  console.log(`fn obtenerDatosFecha {${dia}-${mes}-${año}}`);
  if (
    dia > 31 || dia < 0 || 
    mes > 12 || mes < 0 || 
    año > 3000 || año < 2000
    ) return;

  

  db.all(`SELECT * FROM \`estadisticas\` WHERE \`estadisticas\`.dia = ${dia}`, (err, rows) => {
    let out_data = [];

    for (let i = 0; i < 24; i++) { out_data.push([]); }
    for (let w = 0; w < out_data.length; w++) { 
      out_data[w] = [
        [[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],
        [[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],
        [[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],
        [[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],
        [[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]],[[-1,0]]
      ];
    }

    rows.forEach((row, index) => {
      // console.log(`p ${row.hora}-${row.minuto}:${row.drops}-${row.med}.`);
      out_data[row.hora][row.minuto] = [row.drops, row.med];
    });

    mw.webContents.send('estadisticas_update', {
      fecha: new Date(`${año}-${mes}-${dia}`),
      puntos: out_data
    });
  });

}

// Registra el estado del intrernet en la DB a cada minuto
setTimeout(() => {
  dbPush_cambioMinuto();
  interval_db_push = setInterval(dbPush_cambioMinuto, 60000);
}, (60 - fecha.getSeconds()) * 1000);


app.whenReady().then(() => {
    mw = new BrowserWindow({
      width: 250, height: 140, 
      minWidth: conf.mw.minWidth, minHeight: conf.mw.minHeight,
      frame: false, resizable: true, maximizable: true,
      backgroundColor: '#1a1d22',
      icon: __dirname + '/src/tray/defecto.ico',
      skipTaskbar: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: true,
        preload: '/preload.js'
      }
    });

    mw.setSize(400, 200);
    mw.setAlwaysOnTop(true, 'floating');
    mw.loadFile(__dirname + '/src/mw.html');
    mw.on('show', () => { mw_show = true; app.focus()});
    mw.on('hide', () => { mw_show = false; });
    mw_show = true;

    mw.on('resize', function () {
      const size = mw.getSize();
      mw.webContents.send('window_resize', {
        ancho: size[0],
        alto: size[1]
      });
    });
    
    tray = new Tray(__dirname + '/src/tray/c.png')
    tray.setToolTip('Calculando...');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Mostar / Ocultar', click: () => { mw_show ? mw.hide() : mw.show(); } },
      { label: 'Salir', role: 'quit' }
    ]));
    tray.on('click', () => { mw_show ? mw.hide() : mw.show(); });

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
    ipc.on('mw_size?', () => { 
      const size = mw.getSize();
      mw.webContents.send('window_resize', {
        ancho: size[0],
        alto: size[1]
      });
    });

    ipc.on('obtener_estadisticas', (e, dia, mes, año) => { 
      console.log(`IPC - obtener_estadisticas`);
      obtenerDatosFecha(dia, mes, año);
    });

    function actualizarIconoTray(){

      if (ping.muestra.length == 60){
        let letraTray = 'c';
        let ultimoPaqueteDrops = ping.muestra.at(-1) <= 0 || ping.muestra.at(-1) == 999;
      
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

      ping.minimo = Math.min(999, ...ping.muestra.filter((ms) =>{ if (ms > 0) return true; }));
      ping.media = media(ping.muestra);
      ping.maximo = Math.max(0,...ping.muestra.filter((ms) =>{ if (ms > 0) return true; }));

      ping.perdidas = [0, 0];
      ping.muestra.forEach(ms => { if (ms == -1 || ms == 0) ping.perdidas[0] ++; });
      ping.perdidas[1] =Math.floor((ping.perdidas[0] / ping.muestra.length) * 100);
    }
    
    pingSpawn = spawn('ping', ['8.8.8.8', '-w', '1000', '-t',]);
    pingSpawn.stdout.on('data', function (data) {
      let stdout = data.toString();
      let entrada = -2;

      if (stdout.startsWith("Tiempo") || stdout.startsWith("Request")) entrada = -1;
      if ((m = /=([0-9]{0,3})ms/.exec(stdout)) !== null) {
        entrada = m[1];
      }

      calcularPing(entrada);
      mw.webContents.send('monitor_update', ping);
      actualizarIconoTray();
    });

    // setInterval(() => {
    //   calcularPing(rand(-2, 240));
    //   console.log(ping);
    //   mw.webContents.send('monitor_update', ping);
    //   actualizarIconoTray();
    // }, 50);

    pingSpawn.stderr.on('data', function (data) { 
      mw.webContents.send('cmd_ping_stream', data.toString()); 
    });
});

app.on('before-quit', ()=>{
    if (pingSpawn != undefined) pingSpawn.kill();
});