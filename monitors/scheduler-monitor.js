const ControllerManagerMonitor = require("../monitors/controller-manager-monitor")

// For monitoring scheduler
module.exports = class SchedulerMonitor extends ControllerManagerMonitor {
    
    constructor() {
        super();
        this.resultPropertyName = "scheduler";
        this.componentName = "scheduler";
    }
}