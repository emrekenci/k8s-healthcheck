const BaseMonitor = require("../monitors/base-monitor")

// Get the health status of the deployments in the cluster
module.exports = class DeploymentsMonitor extends BaseMonitor {

    constructor() {
        super();
        
        this.resultPropertyName = "deployments";

        // Check the deployments in the namespace provided in the config file.
        // If nothing is provided, then use the defaul namespace. 
        var namespace = process.env.DEPLOYMENTS_NAMESPACE ? process.env.DEPLOYMENTS_NAMESPACE : "default"
        this.requestOptions.path = "/apis/apps/v1/namespaces/" + namespace + "/deployments/";
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
                                console.error("Couldn't get deployments. Response status code: " + res.statusCode + " response body: " + body);
                                return resolve(result);
                            }

                            result.status = [];

                            var deployments = JSON.parse(body).items;
                            deployments.forEach(deployment => {

                                var deploymentStatus = "ok";
                                var problems = [];

                                deployment.status.conditions.forEach(condition => {
                                    if (condition.type === "Available") {
                                        if (condition.status !== "True") {
                                            deploymentStatus = "nok";
                                            problems.push(condition)
                                        }
                                    } else if (condition.type === "Progressing") {
                                        if (condition.status !== "True") {
                                            deploymentStatus = "nok";
                                            problems.push(condition)
                                        }
                                    } else {
                                        console.error("Unknown condition type in deployment monitor."+
                                        " Deployment name: " + deployment.metadata.name +
                                        " Condition type: " + condition.type)
                                    }
                                })

                                if (problems.length == 0) {
                                    result.status.push({
                                        name: deployment.metadata.name,
                                        status: deploymentStatus,
                                    });
                                } else {
                                    result.status.push({
                                        name: deployment.metadata.name,
                                        status: deploymentStatus,
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