const express = require('express');
const app     = express();
const port    = 5000;
const ApiServerMonitor = require("./monitors/api-server-monitor")
const ComponentStatusMonitor = require("./monitors/component-status-monitor")
const NodeMonitor = require("./monitors/node-monitor")

app.use(express.json())

app.listen(port, () => {
    console.log("All good... Listening on port: " + port);
});

app.get('/health', (req, res) => {

    var apiServerMonitor = new ApiServerMonitor();

    var componentStatusMonitor = new ComponentStatusMonitor();

    var nodeMonitor = new NodeMonitor();

    var result = {
        apiServerHealth: "unknown",
        etcdHealth: "unknown",
        controllerManagerHealth: "unknown",
        schedulerHealth: "unknown",
    }

    apiServerMonitor.getHealth("/healthz").then(status => {
        
        result.apiServerHealth = status;

        apiServerMonitor.getHealth("/healthz/etcd").then(status => {

            result.etcdHealth = status;

            componentStatusMonitor.getHealth().then(csResult => {

                result.controllerManagerHealth = csResult.controllerManagerHealth;
                result.schedulerHealth = csResult.schedulerHealth;

                nodeMonitor.getHealth().then(nodesResult => {
                    result.nodes = nodesResult;
                    return res.status(200).send(result);
                })
            })
        })
    }).catch(error => {
        console.log(error);
        return res.status(500).send("Something went wrong in the app");
    });
});