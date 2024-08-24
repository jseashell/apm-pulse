import { commands, ExtensionContext, StatusBarAlignment, StatusBarItem, window } from 'vscode';

let statusBarItem: StatusBarItem;
let actionCounter = 0;

let start: Date;
let apmInterval: NodeJS.Timeout;

export function activate(context: ExtensionContext) {
  start = new Date();

  const commandId = 'vsc-apm.apm';
  context.subscriptions.push(
    commands.registerCommand(commandId, () => {
      const apm = calculate();
      window.showInformationMessage(`${apm} APM!
`);
    }),
  );

  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
  statusBarItem.command = commandId;
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(window.onDidChangeActiveTextEditor(tick));
  // context.subscriptions.push(window.onDidChangeVisibleTextEditors(tick));
  // context.subscriptions.push(window.onDidChangeTextEditorSelection(tick));
  // context.subscriptions.push(window.onDidChangeTextEditorVisibleRanges(tick));
  // context.subscriptions.push(window.onDidChangeTextEditorOptions(tick));
  // context.subscriptions.push(window.onDidChangeTextEditorViewColumn(tick));
  // context.subscriptions.push(window.onDidChangeVisibleNotebookEditors(tick));
  // context.subscriptions.push(window.onDidChangeActiveNotebookEditor(tick));
  // context.subscriptions.push(window.onDidChangeNotebookEditorSelection(tick));
  // context.subscriptions.push(window.onDidChangeNotebookEditorVisibleRanges(tick));
  // context.subscriptions.push(window.onDidChangeActiveTerminal(tick));
  // context.subscriptions.push(window.onDidOpenTerminal(tick));
  // context.subscriptions.push(window.onDidCloseTerminal(tick));
  // context.subscriptions.push(window.onDidChangeTerminalState(tick));
  // context.subscriptions.push(window.onDidChangeWindowState(tick));
  // context.subscriptions.push(window.onDidChangeActiveTerminal(tick));
  // context.subscriptions.push(window.onDidChangeTextEditorSelection(tick));

  apmInterval = setInterval(() => {
    const apm = calculate();
    const time = formatMilliseconds(start.getTime());
    statusBarItem.text = '$(keyboard)  ' + Math.floor(apm) + ' (' + time + ')';
  }, 1000);

  statusBarItem.show();
}

function formatMilliseconds(ms: number) {
  const hours = Math.floor(ms / 3600000); // 1 hour = 3600000 milliseconds
  const minutes = Math.floor((ms % 3600000) / 60000); // Remaining minutes
  const seconds = Math.floor((ms % 60000) / 1000); // Remaining seconds

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

export function deactivate() {
  clearInterval(apmInterval);
}

const actionTimestamps: number[] = [];
const rollingWindowMillis = 60000;

function tick() {
  const now = Date.now();
  actionTimestamps.push(now);

  while (actionTimestamps[0] < now - rollingWindowMillis) {
    actionTimestamps.shift();
  }
}

function calculate(): number {
  const now = Date.now();
  const recentActions = actionTimestamps.filter((ts) => ts > now - rollingWindowMillis);
  const apm = (recentActions.length / (rollingWindowMillis / 1000)) * 60;
  return apm;
}
