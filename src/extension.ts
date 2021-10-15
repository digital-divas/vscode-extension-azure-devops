// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as azdev from "azure-devops-node-api";
import * as open from 'open';
import { DepNodeProvider } from './nodeDependencies';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	let azurePAT: string | undefined;
	let azureOrg: string | undefined;
	let azureProject: string | undefined;

	const azurePATKey = context.extension.id + '.azure_pat';
	const azureOrgKey = context.extension.id + '.azure_org_key';
	const azureProjectKey = context.extension.id + '.azure_project_key';
	context.globalState.setKeysForSync([azurePATKey, azureOrgKey, azureProjectKey]);

	azurePAT = context.globalState.get(azurePATKey);
	azureOrg = context.globalState.get(azureOrgKey);
	azureProject = context.globalState.get(azureProjectKey);

	console.log("azurePAT", azurePAT);
	console.log("azureOrgKey", azureOrg);
	console.log("azureProject", azureProject);

	const login = vscode.commands.registerCommand('azure-devops.login', async () => {

		let input;

		input = await vscode.window.showInputBox({
			title: "Azure Organization URI",
			placeHolder: "Azure Organization URI",
			value: "https://dev.azure.com/yourorganization",
		});

		if (input) {
			azureOrg = input;
			context.globalState.update(azureOrgKey, azureOrg);
		}

		input = await vscode.window.showInputBox({
			title: "Azure Project Name",
			placeHolder: "Azure Project Name"
		});

		if (input) {
			azureProject = input;
			context.globalState.update(azureProjectKey, azureProject);
		}

		input = await vscode.window.showInputBox({
			title: "Azure DevOps Personal Access Token",
			placeHolder: "Azure DevOps Personal Access Token"
		});

		if (input) {
			azurePAT = input;
			context.globalState.update(azurePATKey, azurePAT);
		}

	});

	const createPullRequest = vscode.commands.registerCommand('azure-devops.createPullRequest', async () => {

		if (!azureOrg || !azureProject || !azurePAT) {
			vscode.window.showWarningMessage('You need to login to Azure DevOps first.');
			return;
		}

		const repositoryName = await vscode.window.showInputBox({
			title: "Repository Name",
			placeHolder: "Repository Name",
			value: "zowee-firmware"
		});

		if (!repositoryName) {
			return;
		}

		const sourceBranch = await vscode.window.showInputBox({
			title: "Source Branch",
			placeHolder: "Source Branch",
			value: "stage"
		});

		if (!sourceBranch) {
			return;
		}

		const targetBranch = await vscode.window.showInputBox({
			title: "Target Branch",
			placeHolder: "Target Branch",
			value: "stage"
		});

		if (!targetBranch) {
			return;
		}

		try {
			let authHandler = azdev.getPersonalAccessTokenHandler(azurePAT);
			let connection = new azdev.WebApi(azureOrg, authHandler);

			let git = await connection.getGitApi();

			const repositories = await git.getRepositories(azureProject, false, false, false);
			const repository = repositories.filter((each) => each.name === repositoryName)[0];

			if (repository.id) {
				const gitpullrequest = await git.createPullRequest({
					targetRefName: "refs/heads/" + targetBranch,
					sourceRefName: "refs/heads/" + sourceBranch,
					title: sourceBranch,
					repository: repository,
				}, repository.id, azureProject, true);
				const link = gitpullrequest.repository?.webUrl + "/pullrequest/" + gitpullrequest.pullRequestId;
				const thenable = await vscode.window.showInformationMessage("Pull request succefully created! ", {}, { title: "Open on Browser" });
				if (thenable && thenable.title === "Open on Browser") {
					open(link);
				}

			}

		} catch (err) {
			console.error(err);
			vscode.window.showErrorMessage((err as Error).message);
		}

	});

	context.subscriptions.push(login);
	context.subscriptions.push(createPullRequest);

	const nodeDependenciesProvider = new DepNodeProvider("/mnt/5cb80605-c86e-4351-b941-96d1cb6eadab/Documents/Projects/vscode-extension-azure-devops");
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

}

// this method is called when your extension is deactivated
export function deactivate() { }
