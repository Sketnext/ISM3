
/* Ultil funtions */
const $ = function(e){
    return document.getElementById(e);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

const mw = Vue.createApp({

data() {
    return {
        dot_color: "var(--co_txt_verde)",

        latidos: 0,
        stop: false,

        linea_limite: {
            h_max: 0,
            h_min: 0,
        },

        audio_ctx: new (window.AudioContext || window.webkitAudioContext)(),
        conf: {
            monitor: {
                audio: {
                    activado: false,
                    ondas: ['sine','square','sawtooth','triangle'],
                    onda_seleccionada: 3,
                    duracion_tono: 0.5,
                    frecuencia_fijada_colores: false,
                    /*p:perdida,e:error,r:rojo,a:amarillo,r:rojo */
                    sonar_en: {
                        perdida: true,
                        error: false,
                        rojo: true,
                        amarillo: false,
                        verde: false,
                    },
                }
            }
        },

        ui: {
            colores: {},
            iconoTray: 'c.png',
            modoObscuro: true,
            ventana_pineada: false,
            mw:{
                ancho: 0,
                alto: 0
            },

            apartado_selecionado: "Configuración",
            apartados: [
                { nombre: "Configuración", nombreOculto: true, svg: '<svg class="w10" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>' },
                { nombre: "Monitor", svg: '<svg class="h10 w10" viewBox="0 0 20 20" fill="currentColor"> <path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clip-rule="evenodd" /> </svg>' },
                { nombre: "Estadisticas", svg: '<svg class="h10 w10" viewBox="0 0 20 20" fill="currentColor"> <path fill-rule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm7.49-8.931a.75.75 0 01-.175 1.046 19.326 19.326 0 00-3.398 3.098.75.75 0 01-1.097.04L8.5 8.561l-2.22 2.22A.75.75 0 115.22 9.72l2.75-2.75a.75.75 0 011.06 0l1.664 1.663a20.786 20.786 0 013.122-2.74.75.75 0 011.046.176z" clip-rule="evenodd" /> </svg>' },
                // { nombre: "Mapa", svg: '<svg class="h10 w10" viewBox="0 0 24 24" fill="currentColor"> <path fill-rule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z" clip - rule="evenodd" /> </svg > ' },
            ],
        },

        monitor: {
            stop_update: false,
            sonidos: false,
            muestra_largo: 60,
            ip_objetivo: '8.8.8.8',

            cache: [],
            latidos: false,
            grafico: {
                tx: 0,
                rx: 0,

                ejeY: {
                    escala: [0, 400],
                    altura: 120, // PX
                    altura_maxima_registrada: 0,
                    altura_minima_registrada: 0,
                    indicadores: {
                        max: 0,
                        min: 0,
                        med: 0
                    }
                },
                ejeX: {
                    ancho: 325, // PX
                    coordenadas: [],
                },

                ms: {
                    perdidas: [0, 0],
                    muestra: [],
                    minimo: 0,
                    maximo: 0,
                    media: 0,
                }
            },





            lastUpdate: {
                paquetes: [],
                maximo_paquetes: 0,
                paquetes_perdidos: 0,
                porcentaje_paquetes_perdidos: 0,
        
                latencia: {
                  minimo: 0,
                  maximo: 0,
                  media:  0,
                }
            },

            color_latencia_dot: "var(--co_gaf_desconectado)"
        },


        historial: {
            dia_seleccionado: {},
            historial_ultimos_dias: [],
        }
    }
},
mounted: async function(){

    /* Obtener colores de las variables css */
    const styles = getComputedStyle(document.documentElement);
    this.ui.colores = {
        verde:       styles.getPropertyValue('--co_gaf_verde').trim(),
        amarillo:    styles.getPropertyValue('--co_gaf_amarillo').trim(),
        rojo:        styles.getPropertyValue('--co_gaf_rojo').trim(),
        perdida:     styles.getPropertyValue('--co_gaf_lostpackage').trim(),
        desconexión: styles.getPropertyValue('--co_gaf_desconectado').trim(),
    };
    
    this.u_actualizarDimencionesVentana(
        await p.ipcRenderer.invoke('obtenerDatos:mwSize')
    );

    /* ipcMain Events */
    e.windowResize((_e, mwSize) => { this.u_actualizarDimencionesVentana(mwSize) });
    e.actualizarTray((_e, iconName) => { this.u_actualizarTray(iconName) });
    e.monitorUpdate((_e, monitorUpdate) => { this.m_actualizarMonitor(monitorUpdate); });
    e.monitorNetSpeedUpdate((_e, netSpeedUpdate) => { this.m_netSpeedUpdate(netSpeedUpdate); });


    this.cambiarApartado('Monitor');
    // this.cambiarApartado('Estadisticas');
},
methods: {
    t: (t="Yeep") => {console.log(t)},
    cambiarApartado(nombre) {
        this.ui.apartado_selecionado = nombre;
        if (this.ui.apartado_selecionado == "Monitor") {
            this.m_actualizarMonitor(0);
            s.cambiarSizeVentana(220, 100);
        }
        if (this.ui.apartado_selecionado == "Estadisticas"){
            s.cambiarSizeVentana(600, 345);
            this.h_obtenerUltimosDias();
            this.$nextTick().then(()=>{
                OmRangeSlider.init();
            });
        }

    },

    u_actualizarTray: function(iconName){ 
        if (this.ui.iconoTray == iconName) return;
        this.ui.iconoTray = iconName;
    },
    u_actualizarDimencionesVentana: function(mwSize){
        this.ui.mw.ancho = mwSize.ancho;
        this.ui.mw.alto = mwSize.alto;
        this.m_actualizarMonitor(0);
    },
    m_actualizarMonitor: function(monitorUpdate=0){
        if (this.ui.apartado_selecionado != "Monitor") return;
        if (this.monitor.stop_update) return;

        const ESPACIO_ABAJO = 14;

        if (monitorUpdate == 0 && typeof this.monitor.cache == 'object'){
            monitorUpdate = this.monitor.cache;
        }else{
            this.monitor.cache = monitorUpdate;
        }

        let datos = {
            altura_maxima_registrada: 0,
            altura_minima_registrada: this.monitor.grafico.ejeY.escala[1],
            ejeX_coordenadas: []
        }

        monitorUpdate.paquetes.forEach(ms => {
            if (ms > this.monitor.grafico.ejeY.escala[1]) ms = this.monitor.grafico.ejeY.escala[1];
            let altura = ((this.ui.mw.alto - 30 - ESPACIO_ABAJO) * ((ms / this.monitor.grafico.ejeY.escala[1]) * 100)) / 100;
            if (datos.altura_maxima_registrada < altura) datos.altura_maxima_registrada = altura;
            if (datos.altura_minima_registrada > altura && altura > 0) datos.altura_minima_registrada = altura;
            datos.ejeX_coordenadas.push([ms, altura]);
        });

        this.m_emitirSonido(monitorUpdate.paquetes.at(-1));

        this.monitor.lastUpdate = monitorUpdate;
        this.monitor.grafico.ejeY.altura_maxima_registrada = datos.altura_maxima_registrada;
        this.monitor.grafico.ejeY.altura_minima_registrada = datos.altura_minima_registrada;
        this.monitor.grafico.ejeX.coordenadas = datos.ejeX_coordenadas;
        this.monitor.latidos = this.monitor.latidos ? false : true;
        this.monitor.grafico.ejeY.indicadores.min = datos.altura_minima_registrada;
        this.monitor.grafico.ejeY.indicadores.max = Math.round((this.ui.mw.alto - 20 - ESPACIO_ABAJO) - datos.altura_maxima_registrada);
        
        this.monitor.color_latencia_dot = this.m_colores('pt_b', monitorUpdate.paquetes.at(-1));
    },
    m_netSpeedUpdate: function(netSpeedUpdate){
        let tx =  Math.round(netSpeedUpdate.out / 8);
        let rx =  Math.round(netSpeedUpdate.in / 8) ;

        let tx_str_unit = 'KB/s';
        let rx_str_unit = 'KB/s';

        if (tx > 1000) {
            tx = tx / 1000;
            tx_str_unit = "MB/s";
        }

        if (rx > 1000) {
            rx = rx / 1000;
            rx_str_unit = "MB/s";
        }

        this.monitor.grafico.tx = `${tx} ${tx_str_unit}`;
        this.monitor.grafico.rx = `${rx} ${rx_str_unit}`;

        // console.log(netSpeedUpdate);
    },

    m_screen2clipboard: function(e){
        html2canvas(document.getElementById('screenshotRef'))
            .then(canvas => {
                canvas.toBlob(function(blob) { 
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]);
                });
            }
        );
    },

    m_cambiarTamañoMuestra: function(e){
        s.cambiarTamañoMuestra(e.target.value);
    },
    m_calcularEsacalaEjeY: function(){
        let elementos = [];
        let conf = {
            espacioEntrePuntos: 2, // PX
            espacioPuntos: 10, // PX
            espacioDisponibles: null,
        };

        conf.espacioDisponibles = Math.floor(
            (this.ui.mw.alto - 20) / 
            (conf.espacioEntrePuntos + conf.espacioPuntos)
        );

        let divisorPuntos = this.monitor.grafico.ejeY.escala[1] / conf.espacioDisponibles;
        for (let i = 0; i <= conf.espacioDisponibles; i++) {
            elementos.push(Math.floor(divisorPuntos * i));
        }

        elementos.reverse();
        return elementos;
    },
    m_colores(modo, arg=null){
        switch (modo) {
            case 'pl': /* Pakett Lost (arg=%PakettLost) */
                if (arg < 2) return "var(--co_txt_verde)";
                else if (arg < 5) return "var(--co_txt_amarillo)"; 
                else return "var(--co_txt_rojo)";
                break;
            case 'lt': /* Latencia (arg=INT media latencia) */
                if (arg == 0) return 'var(--co_gaf_drop)';
                else if (arg < 150) return 'var(--co_txt_verde)';
                else if (arg >= 150 && arg <= 300) return 'var(--co_txt_amarillo)';
                else return 'var(--co_txt_rojo)';
                break
            case 'pt': /* Punto (barra del grafico) */
                if (arg == 0 ) return 'pm_1';
                else if (arg < 150) return 'pm_v';
                else if(arg >= 150 && arg <= 300) return 'pm_a';
                else if(arg > 300) return 'pm_r';
                else return null;
                break
            case 'pt_b': /* Punto (barra del grafico) (return css var)*/
                if (arg == 0 ) return 'var(--co_gaf_lostpackage)';
                else if (arg == -2) return 'var(--co_gaf_desconectado)';
                else if (arg == -1) return 'var(--co_gaf_rojo)';
                else if (arg < 150) return 'var(--co_gaf_verde)';
                else if(arg >= 150 && arg <= 300) return 'var(--co_gaf_amarillo)';
                else if(arg > 300) return 'var(--co_gaf_rojo)';
                else return 'var(--co_gaf_desconectado)';
                break
        }
    },

    m_obtenerFecha(){
        const d = new Date();
        return d.toLocaleTimeString();
    },
    m_emitirSonido(ms){
        if(!this.conf.monitor.audio.activado) return;
        const sonar_en = this.conf.monitor.audio.sonar_en;
        const frecuencia_fijada = this.conf.monitor.audio.frecuencia_fijada_colores;
        const colorMs = this.m_colores('pt', ms);

        let f = null; /* Frecuencia */

        if (sonar_en.perdida && ms == -1) f = 400;
        if (sonar_en.error && ms == -2) f = 450;
        if (sonar_en.rojo && colorMs == 'pm_r'){
            if (frecuencia_fijada) f = 350;
            else f = ms;
        }
        if (sonar_en.amarillo && colorMs == 'pm_a'){
            if (frecuencia_fijada) f = 300;
            else f = ms;
        }
        if (sonar_en.verde && colorMs == 'pm_v'){
            if (frecuencia_fijada) f = 200;
            else f = ms;
        }
        

        if (f == null) return;
        this.$refs.btnSound.animate(
            [
              {
                outline: '1px solid transparent',
              },
              {
                outline: '1px solid hwb(60deg 0% 0% / 17%)',
                backgroundColor: 'rgb(255 235 59 / 10%)',
                easing: "ease-in"
              },
              {
                outline: '1px solid transparent',
              }
            ],
            500
          );
        var osc = this.audio_ctx.createOscillator();
            osc.type = this.conf.monitor.audio.ondas[
                this.conf.monitor.audio.onda_seleccionada
            ]; 
            osc.frequency.value=f;
            osc.connect(this.audio_ctx.destination);
            osc.start();

            osc.stop(
                this.audio_ctx.currentTime 
                + this.conf.monitor.audio.duracion_tono
            );
    },

    h_obtenerUltimosDias: async function(){
        const r = await p.ipcRenderer.invoke('obtenerDatos:ultimosDias');
        
        this.historial.historial_ultimos_dias = r.slice(1);
        this.historial.dia_seleccionado = r[0];

        this.h_renderizar_selectedCanvas_mini(this.historial.dia_seleccionado);
    },
    h_renderizar_selectedCanvas_mini(datos_dia){
        this.$nextTick().then(()=>{
            // console.log(datos_dia);
            for (let hora = 0; hora < 24; hora++) {
                const e = $(`cdmh${hora}`);
                if (e == undefined) return;

                e.width = 60;
                e.height = 30;

                let c = e.getContext("2d");

                /* Pintado de minutos */
                c.fillStyle = "#1d2026";
                for (let m = 0; m < 60; m++) {
                    if (datos_dia.horas[hora][m] == undefined) continue;
                    let perdidas = 
                        datos_dia.horas[hora][m][0] < e.height ? 
                        datos_dia.horas[hora][m][0] : 
                        e.height;

                    if (perdidas > 10) c.fillStyle = this.ui.colores.rojo;
                    else if (perdidas >= 5) c.fillStyle = this.ui.colores.amarillo;
                    else if (perdidas >= 0) c.fillStyle = this.ui.colores.verde;
                    else if (perdidas == 0) c.fillStyle = this.ui.colores.perdida;
                    else c.fillStyle = this.ui.colores.desconexión;

                    /* Ajuste */
                    if (perdidas < 1) perdidas = 1;
                    let altura = perdidas;
                        altura = altura + 0; /* <- Amplificacion */

                    c.fillRect (
                        m + 1, 
                        e.height - altura, 
                        1, 
                        altura
                    );
                }

            }
        });
    },
    h_computar_canvas(datos_dia, dia, mes, año, hora){
        this.$nextTick().then(()=>{
            const e = $(`cid${dia}_${mes}_${año}h${hora}`);
            if (e == undefined) return;

            e.width = 60;
            e.height = 30;

            let c = e.getContext("2d");

            /* Pintado de minutos */
            c.fillStyle = "#1d2026";
            for (let m = 0; m < 60; m++) {
                if (datos_dia.horas[hora][m] == undefined) continue;
                let perdidas = 
                    datos_dia.horas[hora][m][0] < e.height ? 
                    datos_dia.horas[hora][m][0] : 
                    e.height;

                if (perdidas > 10) c.fillStyle = this.ui.colores.rojo;
                else if (perdidas >= 5) c.fillStyle = this.ui.colores.amarillo;
                else if (perdidas >= 0) c.fillStyle = this.ui.colores.verde;
                else if (perdidas == 0) c.fillStyle = this.ui.colores.perdida;
                else c.fillStyle = this.ui.colores.desconexión;

                /* Ajuste */
                if (perdidas < 1) perdidas = 1;
                let altura = perdidas;
                    altura = altura + 0; /* <- Amplificacion */

                c.fillRect (
                    m + 1, 
                    e.height - altura, 
                    1, 
                    altura
                );
            }
        });

    },

    btn_cambiar_tamaño(tamaño){},
    btn_maximizar(){},
    btn_minimizar(){
        console.log("BTN press");
        s.minimizarVentana();
    },
},
computed: {
    h_computar_mini_historial(){
        return this.historial.historial_ultimos_dias;
    },
}

});
mw.mount('#mw');