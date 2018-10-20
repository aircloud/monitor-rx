'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
* 基于 RxJS 的定时任务管理
* */

var Rx = require('rxjs');
var Operators = require('rxjs/operators');

var Server = function () {
    function Server() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Server);

        this.optsToIdsNum = new Map();
        this.optsToRx = new Map();
        this.idToOpts = new Map();
        this.idToRxs = new Map();
        this.RxModules = opts.RxModules || {};
    }

    _createClass(Server, [{
        key: 'setModule',
        value: function setModule(name, func) {
            this.RxModules[name] = func;
        }
    }, {
        key: 'sub',
        value: function sub(queryItem) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            // addSub 的别名
            this.addSub(queryItem, callback);
        }
    }, {
        key: 'addSub',
        value: function addSub(queryItem) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var queryInfo = {
                module: queryItem.module,
                func: queryItem.func,
                args: queryItem.args,
                opts: queryItem.opts
            };

            var queryUin = JSON.stringify(queryInfo);
            var subClient = void 0;
            if (this.optsToRx.has(queryUin)) {
                subClient = this.optsToRx.get(queryUin).subscribe({
                    next: function next(x) {
                        if (callback.next) callback.next(x);
                    },
                    error: function error(err) {
                        if (callback.error) callback.error(err);
                    },
                    complete: function complete(com) {
                        if (callback.complete) callback.complete(com);
                    }
                });
                var idsNum = this.optsToIdsNum.get(queryUin) || 0;
                idsNum += 1;
                this.optsToIdsNum.set(queryUin, idsNum);
            } else {

                var funcs = [];
                if (queryInfo.func === 'object' && queryInfo.func.length) {
                    for (var i = 0; i < queryInfo.func.length; i += 1) {
                        funcs.push([queryInfo.func[i], queryInfo.args[i]]);
                    }
                } else {
                    funcs = [[queryInfo.func, [].concat(_toConsumableArray(queryInfo.args || []))]];
                }
                var opts = Object.assign({}, queryItem.opts || {});
                var source = this.RxModules[queryItem.module](Rx, Operators, Object.assign({}, { funcs: funcs }, opts));

                var subject = new Rx.Subject();
                var refCounted = source.pipe(Operators.multicast(subject)).refCount();

                subClient = refCounted.subscribe({
                    next: function next(x) {
                        if (callback.next) callback.next(x);
                    },
                    error: function error(err) {
                        if (callback.error) callback.error(err);
                    },
                    complete: function complete(com) {
                        if (callback.complete) callback.complete(com);
                    }
                });

                this.optsToRx.set(queryUin, refCounted);
                this.optsToIdsNum.set(queryUin, 1);
            }

            if (this.idToOpts.has(queryItem.id)) {
                var queryOpts = this.idToOpts.get(queryItem.id);
                queryOpts.add(this.optsToRx.get(queryUin));
                this.idToOpts.set(queryItem.id, queryOpts);
                var Rxs = this.idToRxs.get(queryItem.id);
                Rxs.add(subClient);
                this.idToRxs.set(queryItem.id, Rxs);
            } else {
                this.idToOpts.set(queryItem.id, new Set([queryUin]));
                this.idToRxs.set(queryItem.id, new Set([subClient]));
            }
        }
    }, {
        key: 'unSub',
        value: function unSub(id) {
            this.removeSub(id);
        }
    }, {
        key: 'removeSub',
        value: function removeSub(id) {
            var optsArray = this.idToOpts.get(id);
            var subClients = this.idToRxs.get(id);

            if (!optsArray || !subClients) {
                console.log('Note:这里的情况理论上不应该出现');
                return;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = subClients[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var client = _step.value;

                    client.unsubscribe();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = optsArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var optUin = _step2.value;

                    var idsNum = this.optsToIdsNum.get(optUin);

                    idsNum -= 1;
                    if (idsNum === 0) {
                        this.optsToIdsNum.delete(optUin);
                        this.optsToRx.delete(optUin);
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this.idToRxs.delete(id);
            this.idToOpts.delete(id);
        }
    }]);

    return Server;
}();

module.exports = Server;