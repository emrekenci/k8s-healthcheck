const https = require('https')
var fs = require("fs");

// For monitoring nodes' health
module.exports = class NodeMonitor {
    getHealth() {
        return new Promise(function (resolve) {

            var result = [];

            try {
                const bearerTokenDir = "/var/run/secrets/kubernetes.io/serviceaccount/token";
                const bearerToken = fs.readFileSync(bearerTokenDir, 'utf8');
                const requestOptions = {
                    path: "/api/v1/nodes/", // the endpoint to get k8s component statuses
                    host: 'kubernetes.default.svc', // this is routed to api-server by kube-dns
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
                            console.error("Couldn't get nodes. Response status code: " + res.statusCode + " response body: " + body);
                            return resolve(result);
                        }

                        var nodes = JSON.parse(body).items;
                        nodes.forEach(node => {

                            var nodeStatus = "ok";
                            var problems = [];

                            node.status.conditions.forEach(condition => {
                                if(condition.type !== "Ready") {
                                    if(condition.status !== "False") {
                                        nodeStatus = "nok";
                                        problems.push(condition)
                                    }
                                } else {
                                    if(condition.status !== "True") {
                                        nodeStatus = "nok";
                                        problems.push(condition)
                                    }
                                }
                            })

                            if(problems.length == 0) {
                                result.push({
                                    name: node.metadata.name,
                                    status: nodeStatus,
                                });
                            } else {
                                result.push({
                                    name: node.metadata.name,
                                    status: nodeStatus,
                                    problems: problems
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