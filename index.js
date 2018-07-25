const express = require('express');
const app = express();
const port = 5000;
const basicAuth = require('basic-auth-connect');

app.use(express.json())
app.use(basicAuth(process.env.USERNAME, process.env.PASSWORD));
app.listen(port, () => {
    console.log("App is starting. Listening on port: " + port);
});

const ApiServerMonitor = require("./monitors/api-server-monitor")
const EtcdMonitor = require("./monitors/etcd-monitor")
const ControllerManagerMonitor = require("./monitors/controller-manager-monitor")
const SchedulerMonitor = require("./monitors/scheduler-monitor")
const NodesMonitor = require("./monitors/nodes-monitor")
const DeploymentsMonitor = require("./monitors/deployments-monitor")

if (!process.env.USERNAME) {
    console.error("USERNAME environment variable must be set")
    process.exit(-1);
}

if (!process.env.PASSWORD) {
    console.error("PASSWORD environment variable must be set")
    process.exit(-1);
}

// The duration which we'll serve the results from memory. Default = 30 seconds
var cacheDuration = 30;
if (process.env.CACHE_DURATION_IN_SECONDS) {
    cacheDuration = parseInt(process.env.CACHE_DURATION_IN_SECONDS);
}

// All available monitors.
// If you want to write a new monitor, you need to add it to this array.
var monitors = [
    new ApiServerMonitor(),
    new EtcdMonitor(),
    new ControllerManagerMonitor(),
    new SchedulerMonitor(),
    new NodesMonitor(),
    new DeploymentsMonitor()
]

var excludedMonitorts = getExcludedMonitors();

var status = {};
var statusCode = 200;
var lastCheckAt = new Date();

// Run an initial check on all monitors on app-start
getMonitorStatuses().then(result => {
    status = result;
    status.lastCheckAt = lastCheckAt;
    statusCode = getStatusCode();
}).catch(() => {
    // By convention, we are only rejecting in monitors if there is an exception.
    // All handled/expected errors are logged but not rejected.
    // This is to be able to differentiate between when there is a problem with the monitor app itself or when 
    // there is an issue with a component.
    console.log("Initial check failed.");
});

// The healthcheck endpoint
app.get('/healthz', (req, res) => {
    try {

        var now = new Date();
        var timeSinceLastCheck = now - lastCheckAt;

        if (!(timeSinceLastCheck > cacheDuration * 1000)) {
            return res.status(statusCode).send(status);
        }

        return getMonitorStatuses().then(result => {

            status = result;
            statusCode = getStatusCode();

            lastCheckAt = new Date();
            status.lastCheckAt = lastCheckAt;

            return res.status(statusCode).send(status);

        }).catch(() => {
            return res.status(500).send("Something went wrong in the app. Check the logs.");
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send("Something went wrong in the app. Check the logs.");
    }
});

// Run the getHealth() method on each un-excluded monitor and construct the result
function getMonitorStatuses() {
    var healthCheckActions = [];

    monitors.forEach(monitor => {
        if(!excludedMonitorts.includes(monitor.resultPropertyName)) {
            healthCheckActions.push(monitor.getHealth());
        }
    })

    return Promise.all(healthCheckActions).then(healthCheckResults => {

        var i;
        var result = {};

        for (i = 0; i < healthCheckResults.length; i++) {
            result[healthCheckResults[i].resultPropertyName] = healthCheckResults[i].status;
        }

        return result;
    });
}

// Check the status of each monitor and decide whether to return 200 or 502
function getStatusCode() {
    for (var property in status) {
        if (status.hasOwnProperty(property)) {
            if (Object.prototype.toString.call(status[property]) === '[object Array]') {
                status[property].forEach(value => {
                    if (value.status !== "ok") {
                        return 502
                    }
                })
            } else {
                if (status[property] !== "ok" && property !== "lastCheckAt") {
                    return 502
                }
            }
        }
    }

    return 200;
}

// Users can exclude some monitors from the results using the EXCLUDE env variable
function getExcludedMonitors() {
    
    var validMonitorNames = [];

    monitors.forEach(monitor => {
        validMonitorNames.push(monitor.resultPropertyName);
    })
    
    if(process.env.EXCLUDE) {
        var excludedMonitorNames = process.env.EXCLUDE.split(',');
        if(excludedMonitorNames.length !== 0) {
            excludedMonitorNames.forEach(monitorName => {
                if(!validMonitorNames.includes(monitorName)) {
                    console.error("Provided monitor name for exclusion: '" + monitorName + "' is invalid. Valid monitor names you can exclude are: " 
                    + validMonitorNames.toString() + " case sensitive.")
                    process.exit(-1);
                }
            })

            if(excludedMonitorNames.length === monitors.length) {
                console.error("You excluded every monitor from the result. So what's the point in running the app?")
                process.exit(-1);
            }

            return excludedMonitorNames;
        }
    }

    return [];
}