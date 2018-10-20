var os = require('os');
var process = require('process');
const monitorRx = require('monitor-rx');

function getMemoryInfo() {
    return process.memoryUsage();
}

/**
 * 这里提供另外一种写法，这种写法得到的 Rx 函数可以支持动态注入参数的功能，
 */
const memory = monitorRx.Utils.convertToRx({
    getMemoryInfo
});

module.exports = memory;