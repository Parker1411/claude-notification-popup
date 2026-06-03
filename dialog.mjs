import { execFile } from "node:child_process";
import { existsSync } from "node:fs";

export function showDialog({ title, message, iconPath, buttons, defaultButton, cancelButton, timeoutSec }) {
  const cancelClause = cancelButton ? ` cancel button "${cancelButton}"` : "";
  const iconClause = iconPath && existsSync(iconPath) ? ` with icon (POSIX file "${iconPath}")` : "";
  const btnList = buttons.map((b) => `"${b}"`).join(", ");

  const script = `
on run
  try
    set r to display dialog "${message}" with title "${title}" buttons {${btnList}} default button "${defaultButton}"${cancelClause}${iconClause} giving up after ${timeoutSec}
    if (gave up of r) then return "__TIMEOUT__"
    return button returned of r
  on error
    return "__CANCEL__"
  end try
end run
`;

  return new Promise((resolve) => {
    const child = execFile("/usr/bin/osascript", ["-"], {
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
