import * as vscode from 'vscode';

interface GitRemoteSource {
  readonly name: string;
  readonly fetchUrl?: string;
  readonly pushUrl?: string;
}

interface GitRepository {
  readonly state: {
    readonly remotes: GitRemoteSource[];
    readonly onDidChange: vscode.Event<void>;
  };
}

interface GitApi {
  readonly repositories: GitRepository[];
  readonly onDidOpenRepository: vscode.Event<GitRepository>;
  readonly onDidCloseRepository: vscode.Event<GitRepository>;
}

export interface RemoteInfo {
  readonly name: string;
  readonly url: string;
}

export class RemoteManager implements vscode.Disposable {
  private gitApi: GitApi | undefined;
  private disposables: vscode.Disposable[] = [];
  private readonly onDidChangeRemotesEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeRemotes = this.onDidChangeRemotesEmitter.event;

  async initialize(): Promise<void> {
    const gitExtension = vscode.extensions.getExtension<{ getAPI(version: number): GitApi }>('vscode.git');

    if (!gitExtension) {
      return;
    }

    if (!gitExtension.isActive) {
      await gitExtension.activate();
    }

    this.gitApi = gitExtension.exports.getAPI(1);

    if (this.gitApi.repositories.length > 0) {
      this.watchRepository(this.gitApi.repositories[0]);
    }

    this.disposables.push(
      this.gitApi.onDidOpenRepository((repo) => {
        this.watchRepository(repo);
        this.onDidChangeRemotesEmitter.fire();
      }),
      this.gitApi.onDidCloseRepository(() => {
        this.onDidChangeRemotesEmitter.fire();
      })
    );
  }

  private watchRepository(repo: GitRepository): void {
    this.disposables.push(
      repo.state.onDidChange(() => {
        this.onDidChangeRemotesEmitter.fire();
      })
    );
  }

  getRemotes(): RemoteInfo[] {
    if (!this.gitApi || this.gitApi.repositories.length === 0) {
      return [];
    }

    const repo = this.gitApi.repositories[0];
    return repo.state.remotes
      .filter((remote) => remote.fetchUrl || remote.pushUrl)
      .map((remote) => ({
        name: remote.name,
        url: remote.fetchUrl || remote.pushUrl || '',
      }));
  }

  dispose(): void {
    this.onDidChangeRemotesEmitter.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
