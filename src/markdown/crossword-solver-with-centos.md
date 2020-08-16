---
title: "Crossword Solver with CentOS"
featuredImage: "crossword-marjanblan-i9bAvQ57J1k-unsplash.jpg"
description: "Learn how to use CentOS words package for help solving crossword puzzles"
date: "2019-08-25"
category: "centos"
---

If you enjoy crossword puzzles but sometimes get stuck on a devious one, then here's a fun use of the CentOS [words](https://centos.pkgs.org/7/centos-x86_64/words-3.0-22.el7.noarch.rpm.html) package.

If you don't already have a CentOS image running, the following will get you and running quickly. Make sure [Docker](https://www.docker.com/) is installed, then run the following commands in a terminal:

```bash
docker pull centos:7
docker run --name mycentos -d centos:7 tail -f /dev/null
docker exec -it mycentos bash
```

If you exit out of the container and want to come back, run the following to restart it and get back in:

```bash
docker start mycentos
docker exec -it mycentos bash
```