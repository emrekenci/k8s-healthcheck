const https = require('https')
var fs = require("fs");

// For monitoring controller manager, scheduler and 
module.exports = class ComponentStatusMonitor {
    getHealth() {
        return new Promise(function (resolve) {

            var result = {
                controllerManagerHealth: "unknown",
                schedulerHealth: "unknown",
            };

            try {
                const bearerTokenDir = "/var/run/secrets/kubernetes.io/serviceaccount/token";
                const bearerToken = fs.readFileSync(bearerTokenDir, 'utf8');
                const requestOptions = {
                    path: "/api/v1/componentstatuses", // the endpoint to get k8s component statuses
                    host: "kubernetes.default.svc", // this is routed to api-server by kube-dns
                    ca: [fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt')], // the api-server cert stored by default on each pod
                    rejectUnauthorized: true, // reject the response if we can't validate the ssl cert
                    agent: false,
                    headers: { 'Authorization': "Bearer " + bearerToken }
                };

                var req = https.request(requestOptions, function (res) {
                    
                    var body = "";
                    
                    res.on('data', function (chunk) {
                        body += chunk;
                    });

                    res.on('end', function () {
                        if (res.statusCode !== 200 || body == null) {
                            console.error("Couldn't get component statuses. Response status code: " + res.statusCode + " response body: " + body);
                            return resolve(result);
                        }

                        var componentStatuses = JSON.parse(body).items;

                        componentStatuses.forEach(componentStatus => {
                            if (componentStatus.metadata.name === "controller-manager") {
                                componentStatus.conditions.forEach(condition => {
                                    if(condition.type === "Healthy") {
                                        result.controllerManagerHealth = condition.status === "True" ? "ok" : "nok"
                                    } 
                                });
                            }

                            if (componentStatus.metadata.name === "scheduler") {
                                componentStatus.conditions.forEach(condition => {
                                    if(condition.type === "Healthy") {
                                        result.schedulerHealth = condition.status === "True" ? "ok" : "nok"
                                    } 
                                });
                            }
                        });

                        return resolve(result);
                    });
                });

                // on request error, reject
                req.on('error', function (err) {
                    console.error(err);
                    return resolve(result);
                });

                // if there's post data, write it to the request
                req.end()
            }
            catch (err) {
                console.error(err);
                return resolve(result);
            }
        });
    }
}