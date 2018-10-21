/*
* 基于 RxJS 的定时任务管理
* */

const Rx = require('rxjs');
const Operators = require('rxjs/operators');

class Server {
    constructor(opts = {}) {
        this.optsToIdsNum = new Map();
        this.optsToRx = new Map();
        this.idToOpts = new Map();
        this.idToRxs = new Map();
        this.RxModules = opts.RxModules || {};
    }

    setModule(name, func) {
        this.RxModules[name] = func;
    }

    sub(queryItem, callback = {}) {
        // addSub 的别名
        this.addSub(queryItem, callback);
    }

    addSub(queryItem, callback = {}) {
        let queryInfo = {
            module: queryItem.module,
            func: queryItem.func,
            args: queryItem.args,
            opts: queryItem.opts,
        };

        let queryUin = JSON.stringify(queryInfo);
        let subClient;
        if (this.optsToRx.has(queryUin)) {
            subClient = this.optsToRx.get(queryUin).subscribe({
                next: x => {
                    if (callback.next) callback.next(x);
                },
                error: err => {
                    if (callback.error) callback.error(err);
                },
                complete: (com) => {
                    if (callback.complete) callback.complete(com);
                }
            });
            let idsNum = this.optsToIdsNum.get(queryUin) || 0;
            idsNum += 1;
            this.optsToIdsNum.set(queryUin, idsNum);

        } else {

            let funcs = [];
            if (queryInfo.func === 'object' && queryInfo.func.length) {
                for (let i = 0; i < queryInfo.func.length; i += 1) {
                    funcs.push([queryInfo.func[i], queryInfo.args[i]]);
                }
            } else {
                funcs = [[queryInfo.func, [...(queryInfo.args || [])]]];
            }

            let opts = Object.assign({}, queryItem.opts || {});
            let source = this.RxModules[queryItem.module](Rx, Operators, Object.assign({}, { funcs: new Map(funcs) }, opts));

            let subject = new Rx.Subject();
            let refCounted = source.pipe(Operators.multicast(subject)).refCount();

            subClient = refCounted.subscribe({
                next: x => {
                    if (callback.next) callback.next(x);
                },
                error: err => {
                    if (callback.error) callback.error(err);
                },
                complete: (com) => {
                    if (callback.complete) callback.complete(com);
                }
            });

            this.optsToRx.set(queryUin, refCounted);
            this.optsToIdsNum.set(queryUin, 1);

        }

        if (this.idToOpts.has(queryItem.id)) {
            let queryOpts = this.idToOpts.get(queryItem.id);
            queryOpts.add(this.optsToRx.get(queryUin));
            this.idToOpts.set(queryItem.id, queryOpts);
            let Rxs = this.idToRxs.get(queryItem.id);
            Rxs.add(subClient);
            this.idToRxs.set(queryItem.id, Rxs);
        } else {
            this.idToOpts.set(queryItem.id, new Set([queryUin]));
            this.idToRxs.set(queryItem.id, new Set([subClient]));
        }
    }

    unSub(id) {
        this.removeSub(id);
    }

    removeSub(id) {
        let optsArray = this.idToOpts.get(id);
        let subClients = this.idToRxs.get(id);

        if (!optsArray || !subClients) {
            console.log('Note:这里的情况理论上不应该出现')
            return;
        }

        for (let client of subClients) {
            client.unsubscribe();
        }

        for (let optUin of optsArray){
            let idsNum = this.optsToIdsNum.get(optUin);

            idsNum -= 1;
            if (idsNum === 0) {
                this.optsToIdsNum.delete(optUin);
                this.optsToRx.delete(optUin);
            }
        }

        this.idToRxs.delete(id);
        this.idToOpts.delete(id);
    }
}

module.exports = Server;