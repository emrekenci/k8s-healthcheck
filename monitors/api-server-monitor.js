const https = require('https')
var fs = require("fs");

module.exports = class APIServerMonitor {

    getHealth(path) {
        return new Promise(function (resolve) {
            try {
                const bearerTokenDir = "/var/run/secrets/kubernetes.io/serviceaccount/token";
                const bearerToken = fs.readFileSync(bearerTokenDir, 'utf8');
                const requestOptions = {
                    path: path, // "/healthz" for api-server health, "/healtz/etcd" for etcd health check.
                    host: 'kubernetes.default.svc', // this is routed to api-server by kube-dns.
                    ca: [fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt')], // the api-server cert stored by default on each pod
                    rejectUnauthorized: true, // reject the response if we can't validate the ssl cert.
                    agent: false,
                    headers: { 'Authorization': "Bearer " + bearerToken }
                };

                var req = https.request(requestOptions, function (res) {

                    var body = "";

                    res.on('data', function (chunk) {
                        body += chunk;
                    });

                    res.on('end', function () {
                        if (res.statusCode !== 200) {
                            console.error("API server health check failed on path: " + path + ". Status code: " + res.statusCode +
                                " body: " + body);
                            return resolve("nok");
                        } else {
                            return resolve("ok");
                        }
                    })
                });

                req.on('error', function (err) {
                    console.error(err);
                    return resolve("unknown");
                });

                req.end()
            }
            catch (err) {
                console.error(err);
                return resolve("unknown");
            }
        });
    }
}