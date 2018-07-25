const https = require("https")
const http = require("http")
var fs = require("fs");

// Base class to be used by monitors hitting the kubernetes api.
module.exports = class BaseMonitor {
    constructor(){

        this.requestOptions = {};

        if (process.env.NODE_ENV == "local") {
            // This option is for testing the code locally. Use this to make the app connect to your remote K8s cluster.
            // You have to run "kubectl proxy port=8001" before running the app in this mode.
            this.httpClient = http;
            this.requestOptions.host = "localhost"
            this.requestOptions.port = 8001
        } else {
            // Use https in production env.
            this.httpClient = https;

            // Get the token of the service account stored by K8s on each node and add it to the request header as the Bearer token.
            this.requestOptions.headers = { 'Authorization': "Bearer " + fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", 'utf8') }
            
            // this is routed to api-server by kube-dns.
            this.requestOptions.host = "kubernetes.default.svc" 

            // the api-server cert stored by default on each pod
            this.requestOptions.ca = [fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt')];
            
            // reject the response if we can't validate the ssl cert.
            this.requestOptions.rejectUnauthorized = true;

            this.requestOptions.port = 443
        }
    }
}