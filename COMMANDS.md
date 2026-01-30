# COMMANDS（Agent 必须执行的验证命令）

所有功能交付前，必须执行以下命令，并在回复中给出执行结果摘要。
如果某条命令不适用于当前项目，需要在 Design Gate 阶段说明原因。

---

## 一、前端（如存在）

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
