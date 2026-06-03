import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { showDialog } from "./dialog.mjs";
import { pickLang, labels } from "./i18n.mjs";
import { jumpToTerminal } from "./jump.mjs";

const MY_DIR = dirname(fileURLToPath(import.meta.url));

const ALLOW = JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "allow" } } });
const DENY = JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "deny" } } });

const SKIP_TOOLS = new Set(["AskUserQuestion", "ExitPlanMode", "TodoWrite", "TodoRead"]);
const TERMINAL_APPS = ["Terminal", "iTerm2", "Claude", "Visual Studio Code", "Warp", "Ghostty"];
const DIALOG_TIMEOUT = 120;

function readStdin() {
  return new Promise((done) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { buf += chunk; });
    process.stdin.on("end", () => done(buf));
    process.stdin.on("error", () => done(""));
  });
}

function frontmostIsTerminal() {
  try {
    const app = execSync(
      `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
      { encoding: "utf8", timeout: 3000 }
    ).trim();
    return TERMINAL_APPS.some((name) => app.includes(name));
  } catch {
    return false;
  }
}

async function main() {
  let input = {};
  try { input = JSON.parse((await readStdin()) || "{}"); } catch { input = {}; }

  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};

  if (SKIP_TOOLS.has(toolName)) return;

  // 正在看终端 → 不弹窗，交给 Claude 原生菜单
  if (frontmostIsTerminal()) return;

  const lang = labels(pickLang());

  let msg = toolName ? lang.allowTool(toolName) : lang.allowAction;
  const detail = String(toolInput.command ?? toolInput.file_path ?? toolInput.url ?? "").slice(0, 240);
  if (detail) msg += `\n\n${detail}`;

  const clicked = await showDialog({
    title: lang.title,
    message: msg,
    iconPath: join(MY_DIR, "claude-icon-rounded.png"),
    buttons: [lang.back, lang.deny, lang.once],
    defaultButton: lang.once,
    cancelButton: lang.back,
    timeoutSec: DIALOG_TIMEOUT,
  });

  if (clicked === null || clicked === lang.back) {
    jumpToTerminal();
    return;
  }
  if (clicked === lang.deny) {
    process.stdout.write(DENY);
    return;
  }
  process.stdout.write(ALLOW);
}

main().catch(() => process.exit(0));
