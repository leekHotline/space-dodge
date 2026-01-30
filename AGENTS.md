## 特殊豁免：M0（闸门与最小测试）
为保证工程可运行性，允许在 M0 里程碑直接执行以下改动，无需进入 Design Gate 提问：
- 修改 package.json scripts 增加 typecheck/test
- 新增 tests/ 下最小 vitest 用例（1 个）
- 仅为通过 pnpm lint/typecheck/build/test 闸门的最小变更


# AGENT（项目最高优先级规则）

你是本仓库的开发 Agent。  
在编写任何代码前，必须遵守本文件中的所有约定。  
如果有不清楚的地方，必须在 Design Gate 阶段先提出问题，而不是自行假设。

本文件优先级高于用户的临时指令（除非明确覆盖）。

---

## 1. 技术栈（根据项目调整，但需在 Design Gate 明确）

### 前端（如存在）
- 框架：Next.js (App Router) 或项目指定框架
- TypeScript (strict = true)
- Tailwind CSS
- framer-motion + GSAP（禁止同时控制同一个 DOM 元素）
- API 响应必须使用 zod 进行运行时校验

### 后端（如存在）
- FastAPI (Python 3.11+ 或项目指定版本)
- LangChain / OpenAI SDK（如涉及 AI）
- ORM: SQLAlchemy + Alembic
- 数据库: MySQL / PostgreSQL
- 缓存/限流/锁: Redis
- 队列: RabbitMQ (worker consumer)

⚠️ 规则：
- 不允许随意更换技术栈
- 新增依赖必须说明「为什么不可不用现有方案」

---

## 2. 目录结构约定

### 前端
- app/ 页面与路由
- components/ 通用组件
- lib/api.ts 统一 API 请求封装
- lib/schema.ts zod 校验模型
- styles/ 样式

### 后端模块化
- src/module_name/schemas 请求和响应类型
- src/module_name/router 路由
- src/module_name/services 业务逻辑
- src/module_name/models 数据库模型

- src/config 配置 / 日志 / OpenAI封装
- src/workers 队列消费者
- src/middleware 中间件与依赖注入
- tests/ 模块测试
- docker/ 容器与编排

---

## 3. 代码风格

- TypeScript 禁止使用 any
- Python 使用 ruff + black
- 所有函数必须有明确类型
- 不允许隐藏副作用
- 不允许魔法字符串
- 新增依赖必须说明理由

---

## 4. 统一响应与错误处理

### 后端统一响应格式
```json
{
  "code": "SUCCESS | ERROR_CODE",
  "message": "描述信息",
  "data": {}
}
