import { execSync } from "node:child_process";

function findTerminalTty() {
  let pid = String(process.pid);
  for (let i = 0; i < 20; i++) {
    try {
      const tty = execSync(`ps -o tty= -p ${pid}`, { encoding: "utf8" }).trim();
      if (tty && tty !== "?" && tty !== "??") return `/dev/${tty}`;
    } catch {}
    try {
      pid = execSync(`ps -o ppid= -p ${pid}`, { encoding: "utf8" }).trim();
    } catch { break; }
    if (pid === "0" || pid === "1") break;
  }
  return "";
}

const APPLESCRIPT = `
on run {tty, bid}
  tell application "System Events" to set procs to name of every process

  if procs contains "iTerm2" then
    try
      tell application "iTerm2"
        repeat with w in windows
          repeat with t in tabs of w
            repeat with s in sessions of t
              if tty of s is tty then
                tell w to select
                tell t to select
                activate
                return
              end if
            end repeat
          end repeat
        end repeat
      end tell
    end try
  end if

  if procs contains "Terminal" then
    try
      tell application "Terminal"
        repeat with w in windows
          repeat with t in tabs of w
            if tty of t is tty then
              set selected tab of w to t
              set frontmost of w to true
              activate
              return
            end if
          end repeat
        end repeat
      end tell
    end try
  end if

  if bid is not "" then
    try
      tell application id bid to activate
    end try
  end if
end run
`;

export function jumpToTerminal() {
  const tty = findTerminalTty();
  const bid = process.env.__CFBundleIdentifier || "";
  if (!tty && !bid) return;

  try {
    execSync(`osascript -e ${JSON.stringify(APPLESCRIPT)} -- ${tty} ${bid}`, {
      timeout: 5000,
      stdio: "ignore",
    });
  } catch {}
}
