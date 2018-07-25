# k8s-healthcheck
A simple app that returns the health statuses of the Kubernetes control-plane components, cluster nodes and your deployments.

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
    "deployments": [
        {
            "name": "healthcheck-app",
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

Likewise, the "deployment" object in the result will contain the condition of the deployment if it's "nok". The app is checking both "Available" and "Progressing" conditions of a [deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) and will report "nok" if either one is false.

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

Sample config file for the app:

``` json
"env": {
    "USERNAME": "admin",
    "PASSWORD": "password",
    "CACHE_DURATION_IN_SECONDS": "10",
    "NODE_ENV": "production",
    "DEPLOYMENTS_NAMESPACE": "default",
    "EXCLUDE": ""
}
```

### API Authorization

The app is configured to use basic auth. You have to set the USERNAME and PASSWORD environment variables. Kubernetes deployment config file already contans these.

### Caching

The results are stored in memory for 30 seonds by default to prevent abuse & choking the K8s api server. You can change the cache duration by setting the CACHE_DURATION_IN_SECONDS environment variable.

### Testing locally

If you want to connect the app to your remote K8s cluster while debugging the app, set the NODE_ENV variable to "local" and then: 

```
$ kubectl proxy port=8001
```

...and run the app. It will give you the healthcheck of your remote K8s cluster on localhost:5000/healthz

### Deployment namespaces

The app will get the status of the deployments in the "default" namespace by default. If you want to monitor the status of the deployments in another namespace, you need to provide it to the app via the DEPLOYMENTS_NAMESPACE environment variable.

### Excluding some checks

You can make the app "not" check some items and exclude them from the result by configuration. To do this, use EXCLUDE environment variable.

The value must be string deliminated. Add the property name you want to exclude as you see it in the result json.

```
"EXCLUDE": "apiServer,etcd,controllerManager,scheduler,nodes,deployments"
```

## Authorization, RBAC

If your cluster doesn't have RBAC enabled, you don't need the role-binding (kubernetes/role-binding.yaml). The role-binding gives the default service account in the default namespace cluster-admin rights. You might want to change this.

## Running on managed clusters (AKS, GKE, EKS)

The app will run without any issues on GKE and EKS.

AKS clusters do not expose the healthcheck endpoints of controller-manager and scheduler components. To use on AKS you need to exclude these by configuration.

```
"EXCLUDE": "controllerManager,scheduler"
```


