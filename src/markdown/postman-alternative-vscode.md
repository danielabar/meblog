---
title: "A VS Code Alternative to Postman"
featuredImage: "../images/rest-aaron-burden-2bg1jPty490-unsplash.jpg"
description: "Looking for a Postman alternative? This VS Code extension could be the answer."
date: "2021-06-13"
category: "Web Development"
---

TODO: Consider two parts:

Part 1: What I don't like about Postman

Part 2: Postman Alternative with VS Code

If you've been doing web development for any length of time, you've probably built or worked on an HTTP REST style API and needed a REST Client to test it. [Postman](https://www.postman.com/product/rest-client/) is a very popular choice and I used to reach for this all the time. However, I'd like to share another tool, a VS Code [extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) that is working better for me, as an alternative to Postman. But first, why not just stick with Postman?

## Context Switching

Postman is a separate application that needs to be downloaded and installed, and is separate from the text editor/IDE for development. This requires a context switch, which creates just enough friction to make me a little irritated. It would be nicer to stay in the editor.

## Team Sharing

If you're working by yourself on a project, then the Postman free tier can be sufficient as there's no need to share collections with anyone else. However, if working on a team, it will require being able to share the collection(s) of HTTP requests and environments configuration (dev, qa, staging, prod, etc.) to test your API. This requires a paid Teams account on Postman. If this is an internal API or something proprietary being built for a client, this means trusting a 3rd party (Postman, the company) with the API, and environment information.

## Backups

As you add more and more requests/collections/environments for your API, you will come to depend on Postman and would lose a lot of work if the data were lost. When working on the free tier, you can backup collections and environments with the Export feature, but that requires manual work. Or Postman encourages account creation, and then your collections and environments are backed up and synced on their servers. While this is certainly convenient, it does raise the 3rd party trust issue as mentioned earlier.

## Version Control

## Secrets Management

## VS Code REST Client