import { execFile } from "node:child_process";
import { existsSync } from "node:fs";

export function showDialog({ title, message, iconPath, buttons, defaultButton, cancelButton, timeoutSec }) {
  const iconClause = iconPath && existsSync(iconPath)
    ? ` with icon (POSIX file iconPath)`
    : "";
  const cancelClause = cancelButton
    ? ` cancel button cancelBtn`
    : "";

  const script = `on run argv
  set title to item 1 of argv
  set msg to item 2 of argv
  set iconPath to item 3 of argv
  set defaultBtn to item 4 of argv
  set cancelBtn to item 5 of argv
  set btnList to items 6 thru -1 of argv
  try
    set r to display dialog msg with title title buttons btnList default button defaultBtn${cancelClause}${iconClause} giving up after ${timeoutSec}
    if (gave up of r) then return "__TIMEOUT__"
    return button returned of r
  on error
    return "__CANCEL__"
  end try
end run`;

  const args = ["-", title, message, iconPath || "", defaultButton, cancelButton || "", ...buttons];

  return new Promise((resolve) => {
    const child = execFile("/usr/bin/osascript", args, {
      timeout: (timeoutSec + 10) * 1000,
      maxBuffer: 1024 * 1024,
    }, (err, stdout) => {
      if (err) return resolve(null);
      const out = String(stdout).trim();
      if (out === "__TIMEOUT__" || out === "__CANCEL__" || out === "") return resolve(null);
      resolve(out);
    });
    child.stdin.end(script);
  });
}
