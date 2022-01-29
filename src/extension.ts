// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as azdev from "azure-devops-node-api";
import * as open from 'open';
import * as fs from 'fs';
import { DepNodeProvider } from './nodeDependencies';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { GitPullRequestSearchCriteria } from 'azure-devops-node-api/interfaces/GitInterfaces';

async function readFileAsync(filename: fs.PathLike): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, (err, buffer) => {
			if (err) {
				return reject(err);
			}
			return resolve(buffer);
		});
	});
};

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

	const myPullRequestsProvider = new DepNodeProvider();
	vscode.window.registerTreeDataProvider('myPullRequests', myPullRequestsProvider);

	const reviewingPullRequestsProvider = new DepNodeProvider();
	vscode.window.registerTreeDataProvider('reviewingPullRequests', reviewingPullRequestsProvider);

	const allPullRequestsProvider = new DepNodeProvider();
	vscode.window.registerTreeDataProvider('allPullRequests', allPullRequestsProvider);

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

		let repoName, branch;

		if (vscode.workspace.workspaceFolders) {
			try {
				// repository name
				const splitedPath = vscode.workspace.workspaceFolders[0].uri.path.split("/");
				repoName = splitedPath[splitedPath.length - 1];

				// branch
				const gitHeadFilePath = vscode.workspace.workspaceFolders[0].uri.path + "/.git/HEAD";
				const content = await readFileAsync(gitHeadFilePath);
				const splitedContent = content.toString().split("refs/heads/");
				branch = splitedContent[splitedContent.length - 1].split("\n")[0];
			} catch (err) {
				// no problem
			}
		}

		const repositoryName = await vscode.window.showInputBox({
			title: "Repository Name",
			placeHolder: "Repository Name",
			value: repoName
		});

		if (!repositoryName) {
			return;
		}

		const sourceBranch = await vscode.window.showInputBox({
			title: "Source Branch",
			placeHolder: "Source Branch",
			value: branch
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

	async function loadPRs(git: IGitApi, gitPullRequestSearchCriteria: GitPullRequestSearchCriteria, provider: DepNodeProvider) {
		let myPullRequests = await git.getPullRequestsByProject((azureProject as string), gitPullRequestSearchCriteria);

		provider.elements = myPullRequests.map((each) => {
			return {
				"id": each.pullRequestId,
				"repository": each.repository?.name,
				"creator": each.createdBy?.displayName,
				"link": azureOrg + "/" + encodeURIComponent(azureProject as string) + "/_git/" + each.repository?.name + "/pullrequest/" + each.pullRequestId,
				"targetBranch": each.targetRefName?.replace("refs/heads/", ""),
				"sourceBranch": each.sourceRefName?.replace("refs/heads/", ""),
				"title": each.title
			};
		});

		provider.refresh();
	}

	async function reloadPRs() {
		if (!azureOrg || !azureProject || !azurePAT) {
			vscode.window.showWarningMessage('You need to login to Azure DevOps first.');
			return;
		}

		try {
			let authHandler = azdev.getPersonalAccessTokenHandler(azurePAT);
			let connection = new azdev.WebApi(azureOrg, authHandler);
			let connectionData = await connection.connect();

			if (!connectionData.authenticatedUser) {
				vscode.window.showWarningMessage('You need to login to Azure DevOps first.');
				return;
			}

			let git = await connection.getGitApi();


			await Promise.all([
				loadPRs(git, { creatorId: connectionData.authenticatedUser.id }, myPullRequestsProvider),
				loadPRs(git, { reviewerId: connectionData.authenticatedUser.id }, reviewingPullRequestsProvider),
				loadPRs(git, {}, allPullRequestsProvider),
			]);

		} catch (err) {
			console.error(err);
			vscode.window.showErrorMessage((err as Error).message);
		}

	}

	const getPullRequest = vscode.commands.registerCommand('azure-devops.getPullRequest', reloadPRs);

	const openPullRequestOnBrowser = vscode.commands.registerCommand('azure-devops.openPullRequestOnBrowser', async (link) => {
		open(link);
	});


	context.subscriptions.push(login);
	context.subscriptions.push(createPullRequest);
	context.subscriptions.push(getPullRequest);
	context.subscriptions.push(openPullRequestOnBrowser);

	await reloadPRs();

}

// this method is called when your extension is deactivated
export function deactivate() { }
