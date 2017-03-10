# Web Application

This section describes the web application defined under app/ in the project.

## Overview

A simple read only dashboard displaying the state of the system including
Queue length, Queue entries, etc. The app is static HTML that will run inside
any DAPP browser like Metamask/Mist/Status (although only tested with Metamask
so far). If run outside one of these environments like in an ordinary browser it will try use a public Ethereum RPC endpoint.

## Build

` > npm run build `

## Deploy to ipfs
NOTE: this step assumes a docker container is already running the ipfs daemon.
It can be started like this:

` >  docker run -d --name=ipfs-daemon -v ~/ipfs-stage:/stage ipfs/go-ipfs `

Copy the built app to the staging area then push to ipfs:

```bash
> cp -rf build/ ~/ipfs-stage
> npm run deploy-web
```

Take note of the root hash then navigate to https://gateway.ipfs.io/ipfs/ + [root hash]
