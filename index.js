const express = require('express');
const app = express();
const port = 5000;
const ApiServerMonitor = require("./monitors/api-server-monitor")
const ComponentStatusMonitor = require("./monitors/component-status-monitor")
const NodeMonitor = require("./monitors/node-monitor")
const basicAuth = require('basic-auth-connect');

app.use(express.json())

if (!process.env.USERNAME) {
    console.error("USERNAME environment variable must be set")
    process.exit(-1);
}

if (!process.env.PASSWORD) {
    console.error("PASSWORD environment variable must be set")
    process.exit(-1);
}

app.use(basicAuth(process.env.USERNAME, process.env.PASSWORD));

app.listen(port, () => {
    console.log("All good... Listening on port: " + port);
});

var status = {
    apiServer: "unknown",
    etcd: "unknown",
    controllerManager: "unknown",
    scheduler: "unknown",
    nodes: [],
    lastCheckAt: new Date(1970)
}

// The duration which we'll serve the results from memory. Default = 30 seconds
var cacheDuration = 30;
if (process.env.CACHE_DURATION_IN_SECONDS) {
    cacheDuration = parseInt(process.env.CACHE_DURATION_IN_SECONDS);
}

app.get('/healthz', (req, res) => {

    var now = new Date();

    var timeSinceLastCheck = now - status.lastCheckAt;

    if (!(timeSinceLastCheck > cacheDuration * 1000)) {
        return res.status(200).send(status);
    }

    status.lastCheckAt = new Date()

    var apiServerMonitor = new ApiServerMonitor();

    var componentStatusMonitor = new ComponentStatusMonitor();

    var nodeMonitor = new NodeMonitor();

    apiServerMonitor.getHealth("/healthz").then(apiServerStatus => {

        status.apiServer = apiServerStatus;

        apiServerMonitor.getHealth("/healthz/etcd").then(etcdStatus => {

            status.etcd = etcdStatus;

            componentStatusMonitor.getHealth().then(componentsStatus => {

                status.controllerManager = componentsStatus.controllerManagerHealth;
                status.scheduler = componentsStatus.schedulerHealth;

                nodeMonitor.getHealth().then(nodesResult => {
                    status.nodes = nodesResult;
                    var statusCode = getStatusCode();
                    return res.status(statusCode).send(status);
                })
            })
        })
    }).catch(error => {
        console.log(error);
        return res.status(500).send("Something went wrong in the app");
    });
});

function getStatusCode() {
    if(status.apiServerHealth !== "ok" || status.etcdHealth !== "ok" || status.etcdHealth !== "ok" || status.controllerManagerHealth !== "ok") {
        return 500;
    }

    status.nodes.forEach(node=> {
        if(node.status !== "ok") {
            return 500;
        }
    })

    return 200;
}