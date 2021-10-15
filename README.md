# vscode-extension-azure-devops

The main objective of this project is to provide a good integration between Azure Devops and VSCode.

## Features

- [ ] Create Pull Request on Azure DevOps
- [ ] List pending Pull Requests created by you
- [ ] List pending Pull Requests assigned to you (requires your approval/attention)
- [ ] List all pending Pull Requests of your projects/repositories
- [ ] Auto-reload the lists described before
- [ ] Notificate when someone creates a new pull request

## Requirements

Azure CLI (tested using 2.28.0... probably would work fine with greater versions).

## Extension Settings

- `azure-devops.enable`: enable/disable this extension

### Commands

- `Azure-Devops: Login`: login to azure devops to initialize all the functions
- `Azure-Devops: Create Pull Request`: creates a pull request from the current branch to the selected target branch
- `Azure-Devops: Reload Pull Request List`: creates a pull request from the current branch to the selected target branch

*Visual Studio Code Extension API Guide `https://code.visualstudio.com/api`*
