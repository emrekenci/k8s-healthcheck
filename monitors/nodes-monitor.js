const BaseMonitor = require("../monitors/base-monitor")

// For monitoring nodes' health
module.exports = class NodesMonitor extends BaseMonitor {

    constructor() {
        super();
        this.resultPropertyName = "nodes";
        this.requestOptions.path = "/api/v1/nodes/"
    }

    getHealth() {
        return new Promise(function (resolve, reject) {

            var result = {
                resultPropertyName: this.resultPropertyName,
                status: "unknown"
            };

            try {
                var req = this.httpClient.request(this.requestOptions, function (res) {

                    var body = "";

                    res.on('data', function (chunk) {
                        body += chunk;
                    });

                    res.on('end', function () {
                        try {
                            if (res.statusCode !== 200 || body == null) {
                                console.error("Couldn't get nodes. Response status code: " + res.statusCode + " response body: " + body);
                                return resolve(result);
                            }

                            result.status = [];

                            var nodes = JSON.parse(body).items;
                            nodes.forEach(node => {

                                var nodeStatus = "ok";
                                var problems = [];

                                node.status.conditions.forEach(condition => {
                                    if (condition.type !== "Ready") {
                                        if (condition.status !== "False") {
                                            nodeStatus = "nok";
                                            problems.push(condition)
                                        }
                                    } else {
                                        if (condition.status !== "True") {
                                            nodeStatus = "nok";
                                            problems.push(condition)
                                        }
                                    }
                                })

                                if (problems.length == 0) {
                                    result.status.push({
                                        name: node.metadata.name,
                                        status: nodeStatus,
                                    });
                                } else {
                                    result.status.push({
                                        name: node.metadata.name,
                                        status: nodeStatus,
                                        problems: problems
                                    });
                                }
                            });

                            return resolve(result);
                        } catch (error) {
                            console.error(error);
                            return reject(result);
                        }
                    });
                });

                // on request error, reject
                req.on('error', function (err) {
                    console.error("Received error making a request to: /api/v1/nodes/");
                    return resolve(result);
                });

                // if there's post data, write it to the request
                req.end()
            }
            catch (err) {
                console.error(err);
                return reject(result);
            }
        }.bind(this));
    }
}