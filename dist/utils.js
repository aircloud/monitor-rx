'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * 将一个普通的函数转变成 Rx Observable 函数，对于不需要通过闭包来进行记忆的函数，均可采用这种方法
 * @param funcPools {Object}
 * @returns {function(*, *, *=): *}
 */
// 需要传递参数的情况
function convertToRx() {
    var funcPools = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!Object.keys(funcPools).length) {
        console.error('[Error in monotor-rx.convertToRx], funcs is empty');
    }
    return function convert(RX, Operators) {
        var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var interval = opts.interval || 1000;

        var funcs = void 0;
        var id = opts.id;

        if (Object.prototype.toString.call(opts.funcs) === '[object Map]') {
            funcs = opts.funcs;
        } else {
            funcs = new Map(opts.funcs || Object.keys(funcPools).map(function (attr) {
                return [attr, null];
            }));
        }

        return RX.Observable.create(function (observer) {
            var inter = setInterval(function () {
                console.log('mqtools interval...');
                // 这个地方的作用，实际上就是将待执行的函数一起执行并且返回结果，传入监听器
                Promise.all([].concat(_toConsumableArray(funcs.keys())).map(function (name) {
                    return funcPools[name].apply(funcPools, _toConsumableArray(funcs.get(name)));
                })).then(function (result) {
                    observer.next({
                        result: result,
                        id: id
                    });
                });
            }, interval);
            return {
                unsubscribe: function unsubscribe() {
                    clearInterval(inter);
                }
            };
        });
    };
}
// 不需要传递参数
function convertToSimpleRx(func) {
    return function convertSimple(RX, Operators) {
        var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var interval = opts.interval || 1000;
        return RX.Observable.create(function (observer) {
            var inter = setInterval(function () {
                var result = func();
                observer.next(result);
            }, interval);
            return {
                unsubscribe: function unsubscribe() {
                    clearInterval(inter);
                }
            };
        });
    };
}

module.exports = {
    convertToRx: convertToRx,
    convertToSimpleRx: convertToSimpleRx
};