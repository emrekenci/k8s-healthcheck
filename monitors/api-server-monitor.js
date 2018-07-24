const BaseMonitor = require("../monitors/base-monitor")

// For monitoring api-server and etcd 
module.exports = class APIServerMonitor extends BaseMonitor {

    constructor() {
        super();
        // We use the same class for api-server-health and etcd health. The only difference is the url path.
        // "/healthz" for api-server health, "/healtz/etcd" for etcd health check.
        this.requestOptions.path = "/healthz";
        this.resultPropertyName = "apiServer";
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
                                console.error("API server health check failed on path: " + this.path + ". Status code: " + res.statusCode +
                                    " body: " + body);
                                result.status = "nok";
                                return resolve(result);
                            } else {
                                result.status = "ok"
                                return resolve(result);
                            }
                        } catch (error) {
                            console.error(error);
                            return reject(result);
                        }
                    })
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