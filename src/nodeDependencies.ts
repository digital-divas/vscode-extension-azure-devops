import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {

    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
    elements: any[] = [];

    constructor() {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (element) {
            return Promise.resolve([
                new Dependency("Title", element.props.title, {}, vscode.TreeItemCollapsibleState.None),
                new Dependency("Author", element.props.creator, {}, vscode.TreeItemCollapsibleState.None),
                new Dependency("Click here to open", "", {}, vscode.TreeItemCollapsibleState.None, {
                    title: "openPullRequestOnBrowser",
                    command: "azure-devops.openPullRequestOnBrowser",
                    arguments: [element.props.link]
                })
            ]);
        }
        const elements = this.elements.map((each) => new Dependency(each.repository, each.targetBranch, each, vscode.TreeItemCollapsibleState.Expanded));
        return Promise.resolve(elements);


    }

}

export class Dependency extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        private readonly version: string,
        public readonly props: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
        this.props;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

    contextValue = 'dependency';
}