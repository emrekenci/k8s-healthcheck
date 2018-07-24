# k8s-monitoring-app
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
## About the results

The response status code will be 200 if everything is ok. It will be 500 if there is any issue with either one of the master components or any nodes. The result JSON object will be in the response body in either case.

The node results will contain an array element called "problems" if there is any problematic condition with the node.

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

## Caching

The results are stored in memory for 30 seonds by default to prevent abuse & choking the K8s api server. You can change the cache duraction by setting the CACHE_DURATION_IN_SECONDS environment variable.

## Authorization, RBAC

If your cluster doesn't have RBAC enabled, you don't need the role-binding (kubernetes/role-binding.yaml). The role-binding gives the default service account in the default namespace cluster-admin rights. You might want to change this.
