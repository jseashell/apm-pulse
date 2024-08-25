import {
  commands,
  ConfigurationChangeEvent,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  window,
  workspace,
} from 'vscode';

/** the ui element */
let statusBarItem: StatusBarItem;
/** update {@link statusBarItem} on an interval. cleaned up on deactivations */
let interval: NodeJS.Timeout;
/** counts total actions over lifespan of VSC window */
const totals = { start: 0, actions: 0 };
/** list of timestamp millis recorded when a valid action was made */
const rollingActionTimestamps: number[] = [];
/** previous n millis in which to calculate actions per minute */
const rollingWindow = 4000;

/**
 * VS Code extension entry point
 */
export function activate(context: ExtensionContext) {
  // Record the beginning of execution
  totals.start = Date.now();

  // Setup command palette
  context.subscriptions.push(commands.registerCommand('apm-pulse.resetTotals', resetTotals));
  context.subscriptions.push(commands.registerCommand('apm-pulse.showTotals', showTotalsInformationMessage));

  // Setup extension settings
  context.subscriptions.push(workspace.onDidChangeConfiguration((event) => handleConfigChanges(event)));

  // Create the UI
  const config = workspace.getConfiguration('apm-pulse');
  const alignOpt = config.get('alignment');
  statusBarItem = window.createStatusBarItem(alignOpt == 'Right' ? StatusBarAlignment.Right : StatusBarAlignment.Left);
  statusBarItem.name = 'APM Pulse';

  // Setup change events
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(window.onDidChangeActiveTextEditor(recordAction));
  context.subscriptions.push(window.onDidChangeVisibleTextEditors(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorSelection(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorVisibleRanges(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorOptions(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorViewColumn(recordAction));
  context.subscriptions.push(window.onDidChangeActiveTerminal(recordAction));
  context.subscriptions.push(window.onDidOpenTerminal(recordAction));
  context.subscriptions.push(window.onDidCloseTerminal(recordAction));
  context.subscriptions.push(window.onDidChangeTerminalState(recordAction));
  context.subscriptions.push(window.onDidChangeWindowState(recordAction));
  context.subscriptions.push(window.onDidChangeActiveTerminal(recordAction));
  context.subscriptions.push(window.onDidChangeTextEditorSelection(recordAction));

  // Setup 1s interval to update the UI
  interval = setInterval(() => {
    const val = Math.floor(apm());
    statusBarItem.text = '$(keyboard) ' + val; // $(icon_name) is vsc syntax. icons here: https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
  }, 1000);

  // Show the UI. Do this last.
  statusBarItem.show();
}

/**
 * Resets counters for total stats
 */
function resetTotals() {
  totals.actions = 0;
  totals.start = Date.now();
}

/**
 * Shows a info message containing total stats
 */
function showTotalsInformationMessage() {
  let time: string;
  const ms = Date.now() - totals.start;

  if (ms > 90000) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) {
      time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    const totalApm = totals.actions / (ms / 1000 / 60);
    window.showInformationMessage(`${Math.floor(totalApm)} APM over ${time}`);
  } else {
    const diff = (90000 - ms) / 1000;
    window.showInformationMessage(`Too soon! Wait ${Math.ceil(diff)}s...`);
  }
}

/**
 * Records an action to {@link rollingActionTimestamps}.
 * Removes stale actions outside the {@link rollingWindow}.
 */
function recordAction(): void {
  totals.actions++;

  const now = Date.now();
  rollingActionTimestamps.push(now);

  while (rollingActionTimestamps[0] < now - rollingWindow) {
    rollingActionTimestamps.shift();
  }
}

/**
 * @returns the user's apm
 */
function apm(): number {
  const now = Date.now();
  const recentActions = rollingActionTimestamps.filter((ts) => ts > now - rollingWindow);
  const apm = (recentActions.length / 10) * 60;
  return apm;
}

/**
 * Handles extension settings updates during runtime
 * @param event config change event
 */
function handleConfigChanges(event: ConfigurationChangeEvent): void {
  if (event.affectsConfiguration('apm-pulse.alignment')) {
    const alignOpt = workspace.getConfiguration('apm-pulse').get('alignment');
    if (statusBarItem) statusBarItem.dispose();
    statusBarItem = window.createStatusBarItem(
      alignOpt == 'Right' ? StatusBarAlignment.Right : StatusBarAlignment.Left,
    );
    statusBarItem.show();
  }
}

/**
 * VS Code extension clean up
 */
export function deactivate(): void {
  clearInterval(interval);
}
