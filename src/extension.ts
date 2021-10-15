// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DepNodeProvider, Dependency } from './nodeDependencies';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "azure-devops" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('azure-devops.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const value = await vscode.window.showInputBox();
		console.log(value);
		vscode.window.showInformationMessage('Hello World from Azure DevOps!');
	});

	const nodeDependenciesProvider = new DepNodeProvider("/mnt/5cb80605-c86e-4351-b941-96d1cb6eadab/Documents/Projects/vscode-extension-azure-devops");
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);

	// vscode.window.createTreeView("nodeDependencies", { treeDataProvider: nodeDependenciesProvider, canSelectMany: false, showCollapseAll: false });

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
