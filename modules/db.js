'use strict';

class db {
    #db;
    #sqlite3;
    #debug = false;
    
    colors = require('colors');
    log = (str) => {if (this.#debug) return; console.log("["+"Info".blue+"][db]: "+str); };
    error = (str) => { console.log("["+"Error".red+"][db]: "+str); };
    warn = (str) => { console.log("["+"Warn".yellow+"][db]: "+str); };
    ev = (str) => {if (this.#debug) return; console.log("["+"Event".green+"][db]: "+str); };

    constructor() {
        this.#sqlite3 = require('sqlite3').verbose();
        this.#db = new this.#sqlite3.Database(
            // __dirname + '/src/datos.db',
            'datos.db',
            undefined,
            () => { 
                this.error("Error al acceder a la db");
            }
        );

        this.#db.exec(`
            CREATE TABLE IF NOT EXISTS "estado_internet" (
                "id" INTEGER, 
                "mes" INTEGER, 
                "dia" INTEGER, 
                "hora" INTEGER, 
                "minuto" INTEGER, 
                "loss" INTEGER, 
                "med" INTEGER, 
                "max" INTEGER, 
                "min" INTEGER, 
                PRIMARY KEY("id" AUTOINCREMENT)
            );
            CREATE TABLE IF NOT EXISTS "config" (
                "name" TEXT UNIQUE, 
                "value" TEXT DEFAULT null, 
                PRIMARY KEY("name")
            );
        `)
            
    };

    registrar_estado(estado){
        let fecha = new Date;
        if (estado.muestra.length != 60) {
            this.warn("Faltan muestras, return.");
            return;
        }
        let stmt = this.#db.prepare(
          `INSERT INTO "main"."estado_internet"("min","max","med","loss","dia","hora","mes","minuto")` +
          `VALUES (?,?,?,?,?,?,?,?);`
        )
        stmt.run(
            estado.minimo, 
            estado.maximo, 
            estado.media, 
            estado.perdidas[1],
            fecha.getDate(), 
            fecha.getHours(), 
            fecha.getMonth(),
            fecha.getMinutes(),
            () => {
                this.log("Minuto registrado.");
            }
        )
    }

    obtener_estado(dia, mes, año){
        if (dia == undefined || mes == undefined || año == undefined) return false;
        const promesa = new Promise((resolve, reject) => {
            this.#db.all(`SELECT * FROM "main"."estado_internet" WHERE dia = ${dia} AND mes = ${mes}`, (err, rows) => {
                let horas = [];
                for (let w = 0; w < 24; w++) { 
                    horas[w] = [
                        [-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],
                        [-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],
                        [-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],
                        [-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],
                        [-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],
                        [-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]
                    ];
                }
    
                for (const row of rows) {
                    horas[row.hora][row.minuto] = [row.loss, row.med];
                }
    
                return resolve({
                    fecha: [dia, mes, año],
                    horas: horas
                });
            });
        });

        return promesa;
    }
};


module.exports = new db;


