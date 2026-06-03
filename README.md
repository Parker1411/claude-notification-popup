# claude-notification-popup

你在电脑前就不打扰，你走开了再弹窗。

## 怎么装

```bash
npx github:Parker1411/claude-notification-popup install
```

## 怎么卸

```bash
npx github:Parker1411/claude-notification-popup uninstall
```

## 什么时候弹

| 场景 | 行为 |
|------|------|
| 你在终端前面 | 不弹窗，终端原生菜单处理 |
| 你在看别的 | macOS 对话框居中弹出 |

## 文件

| 文件 | 作用 |
|------|------|
| hook.mjs | 主逻辑 |
| dialog.mjs | 系统弹窗 |
| jump.mjs | 切回终端 |
| i18n.mjs | 中英文 |
| cli.mjs | 安装卸载 |
