var os = require('os');
var process = require('process');
const monitorRx = require('monitor-rx');

function getMemoryInfo() {
    return process.memoryUsage();
}

const memory = monitorRx.Utils.convertToSimpleRx(getMemoryInfo)

module.exports = memory;