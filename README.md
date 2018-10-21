## Monitor-RX Workflow

使用前需要了解 [Rx.js](https://cn.rx.js.org/) 以及其 [Observable](https://cn.rx.js.org/class/es6/Observable.js~Observable.html)。

[example](https://github.com/aircloud/monitor-rx/tree/master/example) | [解决的问题](http://niexiaotao.cn/2018/10/21/%E4%BD%BF%E7%94%A8%20Node.js%20%E6%89%93%E9%80%A0%E5%A4%9A%E7%94%A8%E6%88%B7%E5%AE%9E%E6%97%B6%E7%9B%91%E6%8E%A7%E7%B3%BB%E7%BB%9F/)

### 基本使用：

```javascript
const monitorRx = require('monitor-rx');

const RxModules = {/*你的 Observer 实例集合*/};

let monitorServer = new monitorRx.Server({ RxModules });

let queryItem = {
    id: 'ThisIsAnUniqueId',
    module: 'ModuleName',
    func: 'FuncName',
    args: ['arg1','arg2'],
    opts: {interval:1000},
};

monitorServer.sub(queryItem, {
    next: x => {
        // Handle the result: X
    },
});

setTimeout(() => {
    monitorServer.unSub(queryItem.id);
}, 2400);
```

Monitor-RX 是一个基于 Rx.js 的多用户监控系统解决方案，可以进行资源复用和管理。

#### Observer 生成器

上面的 RxModules 是一个 Observer 生成器集合对象，其每一个键名为 Observer 生成器名，而值为对应的 Observer 生成器函数，其可以返回一个 Observer 实例。

如果是一个无依赖的定时任务，我们可以通过 monitor-rx 提供的 `convertToRx` 或 `convertToSimpleRx` 转换成 Observable 生成函数，例如：

```
var os = require('os');
var process = require('process');
const monitorRx = require('monitor-rx');

function getMemoryInfo() {
    return process.memoryUsage();
}

const memory = monitorRx.Utils.convertToSimpleRx(getMemoryInfo)

// 或者
//const memory = monitorRx.Utils.convertToRx({
//    getMemoryInfo
//});

module.exports = memory;
```
convertToRx 相比于 convertToSimpleRx，可以支持函数配置注入（即下文中 opts 的 func 属性和 args 属性）,可以在具体生成 Observable 实例的时候具体指定使用哪些函数以及其参数。

而如果我们自定义 Observable，我们可以参考我们例子中的 [cpu监控函数](https://github.com/aircloud/monitor-rx/blob/master/example/server/lib/cpu.js)，其接受三个参数：

```javascript
function yourObservableCreator(RX, Operators, opts = {}) {
     return RX.Observable.create(function (observer) {
        // your Observable Creator logic
     });
}
```

RX 和 Operators 即 `rxjs` 以及其操作符，这里作为参数传入是为了方便使用，opts 中有两部分内容：

* monitor-rx 会注入一个 funcs 属性，是一个函数名以及其参数的 Map 实例，
* 其他调用端定义的 opts 属性会跟随传入。

#### queryItem

queryItem 包含了我们订阅一个 Observable 实例的信息，其 id 和 module 属性是必须的（一个用户应该只有一个 id，用于取消订阅的时候传入，以及进行用户管理），func 和 args 则是监控过程中需要调用的函数，我们也可以通过 agrs 传入用户个人信息。于没有内部子函数调用的监控，二者为空即可，opts 是一些其他可选项，比如定义请求间隔等，会传入到 Observable 生成函数的 opts 中。

### 更多内容

Monitor-RX 目前正在持续完善中，API 和 文档等正在进行完善，如果你遇到过和我[相似的问题](http://niexiaotao.cn/2018/10/21/%E4%BD%BF%E7%94%A8%20Node.js%20%E6%89%93%E9%80%A0%E5%A4%9A%E7%94%A8%E6%88%B7%E5%AE%9E%E6%97%B6%E7%9B%91%E6%8E%A7%E7%B3%BB%E7%BB%9F/)，欢迎你一起[讨论](https://github.com/aircloud/monitor-rx/issues)或者参与 Monitor-RX 的建设中




