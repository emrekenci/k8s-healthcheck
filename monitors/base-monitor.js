const https = require("https")
const http = require("http")
var fs = require("fs");

module.exports = class BaseMonitor {
    constructor(){

        this.requestOptions = {};

        if (process.env.NODE_ENV === "local") {
            this.httpClient = http;
            this.requestOptions.host = "localhost"
            this.requestOptions.port = 8001
        } else {
            this.httpClient = https;
            this.requestOptions.headers = { 'Authorization': "Bearer " + fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", 'utf8') }
            this.requestOptions.host = "kubernetes.default.svc" // this is routed to api-server by kube-dns.
            this.requestOptions.ca = [fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt')]; // the api-server cert stored by default on each pod
            this.requestOptions.rejectUnauthorized = true; // reject the response if we can't validate the ssl cert.
            this.requestOptions.port = 443
        }
    }
}