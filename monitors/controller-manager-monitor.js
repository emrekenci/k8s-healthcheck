const BaseMonitor = require("../monitors/base-monitor")

// For monitoring controller manager
module.exports = class ControllerManagerMonitor extends BaseMonitor {

    constructor() {
        super();
        this.requestOptions.path = "/api/v1/componentstatuses";
        this.resultPropertyName = "controllerManager";
        this.componentName = "controller-manager";
    }

    getHealth() {
        return new Promise(function (resolve, reject) {
            var result = {
                resultPropertyName: this.resultPropertyName,
                status: "unknown",
            }

            try {
                var req = this.httpClient.request(this.requestOptions, function (res) {
                    var body = "";

                    res.on('data', function (chunk) {
                        body += chunk;
                    });

                    res.on('end', function () {
                        try {
                            if (res.statusCode !== 200 || body == null) {
                                console.error("Couldn't get component statuses. Response status code: " + res.statusCode + " response body: " + body);
                                return resolve(result);
                            }

                            var componentStatuses = JSON.parse(body).items;

                            componentStatuses.forEach(componentStatus => {
                                if (componentStatus.metadata.name === this.componentName) {
                                    componentStatus.conditions.forEach(condition => {
                                        if (condition.type === "Healthy") {
                                            result.status = condition.status === "True" ? "ok" : "nok"
                                        }
                                    });
                                }
                            });

                            return resolve(result);
                        } catch (error) {
                            console.error(error);
                            return reject(result);
                        }
                    }.bind(this))
                }.bind(this));

                req.on('error', function (err) {
                    console.error("Received error making a request to: " + this.path + " error: " + err);
                    return resolve(result); // TODO: We consider this situation a problem with the monitor app itself. But it could be an api related issue too.
                });

                req.end()
            }
            catch (err) {
                console.error(err);
                return reject(result);
            }
        }.bind(this));
    }
}