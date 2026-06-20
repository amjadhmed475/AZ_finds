import { execSync, exec } from "child_process";
import { promisify } from "util";
import { platform } from "os";

const execAsync = promisify(exec);

/**
 * Sends an iMessage via macOS Messages.app using AppleScript.
 * Only works on macOS with Messages.app signed into iMessage.
 */
export async function sendIMessage(recipient: string, message: string): Promise<void> {
  if (platform() !== "darwin") {
    throw new Error("iMessage delivery requires macOS. On other platforms use DRY_RUN=true.");
  }

  // Escape for AppleScript: backslash → \\, double-quote → \"
  const escaped = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const script = `
tell application "Messages"
  set targetService to 1st service whose service type = iMessage
  set targetBuddy to buddy "${recipient}" of targetService
  send "${escaped}" to targetBuddy
end tell
`.trim();

  const { stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  if (stderr && !stderr.includes("0:")) {
    throw new Error(`osascript error: ${stderr}`);
  }
}

/**
 * Checks if iMessage can be sent (macOS + Messages.app running).
 */
export function iMessageAvailable(): boolean {
  if (platform() !== "darwin") return false;
  try {
    const result = execSync('pgrep -x "Messages"', { stdio: "pipe" }).toString().trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Opens Messages.app if not already running (macOS only).
 */
export async function ensureMessagesRunning(): Promise<void> {
  if (!iMessageAvailable()) {
    await execAsync("open -a Messages");
    await new Promise(r => setTimeout(r, 2000));
  }
}
