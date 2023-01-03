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
  $('minimizar-btn').addEventListener('click', () => {
    ipc.send('minimizar_ventana');
  });
});

ipcRenderer.on('ping_stdout_stream', (event, arg) => {
  app._instance.ctx.manejar_datos_recividos(arg);
});
ipcRenderer.on('icono_tray', (event, arg) => {
  app._instance.ctx.cambiarIcono(arg);
})

let estado_test = [ "141", "127", "119", "104", "135", "127", "163", "108", 0, "119", "151", "109", 0, "140", "98", "152", "138", "123", "152", "138", "98", "130", "124", "151", "107", "132", "119", "115", "153", "141", "130", "127", "119", "115", "148", "104", "135", "129", "126", "123", "121", "145", 0, "160", "114", "153", "146", "135", "120", "151", "150", "136", "128", "145", "142", "140", "125", "111", "141", "128", "92", "154", "112", "119", "142", "139", "136", "131", "119", "145", "93", "120", "104", "141", "99", "135", "143", "117", "107", "133", "122", "151", "143", "135", "120", 0, "137", "124", "112", "149", "135", "127", "119", "118", 0, "119", "152", "141", "96", "127", "124", "121", "112", "149", "133", "131", "159", "106", "143", "140", 0, "121", "92", "143", "123", "113", "151", "135", 0, "147", "143", "103", "127", "115", "144", "128", "123", "122", "116", "151", "149", "146", "132", "129", "127", "114", "140", "136", "125", "115", 0, "132", "120", "135", "142", "143", "134", "95", "120", 0, "141", "133", "126", "121", "114", "142", "138", "134", "129", "113", "143", "97", "121", "145", "129", "119", "118", "114", "148", "144", "102", "139", "125", "152", "107", "143", "139", "136", "130", "126", 0, "118", "112", "110", "108", "135", "131", "125", 0, "158", "135", "119", "125", 0, "135", "132", "127", 0, "146", "104", "135", "119", "100", "133", "129", 0, "125", "160", 0, "129", "115", "159", "136", "134", "161", 0, "126", 0, "147", 0, "131", "162", "150", "145", 0, "151", "145", "133", 0, "131", "125", "100", "151", "104", "133", 0, "140", 0, "120", "146", "144", "97", "121", "152", "148", "121", "129", "123", "121", "147", "137", "103", "126", "113", "139", "134", "131", "139", "99", "127", "111", "113", "108", "132", "118", "152", "144", "141", "131", "126", "127", 0, 0, "135", "131", "115", 0, "116", "140", "112", "130", "126", "112", "137", "124", "159", "137", "125", 0, "132", "130", "122", "114", "138", 0, "149", "133", "129", "117", "145", "141", "117", "120", "106", "128", "123", "120", "116", "102", "128", 0, "139", "127", "126", 0, "109", "135", "97", "116", "152", "138", "124", "149", "107", "103", "100", "135", "121", "117", "103", "128", "112", "148", "143", "131", "117", "145", "141", "135", "128", "151", "140", "136", "172", "125", "122", "119", "148", "145", "136", "122", "110", "134", "121", 0, "138", "124", "121", "115", "152" ];
let estado = {
  tiempo: 60,
  paquetes: 60,
  icono: 'c',

  grafico: [],
  muestra: [
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ],
  muestra: [
    400, 350, 300, 250, 200, 150, 100, 50, 25, 15,
    400, 350, 300, 250, 200, 150, 100, 50, 25, 15,
    400, 350, 300, 250, 200, 150, 100, 50, 25, 15,
    400, 350, 300, 250, 200, 150, 100, 50, 25, 15,
    400, 350, 300, 250, 200, 150, 100, 50, 25, 15,
    400, 350, 300, 250, 200, 150, 100, 50, 25, 15,
  ],
  escala: [],

  media: 200,
  minimo: 100,
  maximo: 300,
  perdidos: 0,

  entrada: 0,
  estabilidad: 0,
  porcentajePerdidos: 0,
}

const app = Vue.createApp({
  data() {
    return {
      estado: estado,
      estado_test: estado_test,
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

        apartado_selecionado: "Estadisticas",
        apartados: [
          { nombre: "Configuración", nombreOculto: true, svg: '<svg class="w10" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>' },
          { nombre: "Monitor", svg: '<svg class="h10 w10" viewBox="0 0 20 20" fill="currentColor"> <path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clip-rule="evenodd" /> </svg>' },
          { nombre: "Estadisticas", svg: '<svg class="h10 w10" viewBox="0 0 20 20" fill="currentColor"> <path fill-rule="evenodd" d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75zM7.373 15l-.391 1.5h6.037l-.392-1.5H7.373zm7.49-8.931a.75.75 0 01-.175 1.046 19.326 19.326 0 00-3.398 3.098.75.75 0 01-1.097.04L8.5 8.561l-2.22 2.22A.75.75 0 115.22 9.72l2.75-2.75a.75.75 0 011.06 0l1.664 1.663a20.786 20.786 0 013.122-2.74.75.75 0 011.046.176z" clip-rule="evenodd" /> </svg>' },
          { nombre: "Juegos", svg: '<svg class="h10 w10" viewBox="0 0 24 24" fill="currentColor"> <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/> </svg>' },
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
    this.renderizar();
  },
  methods: {
    cambiarApartado: function(apartado){
      this.ui.apartado_selecionado = apartado;
    },
    cambiarIcono: function(icono){
      this.icono_tray = icono;
    },
    manejar_datos_recividos: function(datos){
      // return;
      if (this.stop) return;

      let entrada = 0;
      let muestra = this.estado.muestra;

      if (datos == "Tiempo de espera agotado para esta solicitud.") {
        entrada = 0;
      }else{
        let m;
        if ((m = /=([0-9]{0,3})ms/.exec(datos)) !== null) {
          entrada = m[1];
        }
      }

      if (muestra.length >= this.estado.tiempo) muestra.shift();
      muestra.push(entrada);

      this.latidos = this.latidos == 1 ? 0 : 1;
      this.estado.entrada = parseInt(entrada);
      this.estado.muestra = muestra;
      this.renderizar();
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

    renderizar: function(){
      if (this.stop) return;

      const datos = this.estado.muestra;
      const canvas_h = 125;
      const canvas_w = 325;

      const grf_max = 400;
      const grf_min = 0;

      let h_max = 0;
      let h_min = 400;


      let estado = {
        minimo: 0, media: 0, maximo: 0, icono: 'c',
        muestra: 0, perdidos: 0, paquetes: 0, entrada: this.estado.entrada,
        grafico: [], tiempo: this.estado.tiempo, escala: [], x: 'depl',
        estabilidad: this.estado.estabilidad,
        porcentajePerdidos: this.estado.porcentajePerdidos,
      }

      datos.forEach(latencia => {
        if (latencia > 500) latencia = 500; 
        if (latencia == 0 ) estado.perdidos ++;
        // grafico - min 0 (0%) - max 140 (100%)
        // latencia - min 0 - ref 500 = (100%)
        const porcentaje = Math.round((latencia * 100) / grf_max);
        const altura_calculada = Math.round((canvas_h * porcentaje) / 100);
 
        if (h_max < altura_calculada) h_max = altura_calculada;
        if (h_min > altura_calculada && altura_calculada != 0) h_min = altura_calculada;

        estado.grafico.push([latencia, altura_calculada]);
      });
      estado.muestra = datos;
      estado.escala = [400,350,300,250,200,150,100,50,0];
      estado.minimo = Math.min.apply(null, datos.filter(Boolean));
      if (estado.minimo == Infinity) estado.minimo = 0;

      estado.media = media(datos);
      if (isNaN(estado.media)) estado.media = 0;

      estado.maximo = Math.max(...datos);
      if (estado.maximo == -Infinity) estado.maximo = 0;

      estado.estabilidad = h_max - h_min;
      estado.porcentajePerdidos = Math.round((estado.muestra.length * estado.perdidos) / 100);

      if (estado.media == 0){
        estado.estabilidad = '-';
        estado.porcentajePerdidos = '0'
      }

      let ultimoPaqueteDrops = estado.muestra.at(-1) == 0 || estado.muestra.at(-1) == 999;
      let letraTray = 'c';

      if (estado.porcentajePerdidos <= 1 && estado.media < 200) letraTray = "b";
      else if (estado.porcentajePerdidos <= 3 && estado.media < 250) letraTray = "r";
      else letraTray = 'm';

      let numero = ultimoPaqueteDrops ? '0' : '1';
      estado.icono = letraTray + '_' + numero + '.png';

      this.linea_limite.h_max = h_max;
      this.linea_limite.h_min = h_min;
      this.estado = estado;
    },
  },

  computed: {
    sortedArray: function () {
      let grafico_ordenado = [];

      this.estado.muestra.forEach(item => {
        grafico_ordenado.push(item);
      });
      

      return grafico_ordenado.sort().reverse();
    }
  }
})

app.mount('#app')