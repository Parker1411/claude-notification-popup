#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const MY_DIR = dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;
const HOOK_DIR = join(homedir(), ".claude/hooks/claude-notification-popup");
const SETTINGS = join(homedir(), ".claude/settings.json");
const HOOK_ENTRY = {
  type: "command",
  command: `${NODE} ${join(HOOK_DIR, "hook.mjs")}`,
  timeout: 7200,
};

const FILES = [
  "hook.mjs", "dialog.mjs", "i18n.mjs", "jump.mjs", "claude-icon-rounded.png",
];

function read(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return {}; }
}

function write(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function install() {
  mkdirSync(HOOK_DIR, { recursive: true });
  for (const f of FILES) {
    copyFileSync(join(MY_DIR, f), join(HOOK_DIR, f));
  }

  const cfg = read(SETTINGS);
  if (!cfg.hooks) cfg.hooks = {};
  if (!cfg.hooks.PermissionRequest) cfg.hooks.PermissionRequest = [];

  // 移除旧版本的自身记录，防重复
  for (const group of cfg.hooks.PermissionRequest) {
    if (group.hooks) {
      group.hooks = group.hooks.filter((h) => !h.command.includes("claude-notification-popup"));
    }
  }
  // 移除清空后的空组
  cfg.hooks.PermissionRequest = cfg.hooks.PermissionRequest.filter((g) => g.hooks && g.hooks.length > 0);

  cfg.hooks.PermissionRequest.push({
    matcher: "*",
    hooks: [HOOK_ENTRY],
  });

  write(SETTINGS, cfg);

  console.log(`\n  ✅ 安装完成`);
  console.log(`  📁 脚本: ${HOOK_DIR}`);
  console.log(`  ⚙️  配置: ${SETTINGS}`);
  console.log(`\n  你离开终端时 → 弹窗提醒`);
  console.log(`  你在终端时   → 跳过弹窗\n`);
}

function uninstall() {
  // 删除脚本目录
  if (existsSync(HOOK_DIR)) {
    rmSync(HOOK_DIR, { recursive: true, force: true });
  }

  // 清理 settings.json
  if (existsSync(SETTINGS)) {
    const cfg = read(SETTINGS);
    const hooks = cfg.hooks?.PermissionRequest;
    if (hooks) {
      cfg.hooks.PermissionRequest = hooks
        .map((g) => {
          if (!g.hooks) return g;
          return { ...g, hooks: g.hooks.filter((h) => h.command !== HOOK_ENTRY.command) };
        })
        .filter((g) => g.hooks && g.hooks.length > 0);

      if (cfg.hooks.PermissionRequest.length === 0) {
        delete cfg.hooks.PermissionRequest;
      }
      if (Object.keys(cfg.hooks).length === 0) {
        delete cfg.hooks;
      }
      write(SETTINGS, cfg);
    }
  }

  console.log(`\n  ✅ 已卸载\n`);
}

const cmd = process.argv[2];
if (cmd === "install") install();
else if (cmd === "uninstall") uninstall();
else {
  console.log(`\n  claude-notification-popup\n`);
  console.log(`  用法:`);
  console.log(`    npx github:Parker1411/claude-notification-popup install`);
  console.log(`    npx github:Parker1411/claude-notification-popup uninstall\n`);
}
