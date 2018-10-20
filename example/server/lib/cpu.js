var os = require('os');

function cpuAverage() {
    let totalIdle = 0;
    let totalTick = 0;
    let cpus = os.cpus();
    for (let i = 0, len = cpus.length; i < len; i++) {
        let cpu = cpus[i];

        // Total up the time in the cores tick
        for (let type in cpu.times) {
            if (cpu.times.hasOwnProperty(type)) {
                totalTick += cpu.times[type];
            }
        }
        totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

function cpu(RX, Operators, opts = {}) {
    let interval = opts.interval || 1000;
    return RX.Observable.create(function (observer) {
        var startMeasure = cpuAverage();
        let inter = setInterval(() => {
            var endMeasure = cpuAverage();
            var idleDifference = endMeasure.idle - startMeasure.idle;
            var totalDifference = endMeasure.total - startMeasure.total;

            // Calculate the average percentage CPU usage
            var percentageCPU = 100 - ~~((100 * idleDifference) / totalDifference);

            startMeasure = endMeasure;

            observer.next({ percentageCPU });

        }, interval);
        return {
            unsubscribe: () => {
                console.log('call cpu unsubscribe');
                clearInterval(inter);
            }
        };
    });
}

module.exports = cpu;