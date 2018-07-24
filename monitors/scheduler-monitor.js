const ControllerManagerMonitor = require("../monitors/controller-manager-monitor")

// For monitoring controller manager, scheduler and 
module.exports = class SchedulerMonitor extends ControllerManagerMonitor {
    
    constructor() {
        super();
        this.resultPropertyName = "scheduler";
        this.componentName = "scheduler";
    }
}