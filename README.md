## How to start? 第一句话
请先阅读项目根目录下的AGENT.md、ACCEPTANCE.md、COMMANDS.md / 严格遵守其中规则。/本任务先进入 Design Gate，只输出设计方案和测试计划，不要写代码。

```mermaid


U[用户 / 浏览器<br/>Web / Mobile / Desktop]

F[🎨 表现层 Frontend / Product UI<br/>Next.js / React / Tailwind / shadcn / Motion<br/>- 页面路由<br/>- Chat UI / Dashboard<br/>- Streaming UI]

API[🌐 应用层 API (BFF / Web API Layer)<br/>Next route.ts / Hono / Express<br/><br/>Web Middleware:<br/>- Auth<br/>- Rate Limit<br/>- Logging<br/>- Validation<br/>- Error Handler<br/><br/>业务路由:<br/>/chat /vote /stats /admin /models]

BIZ[🧩 业务层 Domain / Business Logic<br/>- Prompt 管理<br/>- 对话流程状态机<br/>- A/B 实验<br/>- 模型路由策略<br/>- 成本控制<br/>- 风控 / 反作弊<br/><br/>Vitest 测试核心逻辑]

AI[🤖 AI 中间件层 AI Middleware<br/>Vercel AI SDK / OpenAI SDK / LangChain<br/>- Streaming<br/>- Tool Calling<br/>- Function Routing<br/>- 多模型适配<br/>- Prompt 模板]

DB[🗄 数据层 Data & Business Model<br/>PostgreSQL (Supabase / Neon)<br/><br/>Tables:<br/>users / sessions / prompts / messages<br/>matches / votes / usage_logs / metrics<br/><br/>SQL / Index / Transaction / RLS]

INFRA[🧱 系统中间件层 Infrastructure Middleware<br/>- Redis (缓存/限流)<br/>- Queue (RabbitMQ / SQS)<br/>- Auth Service (Supabase Auth / Auth.js)<br/>- Object Storage (S3 / R2)<br/>- API Gateway / Nginx]

OBS[📊 可观测与运维层 Observability<br/>- Logging<br/>- Metrics<br/>- Tracing<br/>- Dashboard<br/>- Alert<br/><br/>Grafana / Sentry / PostHog / Prometheus]

U --> F
F --> API
API --> BIZ
BIZ --> AI
AI --> DB
DB --> INFRA
INFRA --> OBS
```

















## How to init your project?
```
npx create-next-app@latest space-dodge --typescript --tailwind --app
cd space-dodge
npm install three @react-three/fiber @react-three/drei zustand
npm install @types/three --save-dev
```


### bugfix
```
>bug0 gameStore.ts 中的状态字段与 Game.tsx 需要的不匹配

›bug1 游戏一片漆黑无法游玩，也没有ui界面，刷新可以出现短暂的加载游戏和丑陋的游戏ui界面，需要分析游戏架构和原  
  因，是不是状态字段不一致导致的，我是不是需要把数据库同步到neon上面

>bug2 游戏parse必须要是playing才能进入 画面一定要被绘制
```