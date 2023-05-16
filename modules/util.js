'use strict';

const os = require('os');
const exec = require('child_process').exec;

class util {
    #db;

    constructor() {
        this.#db = require('./db.js');
    }

    registrar_estado = (estado) => { return this.#db.registrar_estado(estado); }
    obtener_estado_dia = (dia, mes, año) => { return this.#db.obtener_estado(dia, mes, año); }
    async obtener_estado_ultimos_dias() {
        let datosUltimosDias = [];

        // Obtener fechas (xx-xx-xxxx)
        let puntero = new Date;
        let fechasUltimosDias = [];

        for (let q = 0; q < 8; q++) {
            fechasUltimosDias.push([
                puntero.getDate(),
                puntero.getMonth(),
                puntero.getFullYear()
            ]);
            puntero.setDate(puntero.getDate() - 1);
        }

        for (const fecha of fechasUltimosDias) {
            datosUltimosDias.push(
                await this.#db.obtener_estado(fecha[0], fecha[1], fecha[2])
            );
        }
        
        return datosUltimosDias;
    }

    async getCurrentSpeed() {
        return new Promise((resolve, reject) => {
            let command = '';
            if (os.platform() === 'darwin') {
                command = `netstat -ibI ${this.interface} | grep -E "^[a-z]" | awk '{print $10, $7}' | tail -n 1`;
            } else if (os.platform() === 'win32' || os.platform() === 'win64') {
                command = `netstat /e | findstr "Bytes"`;
            } else {
                command = `cat /sys/class/net/${this.interface}/statistics/rx_bytes && cat /sys/class/net/${this.interface}/statistics/tx_bytes`;
            }
            exec(command, (err, stdout) => {
                if (err) {
                    reject(err);
                } else {
                    if (os.platform() === 'win32' || os.platform() === 'win64') {
                        const output = stdout.trim().replace(/\t|\s{2,}/g, ' ').replace(/Bytes/g, '').trim();
                        const [rx, tx] = output.split(' ').map(n => parseInt(n));
                        resolve({ rx, tx });
                    } else if (os.platform() === 'darwin') {
                        const [rx, tx] = stdout.trim().split(' ').map(n => parseInt(n));
                        resolve({ rx, tx });
                    } else {
                        const [rx, tx] = stdout.trim().split(/\r?\n/).map(n => parseInt(n));
                        resolve({ rx, tx });
                    }
                }
            });
        });
    }

}

module.exports = new util;