function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}


var out = {
    fecha: [0, 0, 0],
    datos: {
        horas: { // Formato 24, cada hora debe contar con 60 elementos (minutos)
            0:  [], 1:  [], 2:  [], 3:  [], 4:  [], 5:  [],
            6:  [], 7:  [], 8:  [], 9:  [], 10: [], 11: [],
            12: [], 13: [], 14: [], 15: [], 16: [], 17: [],
            18: [], 19: [], 20: [], 21: [], 22: [], 23: []
        }
    }
};

for (hora in out.datos.horas) {
    for (let w = 0; w < 60; w++) {
        out.datos.horas[hora].push([
            getRandomInt(5, 20),
            getRandomInt(150, 300)
        ]);
    }
}

console.log(JSON.stringify(out));