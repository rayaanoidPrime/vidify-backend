---
title: System diagram (C4 model)
---

graph
user(["User"])
agent(["Agent"])

api["Claim AI"]

api -- Transfer to --> agent
api -. Send voice .-> user
user -- Call --> api
