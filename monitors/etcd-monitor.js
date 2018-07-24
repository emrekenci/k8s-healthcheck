const ApiServerMonitor = require("../monitors/api-server-monitor")

module.exports = class EtcdMonitor extends ApiServerMonitor {
    
    constructor() {
        super();
        this.path = "/healtz/etcd";
        this.resultPropertyName = "etcd";
    }
}