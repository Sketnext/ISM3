'use strict';

class updater {
    #axios = require('axios');
    #baseUrl = 'http://localhost/update/';

    constructor() {
    }
    async checkForUpdates() {
        await this.#axios.post(this.#baseUrl, {
            producto: 'ism',
            vercion: '3.3.8'
            })
            .then(function (r) {
            // console.log(r);
            return false;
            })
            .catch(function (e) {
            console.log(e);
            });
    }
}

module.exports = new updater;
