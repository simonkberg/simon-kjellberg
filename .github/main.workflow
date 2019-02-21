workflow "Test & Build" {
  on = "push"
  resolves = [
    "Build",
    "Test",
  ]
}

action "Install" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  runs = "yarn"
  args = "install"
}

action "Bucklescript" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["Install"]
  runs = "yarn"
  args = "bsb:build"
}

action "Test" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = [
    "Bucklescript",
  ]
  runs = "yarn"
  args = "test"
}

action "Build" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["Install"]
  runs = "yarn"
  args = "build"
}
