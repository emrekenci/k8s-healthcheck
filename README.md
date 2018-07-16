# k8s-monitoring-app
A simple app that returns the health statuses of the Kubernetes control-plane components and cluster nodes.

Once deployed inside a Kubernetes cluster, the app will return the statuses of each K8s Master component and the statuses of each node in the cluster.

GET /health should return:

```json
{
    "apiServerHealth": "ok",
    "etcdHealth": "ok",
    "controllerManagerHealth": "ok",
    "schedulerHealth": "ok",
    "nodes": [
        {
            "name": "node-name",
            "status": [
                {
                    "type": "KernelDeadlock",
                    "status": "False",
                    "lastHeartbeatTime": "2018-07-16T09:58:18Z",
                    "lastTransitionTime": "2018-07-11T09:26:36Z",
                    "reason": "KernelHasNoDeadlock",
                    "message": "kernel has no deadlock"
                },
                ...
            ]
        },
        ...
    ]
}
```

## Building the app

```
$ docker build -t <your-repo>/<your-image-name>:<version> .
$ docker push <your-repo>/<your-image-name>:<version>
$ cd kubernetes
$ code .
```

Change the image name in the monitoring-app-deployment.yaml file.

```
$ kubectl apply -f .
```

Get the public IP address of the service created. Got to http://service-public-ip/health

## Authorization, RBAC

If your cluster doesn't have RBAC enabled, you don't need the role-binding (kubernetes/role-binding.yaml). The role-binding gives the default service account in the default namespace cluster-admin rights. You might want to change this.
