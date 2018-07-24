# k8s-healthcheck
A simple app that returns the health statuses of the Kubernetes control-plane components and cluster nodes.

Once deployed inside a Kubernetes cluster, the app will return the statuses of each K8s Master component and the statuses of each node in the cluster.

GET http://service-public-ip/healthz returns the below JSON object:

```json
{
    "apiServer": "ok",
    "etcd": "ok",
    "controllerManager": "ok",
    "scheduler": "ok",
    "nodes": [
        {
            "name": "node-1",
            "status": "ok"
        },
        {
            "name": "node-2",
            "status": "ok"
        },
        {
            "name": "node-3",
            "status": "ok"
        }
    ],
    "lastCheckAt": "2018-07-19T20:19:10.308Z"
}
```
## Results

The result of a healthcheck is the json body as shown above and the status code.

### 200, everything is ok

If everything we're checking is "ok" then the response status code will be 200.

### 502, somethings in the cluster are not right

If any item we're checking is "nok" then the response status code will be 502 (Bad Gateway). The body will contain the json object as shown above which will show you what's wrong.

If there is an issue with one of the nodes, the "node" object in the result will contain an array called "problems" containing the details of the issue as reported by the k8s api-server.

### 500, the app is throwing errors

This will tell you that the healthcheck app itself is throwing some errors. This might still show a health issue with the cluster but it's likely a configuration issue or a bug in the code.

## Building the app

```
$ docker build -t <your-repo>/<your-image-name>:<version> .
$ docker push <your-repo>/<your-image-name>:<version>
$ cd kubernetes
$ code .
```

Change the image name in the monitoring-app-deployment.yaml file, then:

```
$ kubectl apply -f .
```

Get the public IP address of the service created. Got to http://service-public-ip/healthz

## Configuration

The app is configured to use basic auth. You have to set the USERNAME and PASSWORD environment variables. Kubernetes deployment config file already contans these.

## Testing locally

If you want to connect the app to your remote K8s cluster while debugging the app, set the NODE_ENV variable to "local" and the do a 

```
$ kubectl proxy port=8001
```

And run the app.

## Caching

The results are stored in memory for 30 seonds by default to prevent abuse & choking the K8s api server. You can change the cache duraction by setting the CACHE_DURATION_IN_SECONDS environment variable.

## Authorization, RBAC

If your cluster doesn't have RBAC enabled, you don't need the role-binding (kubernetes/role-binding.yaml). The role-binding gives the default service account in the default namespace cluster-admin rights. You might want to change this.
