import { ExtensionContext, StatusBarAlignment, StatusBarItem, window } from 'vscode';

let statusBarItem: StatusBarItem;

let apmInterval: NodeJS.Timeout;
const rollingWindowMillis = 4000;
const actionTimestamps: number[] = [];

/** VS Code extension entry point */
export function activate(context: ExtensionContext) {
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
  statusBarItem.name = 'VSC APM';
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(window.onDidChangeActiveTextEditor(recordAction)); // typing
  context.subscriptions.push(window.onDidChangeVisibleTextEditors(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorSelection(recordAction));
  // context.subscriptions.push(window.onDidChangeTextEditorVisibleRanges(recordAction));
  // context.subscriptions.push(window.onDidChangeTextEditorOptions(recordAction));
  // context.subscriptions.push(window.onDidChangeTextEditorViewColumn(recordAction));
  // context.subscriptions.push(window.onDidChangeVisibleNotebookEditors(recordAction));
  // context.subscriptions.push(window.onDidChangeActiveNotebookEditor(recordAction));
  // context.subscriptions.push(window.onDidChangeNotebookEditorSelection(recordAction));
  // context.subscriptions.push(window.onDidChangeNotebookEditorVisibleRanges(recordAction));
  context.subscriptions.push(window.onDidChangeActiveTerminal(recordAction));
  context.subscriptions.push(window.onDidOpenTerminal(recordAction));
  context.subscriptions.push(window.onDidCloseTerminal(recordAction));
  context.subscriptions.push(window.onDidChangeTerminalState(recordAction));
  context.subscriptions.push(window.onDidChangeWindowState(recordAction));
  context.subscriptions.push(window.onDidChangeActiveTerminal(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorSelection(recordAction));

  apmInterval = setInterval(() => {
    const val = Math.floor(apm());

    // $(icon_name) is special vsc extension syntax.
    // icons here: https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
    statusBarItem.text = '$(keyboard) ' + val;
  }, 1000);

  statusBarItem.show();
}

/** @returns the user's apm */
function apm(): number {
  const now = Date.now();
  const recentActions = actionTimestamps.filter((ts) => ts > now - rollingWindowMillis);
  const apm = (recentActions.length / 10) * 60;
  return apm;
}

/** records an action in {@link actionTimestamps} */
function recordAction() {
  const now = Date.now();
  actionTimestamps.push(now);

  while (actionTimestamps[0] < now - rollingWindowMillis) {
    actionTimestamps.shift();
  }
}

/** VS Code extension clean up */
export function deactivate() {
  clearInterval(apmInterval);
}
