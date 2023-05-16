const $ = function(e){
    return document.getElementById(e);
}


var sw = Vue.createApp({
    mounted: function(){
        this.h_obtenerUltimosDias();

        /* Obtener colores de las variables css */
        const styles = getComputedStyle(document.documentElement);
        this.ui.colores = {
            verde:       styles.getPropertyValue('--co_gaf_verde').trim(),
            amarillo:    styles.getPropertyValue('--co_gaf_amarillo').trim(),
            rojo:        styles.getPropertyValue('--co_gaf_rojo').trim(),
            perdida:     styles.getPropertyValue('--co_gaf_lostpackage').trim(),
            desconexión: styles.getPropertyValue('--co_gaf_desconectado').trim(),
        };

        /* ipcMain Events */
        e.windowHasChanged((_e) => {
            this.e_windowRezise();
        });



    //    this.$refs.inputDate.valueAsDate = new Date();
       OmRangeSlider.init();

        var fechaAhora = new Date;
        setTimeout(() => {
            this.interval_cambio_minuto = setInterval(()=>{
                this.u_cambioMinuto();
            }, 60000);

        }, (60 - fechaAhora.getSeconds()) * 1000);

        this.u_setHoraFollower();

    },
    data() {
        return {
            interval_cambio_minuto: 0,
            ui:{
                colores: {},
            },
            historial: {
                dia_seleccionado: {},
                dia_selec_stats: {
                    tiempo: {
                        bien: 0,
                        regular: 0,
                        malo: 0,
                        desconectado: 0,
                        porRegistrar: 0,
                    }
                },
                historial_ultimos_dias: [],
            },
            conf: {
                formato_12h: false
            }
        }
    },
    methods: {
        u_cambioMinuto: function(){
            this.u_setHoraFollower();
            this.h_obtenerUltimosDias();
        },
        e_windowRezise: function(){
            this.u_setHoraFollower();
        },

        u_setHoraFollower: function(){
            var fechaAhora = new Date;

            /* Calcular la pocicion para el timeFollower en los 
            conetenedores de historial y seleccionado */
            let cont = {
                historial: {
                    el: this.$refs.contHistHoras,
                    cs: null,
                    gap: 0,
                    anchoHoras: 0,
                    anchoMinutos: 0,
                    pocicionDeterminada: "",
                },
                seleccionado: {
                    el: this.$refs.contSeleccionado,
                    cs: null,
                    gap: 0,
                    anchoHoras: 0,
                    anchoMinutos: 0,
                    pocicionDeterminada: "",
                }
            };

            cont.historial.cs = getComputedStyle(cont.historial.el);
            cont.historial.gap = parseInt(cont.historial.cs.gap.replace(/px/g, ""));
            cont.historial.anchoHoras = cont.historial.el.clientWidth / 24;
            cont.historial.anchoMinutos = cont.historial.anchoHoras / 60;
            cont.historial.pocicionDeterminada = `${(cont.historial.anchoHoras * fechaAhora.getHours()) + (cont.historial.anchoMinutos * (fechaAhora.getMinutes() + 1))}px`;
            
            cont.seleccionado.cs = getComputedStyle(cont.seleccionado.el);
            cont.seleccionado.gap = parseInt(cont.seleccionado.cs.gap.replace(/px/g, ""));
            cont.seleccionado.anchoHoras = cont.seleccionado.el.clientWidth / 24;
            cont.seleccionado.anchoMinutos = cont.seleccionado.anchoHoras / 60;
            cont.seleccionado.pocicionDeterminada = `${(cont.seleccionado.anchoHoras * fechaAhora.getHours()) + (cont.seleccionado.anchoMinutos * (fechaAhora.getMinutes() + 1))}px`;
            
            this.$refs.timeFollowerHistorial.style.left =  cont.historial.pocicionDeterminada;
            this.$refs.timeFollowerDiaSelec.style.left =  cont.seleccionado.pocicionDeterminada;
        },
        h_obtenerUltimosDias: async function(){
            const r = await p.ipcRenderer.invoke('obtenerDatos:ultimosDias');
            
            this.historial.historial_ultimos_dias = r;
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
        e_mouseHover_historial: function(e) {
            if (e.layerX == 0) return;
            this.$refs.mouseVerticalFollower.style.left = `${e.layerX}px`;
        },
        e_mouseOut_historial: function() {
            this.$refs.mouseVerticalFollower.style.left = "-1px";
        },

        h24Th12: function (hora=0) {
            return `${((hora + 11) % 12 + 1)} ${hora >= 12 ? "p.m." : "a.m."}`;
        },
        initMes2str: function(mes=0, stringCompleto = false){
            var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return stringCompleto ? meses[mes] : meses[mes].slice(0, 3);
        }


    },
    computed: {
        h_computar_mini_historial(){
            return this.historial.historial_ultimos_dias;
        },
    }
});

window.onload = () => {
    sw.mount('#sw');
};
