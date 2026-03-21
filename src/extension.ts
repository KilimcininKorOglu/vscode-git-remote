import * as vscode from 'vscode';
import { RemoteManager } from './remoteManager';
import { StatusBarManager } from './statusBar';

let remoteManager: RemoteManager;
let statusBarManager: StatusBarManager;
let selectedRemoteName: string | undefined;

function refreshStatusBar(): void {
  const remotes = remoteManager.getRemotes();
  statusBarManager.update(remotes, selectedRemoteName);
}

async function selectRemote(): Promise<void> {
  const remotes = remoteManager.getRemotes();

  if (remotes.length === 0) {
    vscode.window.showWarningMessage('No git remotes found.');
    return;
  }

  const items = remotes.map((remote) => ({
    label: remote.name,
    description: remote.url,
    remoteName: remote.name,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a remote to display in the status bar',
  });

  if (selected) {
    selectedRemoteName = selected.remoteName;
    try {
      await remoteManager.setPushDefault(selected.remoteName);
      vscode.window.showInformationMessage(
        `Default push remote set to '${selected.remoteName}'.`
      );
    } catch {
      vscode.window.showErrorMessage('Failed to set default push remote.');
    }
    refreshStatusBar();
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  remoteManager = new RemoteManager();
  statusBarManager = new StatusBarManager();

  context.subscriptions.push(remoteManager, statusBarManager);

  context.subscriptions.push(
    vscode.commands.registerCommand('gitRemote.selectRemote', selectRemote)
  );

  context.subscriptions.push(
    remoteManager.onDidChangeRemotes(() => refreshStatusBar())
  );

  await remoteManager.initialize();
  selectedRemoteName = await remoteManager.getPushDefault();
  refreshStatusBar();
}

export function deactivate(): void {
  // Disposables are handled by context.subscriptions
}
