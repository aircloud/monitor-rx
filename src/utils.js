/**
 * 将一个普通的函数转变成 Rx Observable 函数，对于不需要通过闭包来进行记忆的函数，均可采用这种方法
 * @param funcPools {Object}
 * @returns {function(*, *, *=): *}
 */
// 需要传递参数的情况
function convertToRx(funcPools = {}) {
    if (!Object.keys(funcPools).length) {
        console.error('[Error in monotor-rx.convertToRx], funcs is empty');
    }
    return function convert(RX, Operators, opts = {}) {
        let interval = opts.interval || 1000;

        let funcs;
        let id = opts.id;

        if (Object.prototype.toString.call(opts.funcs) === '[object Map]') {
            funcs = opts.funcs;
        } else {
            funcs = new Map(opts.funcs || Object.keys(funcPools).map(attr => [attr, null]));
        }

        return RX.Observable.create(function (observer) {
            let inter = setInterval(() => {
                console.log('mqtools interval...');
                // 这个地方的作用，实际上就是将待执行的函数一起执行并且返回结果，传入监听器
                Promise.all([...funcs.keys()].map(name => funcPools[name](...funcs.get(name)))).then((result) => {
                    observer.next({
                        result,
                        id,
                    });
                });
            }, interval);
            return {
                unsubscribe: () => {
                    clearInterval(inter);
                }
            };
        });
    };
}
// 不需要传递参数
function convertToSimpleRx(func) {
    return function convertSimple(RX, Operators, opts = {}) {
        let interval = opts.interval || 1000;
        return RX.Observable.create(function (observer) {
            let inter = setInterval(() => {
                let result = func();
                observer.next(result);
            }, interval);
            return {
                unsubscribe: () => {
                    clearInterval(inter);
                }
            };
        });
    };
}

module.exports = {
    convertToRx,
    convertToSimpleRx
};