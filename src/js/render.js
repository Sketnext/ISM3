const { ipcRenderer } = require("electron")
const ipc = ipcRenderer;

const $ = function( id ) { return document.getElementById( id ); };
const median = arr => { 
  const mid = Math.floor(arr.length / 2), nums = [...arr].sort((a, b) => a - b);
  const salida = arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  return salida;
};

const media = arr => { 
  let sumatoria = 0;
  arr = arr.filter(item => item != 0);
  arr.forEach(n => {sumatoria += parseInt(n);});
  return Math.round(sumatoria / arr.length);
};
var cmd_ping_stream;

window.addEventListener('DOMContentLoaded', () => {
  $('cerrar-btn').addEventListener('click', () => {
    ipc.send('cerrar_ventana');
  });
  // $('minimizar-btn').addEventListener('click', () => {
  //   ipc.send('minimizar_ventana');
  // });
});

ipcRenderer.on('window_resize', (event, size) => {
  app._instance.data.ui.mw.ancho = size.ancho;
  app._instance.data.ui.mw.alto = size.alto;
  app._instance.ctx.actualizar_monitor(app._instance.data.monitor.cache);
});

ipcRenderer.on('monitor_update', (event, arg) => {
  app._instance.ctx.actualizar_monitor(arg);
});

ipcRenderer.on('estadisticas_update', (event, arg) => {
  app._instance.ctx.actualizar_estadisticas(arg);
});

ipcRenderer.on('icono_tray', (event, arg) => {
  app._instance.ctx.cambiarIcono(arg);
})

const app = Vue.createApp({
  data() {
    return {
      monitor: {
        stop_update: false,
        sonidos: false,
        muestra_largo: 60,
        ip_objetivo: '8.8.8.8',

        cache: [],
        latidos: false,
        grafico: {
          ejeY: {
            escala: [0, 400],
            altura: 120, // PX

            altura_maxima_registrada: 0,
            altura_minima_registrada: 0,

            indicadores: {
              max: 0,
              min: 0
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
        }
      },
      estadisticas: {
        datos: {},

        ui: {
          limite_maximo: 80,
          ancho_barras: 1,

          alto_graf_dia: 100,
        },
        dias: [
          // { /* Template de ejemplo */
          //   fecha: [],
          //   puntos: []
          // }
        ]
      },

      latidos: 0,
      stop: false,
      icono_tray: 'c.png',

      linea_limite: {
        h_max: 0,
        h_min: 0,
      },

      ui: {
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
          { nombre: "Mapa", svg: '<svg class="h10 w10" viewBox="0 0 24 24" fill="currentColor"> <path fill-rule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z" clip - rule="evenodd" /> </svg > ' },
        ],

        provincias: [
          { "id": 1,  "clase": "co_m_r", "nombre": 'Pinar del Río', "municipios":["Consolación del Sur", "Guane", "La Palma", "Los Palacios", "Mantua", "Minas de Matahambre", "Pinar del Río", "San Juan y Martínez", "San Luis", "Sandino", "Viñales"] }, 
          { "id": 2,  "clase": "co_m_r", "nombre": 'Artemisa', "municipios":[ "Alquízar", "Artemisa", "Bauta", "Caimito", "Guanajay", "Güira de Melena", "Mariel", "San Antonio de los Baños", "Bahía Honda", "San Cristóbal", "Candelaria"] },
          { "id": 3,  "clase": "co_m_r", "nombre": 'Mayabeque', "municipios":["Batabanó", "Bejucal", "Güines", "Jaruco", "Madruga", "Melena del Sur", "Nueva Paz", "Quivicán", "San José de las Lajas", "San Nicolás de Bari", "Santa Cruz del Norte"] },
          { "id": 4,  "clase": "co_m_r", "nombre": 'La Habana', "municipios":[ "Arroyo Naranjo", "Boyeros", "Centro Habana", "Cerro", "Cotorro", "Diez de Octubre", "Guanabacoa", "Habana del Este", "Habana Vieja", "La Lisa", "Marianao", "Playa", "Plaza", "Regla", "San Miguel del Padrón"] },
          { "id": 5,  "clase": "co_m_r", "nombre": 'Matanzas', "municipios":["Calimete", "Cárdenas", "Ciénaga de Zapata", "Colón", "Jagüey Grande", "Jovellanos", "Limonar", "Los Arabos", "Martí", "Matanzas", "Pedro Betancourt", "Perico", "Unión de Reyes"] },
          { "id": 6,  "clase": "co_m_r", "nombre": 'Cienfuegos', "municipios":["Abreus", "Aguada de Pasajeros", "Cienfuegos", "Cruces", "Cumanayagua", "Palmira", "Rodas", "Santa Isabel de las Lajas"] },
          { "id": 7,  "clase": "co_m_v", "nombre": 'Villa Clara', "municipios":["Caibarién", "Camajuaní", "Cifuentes", "Corralillo", "Encrucijada", "Manicaragua", "Placetas", "Quemado de Güines", "Ranchuelo", "Remedios", "Sagua la Grande", "Santa Clara", "Santo Domingo"] },
          { "id": 8,  "clase": "co_m_v", "nombre": 'Sancti Spíritus', "municipios":[ "Cabaigúan", "Fomento", "Jatibonico", "La Sierpe", "Sancti Spíritus", "Taguasco", "Trinidad", "Yaguajay"] },
          { "id": 9,  "clase": "co_m_v", "nombre": 'Ciego de Ávila', "municipio":["Ciro Redondo", "Baraguá", "Bolivia", "Chambas", "Ciego de Ávila", "Florencia", "Majagua", "Morón", "Primero de Enero", "Venezuela"] },
          { "id": 10, "clase": "co_m_v", "nombre": 'Camagüey', "municipios":[ "Camagüey", "Carlos Manuel de Céspedes", "Esmeralda", "Florida", "Guaimaro", "Jimagüayú", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur", "Sibanicú", "Sierra de Cubitas", "Vertientes"] },
          { "id": 11, "clase": "co_m_g", "nombre": 'Las Tunas', "municipios":[ "Amancio Rodríguez", "Colombia", "Jesús Menéndez", "Jobabo", "Las Tunas", "Majibacoa", "Manatí", "Puerto Padre"] },
          { "id": 12, "clase": "co_m_a", "nombre": 'Holguín', "municipios":[ "Antilla", "Báguanos", "Banes", "Cacocum", "Calixto García", "Cueto", "Frank País", "Gibara", "Holguín", "Mayarí", "Moa", "Rafael Freyre", "Sagua de Tánamo", "Urbano Noris"] },
          { "id": 13, "clase": "co_m_v", "nombre": 'Santiago de Cuba', "municipios":[ "Contramaestre", "Guamá", "Julio Antonio Mella", "Palma Soriano", "San Luis", "Santiago de Cuba", "Segundo Frente", "Songo la Maya", "Tercer Frente"] },
          { "id": 14, "clase": "co_m_r", "nombre": 'Guantánamo', "municipios":[ "Baracoa", "Caimanera", "El Salvador", "Guantánamo", "Imías", "Maisí", "Manuel Tames", "Niceto Pérez", "San Antonio del Sur", "Yateras"] },
          { "id": 15, "clase": "co_m_r", "nombre": 'Isla de la Juventud' },
          { "id": 16, "clase": "co_m_r", "nombre": "Granma", "municipios":[ "Bartolomé Masó", "Bayamo", "Buey Arriba", "Campechuela", "Cauto Cristo", "Guisa", "Jiguaní", "Manzanillo", "Media Luna", "Niquero", "Pilón", "Río Cauto", "Yara"] }
        ]
      },

      juegos: [
        { nombre: 'WoT', estado: 0, requisitos: [[30, 3, 1],[40, 10, 2]]},
        { nombre: 'CoH', estado: 0, requisitos: [[30, 10, 1],[40, 20, 2]]},
      ]
    }
  },
  mounted: function(){
    ipc.send('mw_size?');
    this.cambiarApartado('Monitor');
    // this.actualizar_monitor();
    
  },
  methods: {
    monitor_cambiar_size_muestra: function(size){
      this.monitor.muestra_largo = size;
    },
    cambiarApartado: function(apartado){
      this.ui.apartado_selecionado = apartado;

      switch (apartado) {
        case 'Estadisticas':
          this.$nextTick()
          .then(()=>{
            this.$refs.st_inp_date.valueAsDate = new Date();
            this.evt_est_cambiarFecha();
          });
          break;
      }
    },
    cambiarIcono: function(icono){
      this.icono_tray = icono;
    },

    getFecha: function() {
      let x = new Date();
      return x.toLocaleTimeString();
    },


    actualizar_monitor: function(ping) {
      const ESPACIO_ABAJO = 14;

      if (this.monitor.stop_update) return;
      if (this.ui.apartado_selecionado != "Monitor") return;
          this.monitor.cache = ping;

      let datos = {
        altura_maxima_registrada: 0,
        altura_minima_registrada: this.monitor.grafico.ejeY.escala[1],
        ejeX_coordenadas: []
      }

      if (ping.muestra == undefined) return;
      ping.muestra.forEach(ms => {
        if (ms > this.monitor.grafico.ejeY.escala[1]) ms = this.monitor.grafico.ejeY.escala[1];
        let altura = ((this.ui.mw.alto - 20 - ESPACIO_ABAJO) * ((ms / this.monitor.grafico.ejeY.escala[1]) * 100)) / 100;
        
        if (datos.altura_maxima_registrada < altura) datos.altura_maxima_registrada = altura;
        if (datos.altura_minima_registrada > altura && altura > 0) datos.altura_minima_registrada = altura;
        
        datos.ejeX_coordenadas.push([ms, altura]);
      });
      
      this.monitor.grafico.ejeY.altura_maxima_registrada = datos.altura_maxima_registrada;
      this.monitor.grafico.ejeY.altura_minima_registrada = datos.altura_minima_registrada;
      this.monitor.grafico.ejeX.coordenadas = datos.ejeX_coordenadas;
      this.monitor.grafico.ms = {
        perdidas: ping.perdidas,
        muestra: ping.muestra,
        minimo: ping.minimo,
        maximo: ping.maximo,
        media: ping.media,
      },
      this.monitor.latidos = this.monitor.latidos ? false : true;
      this.monitor.grafico.ejeY.indicadores.min = datos.altura_minima_registrada;
      this.monitor.grafico.ejeY.indicadores.max = Math.round((this.ui.mw.alto - 20 - ESPACIO_ABAJO) - datos.altura_maxima_registrada);
    },
    actualizar_estadisticas: function(input_day) {
      let input_day_time = input_day.fecha.getTime();
      let busqueda =  this.estadisticas.dias.findIndex(
        dia => dia.fecha.getTime() == input_day_time
      );
      if (busqueda == -1){
        this.estadisticas.dias.push(input_day);
      }else if(busqueda >= 0){
        this.estadisticas.dias[busqueda] = input_day;
      }
    },

    calcular_escala_ejeY: function(){
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

    esPar: function(numero){
      return (numero % 2) == 0;
    },

    colorParaMS: function (latencia) {
      if (latencia == 0) {
        return 'var(--co_gaf_drop)';
      } else if (latencia < 150) {
        return 'var(--co_txt_verde)';
      } else if (latencia >= 150 && latencia <= 300) {
        return 'var(--co_txt_amarillo)';
      } else {
        return 'var(--co_txt_rojo)';
      }
    },
    colorParaDrops: function (porcentajeDrops) {
      if (porcentajeDrops < 2) return "var(--co_txt_verde)";
      else if (porcentajeDrops < 5) return "var(--co_txt_amarillo)"; 
      else return "var(--co_txt_rojo)";
    },

    color: function(latencia){
      if (latencia == 0 ) return 'var(--co_gaf_drop)';
      else if (latencia < 150) return 'var(--co_gaf_verde)';
      else if(latencia >= 150 && latencia <= 300) return 'var(--co_gaf_amarillo)';
      else if(latencia > 300) return 'var(--co_gaf_rojo)';
      else return 'var(--co_gaf_drop)';
    },

    color2: function(latencia){
      if (latencia == '-'){
        return '#000000';
      }else if (latencia < 30){
        return '#05c13f';
      }else if(latencia < 50){
        return '#c2b53f';
      }else{
        return '#ff5722';
      }
    },

    color3: function(latencia){
      if (latencia == '-'){
        return '#000000';
      }else if (latencia < 1){
        return '#05c13f';
      }else if(latencia < 3){
        return '#c2b53f';
      }else{
        return '#ff5722';
      }
    },
    /**
     * Recibe los ms y returna un init correspondiente al rango
     * de calidad
     */
    calidad_latencia: function(ms){
      if (ms == 0) 
      return 0;
      if (ms < 150) 
        return 3;
      if(ms >= 150 && ms <= 300) 
        return 2;
      if(ms > 300) 
        return 1;

      return 0;
    },

    color_para_texto: function(ms, colorParaFondo=false){
      if (colorParaFondo){
        switch (this.calidad_latencia(ms)) {
          case 3: return 'var(--co_mapa_verde)'; break;
          case 2: return 'var(--co_mapa_amarillo)'; break;
          case 1: return 'var(--co_mapa_rojo)'; break;
          case 0: return 'var(--co_mapa_gris)'; break;
        }
      }else{
        switch (this.calidad_latencia(ms)) {
          case 3: return 'co_t_v'; break;
          case 2: return 'co_t_a'; break;
          case 1: return 'co_t_r'; break;
          case 0: return 'co_t_n'; break;
        }
      }
    },
    fn_format24h_to_12h: function (horas) {
      return `${(horas % 12) || 12} ${horas >= 12 ? 'PM' : 'AM'}`;
    },
    btn_est_fechaSiguiente: function(e) {
      this.$refs.st_inp_date.stepUp();
      this.evt_est_cambiarFecha();
    },
    btn_est_fechaAnterior: function(e) {
      this.$refs.st_inp_date.stepDown();
      this.evt_est_cambiarFecha();
    },
    evt_est_cambiarFecha: function() {
      let d = this.$refs.st_inp_date.valueAsDate;
      let r = [
        parseInt(d.getDate()),
        parseInt((d.getMonth() + 1)),
        parseInt(d.getFullYear()) 
      ]
      ipc.send('obtener_estadisticas', r[0], r[1], r[2]);
    },
    btn_maximizar: function(){ ipc.send('toggle_maximizar'); },
    btn_minimizar: function(){ ipc.send('minimizar_ventana'); },
    btn_cambiar_tamaño: function(tamaño){ 
      ipc.send('cambiar_tamaño_ventana', tamaño); 
    }
  },

  computed: {
    sortedArray: function () {
      let grafico_ordenado = [];

      this.monitor.grafico.ms.muestra.forEach(item => {
        grafico_ordenado.push(item);
      });
      

      return grafico_ordenado.sort().reverse();
    },

    render_est_dias: function(){

    }
  }
})

app.mount('#app')