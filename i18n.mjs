export function pickLang() {
  try {
    const raw = process.env.LANG || "";
    return raw.startsWith("zh") ? "zh" : "en";
  } catch {
    return "en";
  }
}

export function labels(lang) {
  if (lang === "zh") {
    return {
      title: "Claude Code - 权限确认",
      back: "返回终端",
      deny: "拒绝",
      once: "允许一次",
      allowTool: (name) => `Claude 想要使用「${name}」，是否允许？`,
      allowAction: "Claude 想要执行以下操作，是否允许？",
    };
  }
  return {
    title: "Claude Code - Permission",
    back: "Back",
    deny: "Deny",
    once: "Allow Once",
    allowTool: (name) => `Allow Claude to use "${name}"?`,
    allowAction: "Allow Claude to proceed?",
  };
}
