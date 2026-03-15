import * as vscode from 'vscode';
import { RemoteInfo } from './remoteManager';

export class StatusBarManager implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.show();
  }

  update(remotes: RemoteInfo[], selectedRemoteName: string | undefined): void {
    if (remotes.length === 0) {
      this.statusBarItem.text = '$(warning) No Remote';
      this.statusBarItem.tooltip = 'No git remote configured';
      this.statusBarItem.command = undefined;
      return;
    }

    const activeRemote = selectedRemoteName
      ? remotes.find((r) => r.name === selectedRemoteName)
      : remotes[0];

    const remote = activeRemote || remotes[0];

    this.statusBarItem.text = `$(globe) ${remote.url}`;
    this.statusBarItem.tooltip = `Remote: ${remote.name}\n${remote.url}`;

    if (remotes.length > 1) {
      this.statusBarItem.command = 'gitRemote.selectRemote';
      this.statusBarItem.tooltip += '\n\nClick to select a different remote';
    } else {
      this.statusBarItem.command = undefined;
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
