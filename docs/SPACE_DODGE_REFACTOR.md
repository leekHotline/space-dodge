<!-- CODEX RUNNER INSTRUCTIONS (DO NOT REMOVE) -->
You are an autonomous coding agent.
Start with the FIRST unchecked milestone (M0).
Keep working until the LAST milestone is completed.
Do NOT ask questions.
Do NOT stop unless all milestones are done.
For each milestone:
- Modify code
- Run pnpm -s lint, pnpm -s typecheck, pnpm -s build, pnpm -s test
- Fix failures until all pass
- git commit with message "milestone: <id>"
- Mark checkbox [x] in this file
Then continue automatically.
<!-- END CODEX INSTRUCTIONS -->
# Space Dodge 重构方案（Roguelike 原型）

## 0. Commands (source of truth)
- Package manager: pnpm
- Install: pnpm i
- Dev: pnpm dev
- Build: pnpm build
- Lint: pnpm lint
- Typecheck: pnpm typecheck
- Test (vitest): pnpm test  （注意：目前 vitest 已安装但用例可能为空/未接入，必要时用 build/typecheck 作为闸门）

## 1. 目标与范围
- 平台：Web 桌面端浏览器
- 方向：写实科幻 + 像素融合风，商业级质感
- 玩法：Roguelike 循环 + 关卡推进难度递增
- 原型目标：12 道具 + 8 敌人 + 关卡配置 + 掉落 + 记录 run + 排行榜
- 技术：前端 Next.js；后端 API 使用 Next.js `app/api`；数据存储 Neon PostgreSQL

## 2. 体验支柱（Design Pillars）
1) “爽感与压力共存”：早期 5–10 分钟易上手，中后期 20 分钟紧张拉满  
2) “组合驱动成长”：道具组合制造意外强度与策略转变  
3) “视效克制高质”：像素轮廓 + 写实材质的混合质感  
4) “高节奏反馈”：击杀、掉落、连锁、暴击、组合触发都有即时反馈  

## 3. 核心循环（Core Loop）
进入关卡 -> 自动/半自动战斗 -> 掉落与选择 -> 装备组合 -> 推进关卡 -> 记录 run

每局：  
- 关卡 1–3：教学与上手（5–10 min）  
- 关卡 4–7：组合成型（10–15 min）  
- 关卡 8+：高压爬升（15–20+ min）  

## 4. 系统设计（Systems）

### 4.1 玩家与战斗
- 角色属性：HP、护盾、移动速度、射速、暴击、穿透、吸血
- 操作：WASD 移动 + 鼠标指向（可选自动射击）
- 伤害类型：动能、能量、诅咒（影响护盾与抗性）

### 4.2 道具系统（12 个）
分为：
- Buff 时限道具（拾取后触发时长）
- 永久组合型道具（持久生效，可组合触发协同效果）

| ID | 名称(中/英) | 类型 | 主要效果 | 组合提示 |
|---|---|---|---|---|
| I01 | 星核电容 / Star Capacitor | 永久 | 能量伤害+12%，暴击+3% | 与 I07 叠加暴击爆发 |
| I02 | 裂隙喷口 / Rift Thruster | 永久 | 移速+12%，闪避窗口+0.08s | 与 I10 更强机动 |
| I03 | 星图陀螺 / Star Gyro | 永久 | 子弹扩散-20%，精准+15% | 与 I05 形成单点爆发 |
| I04 | 量子镜像 / Quantum Mirror | 永久 | 10% 概率复制子弹 | 与 I08 触发弹幕连锁 |
| I05 | 破城楔 / Siege Spike | 永久 | 对精英/首领伤害+20% | 与 I03 提升单体爆发 |
| I06 | 陨铁铠 / Meteor Armor | 永久 | 护盾上限+30% | 与 I09 稳定容错 |
| I07 | 幽蓝核心 / Azure Core | 永久 | 暴击伤害+35% | 与 I01 暴击体系 |
| I08 | 残响线圈 / Echo Coil | 永久 | 击杀后 1.2s 释放回声弹 | 与 I04 形成连锁 |
| I09 | 生命回路 / Life Circuit | 永久 | 伤害 2% 转化为治疗 | 与 I06 抗压 |
| I10 | 光滑石 / Polished Stone | 永久 | 移动时受到伤害-10% | 与 I02 风筝 |
| I11 | 过载脉冲 / Overload Pulse | Buff 12s | 射速+40%，后继 3s 过热-15% | 与 I03 平衡 |
| I12 | 星疫 / Star Blight | Buff 10s | 命中使敌人腐蚀(DoT) | 与 I05 强化 Boss |

组合规则（原型阶段简化）：  
- 组合型道具之间允许“标签叠加”，满足 2 条触发额外效果  
- 示例：I01(能量) + I07(暴击) => 暴击率额外 +5%  
- 示例：I04(复制) + I08(回声) => 回声弹也可复制（50%）

### 4.3 敌人系统（8 种）
分为空间怪物 + 旧约怪物混搭，强化氛围张力。

| ID | 名称(中/英) | 形态 | 行为 |
|---|---|---|---|
| E01 | 轨道撕裂者 / Orbital Ripper | 空间怪 | 直冲 + 低血量 |
| E02 | 尘环蠕群 / Dust Swarm | 空间怪 | 群体微型，散射 |
| E03 | 虚空鲨 / Void Shark | 空间怪 | 长直冲刺，吃弹减速 |
| E04 | 黯星结节 / Dark Node | 空间怪 | 缓慢漂浮 + 召唤 |
| E05 | 利维坦胚 / Leviathan Spawn | 旧约怪 | 高血量 + 击退 |
| E06 | 审判之眼 / Eye of Judgement | 旧约怪 | 远程射击 |
| E07 | 所多玛烟影 / Sodom Wraith | 旧约怪 | 瞬移 + 追踪 |
| E08 | 旧约司祭 / Old Priest | 旧约怪 | 强化周围敌人 |

### 4.4 掉落与关卡配置
- 掉落由“道具池 + 权重”控制
- 关卡配置包含：敌人权重、精英比例、Boss 出现概率
- “道具池”与“敌人池”在每局开局随机洗牌（Roguelike 变化感）

### 4.5 Run 记录与排行榜
每局结束后记录：分数、通关关卡、击杀数、持续时长、获得道具列表  
排行榜按分数降序，支持 Top 50。

## 5. 美术方向（Art Direction）
- 参考：死亡细胞、The Last Night、镜之边缘、蔚蓝、空洞骑士、小丑牌  
关键特征：  
- 像素轮廓 + 写实材质层（像素描边 + 真实光影渐变）  
- 角色与道具使用“发光线 + 金属质感 + 像素块”混合视觉  
- 背景星云层使用渐变 + 噪点 + 细星粒  
- UI 采用未来仪表盘 + 像素字体辅助  

## 6. 关卡节奏（Pacing）
- 关卡长度：2–3 分钟/关  
- Boss：每 3 关 1 次  
- 怪物密度：每关提升 10–15%  
- 掉落：前 3 关较慷慨，中后期趋于策略抉择

## 7. 数值框架（Numeric Framework）
基础参数（原型）：
- 玩家：HP 120，护盾 60，移速 4.2，射速 0.18s
- 敌人：  
  - 基础血量 40，攻击 12  
  - 精英血量 = 基础 * 2.2  
  - Boss 血量 = 基础 * 40（随关卡线性增长）
- 伤害成长：每关 +8%  
- 掉落率：  
  - 普通敌人 12%  
  - 精英 35%  
  - Boss 必掉 1 个组合型道具  

## 8. 数据与 API 规格

### 8.1 Neon PostgreSQL 表结构（原型）
```sql
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  score INT NOT NULL,
  level_reached INT NOT NULL,
  kills INT NOT NULL,
  duration_sec INT NOT NULL,
  seed TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 8.2 API 端点（原型）
- `GET /api/config`  
  - 返回关卡配置、掉落权重、难度曲线  
- `GET /api/items`  
  - 返回道具池（12 个）  
- `GET /api/enemies`  
  - 返回敌人池（8 个）  
- `POST /api/run`  
  - 提交 run 记录  
- `GET /api/leaderboard`  
  - Top 50 排行榜  

## 9. 里程碑（Milestones）

### M1. 可玩原型（优先）
- 12 道具 + 8 敌人  
- 关卡推进 + 简易掉落  
- Run 记录与排行榜  
- 双语 UI（中/英）

### M2. 玩法强化
- 道具组合触发特效  
- Boss 机制与阶段  
- 高难度关卡与新敌人池

### M3. 商业级完善
- 美术升级（粒子、光效、震动）  
- 完整成长系统与 meta 进度  
- 音效与配乐

## 9.1 Milestone Checklist (for Codex Runner)
- [x] M0: 建立测试闸门与CI级验证命令：确保 pnpm lint / pnpm typecheck / pnpm build 可运行；若 pnpm test 未接入则补一条最小 vitest 用例(1个)让 pnpm test 有效
- [x] M1a: 数据与API（静态版）：实现 /api/items /api/enemies /api/config 三个 GET 端点，返回 12 道具与 8 敌人数据（与文档一致），并在前端能拉取并渲染为调试面板
- [x] M1b: 核心玩法骨架：实现关卡推进（每关2-3分钟配置）、敌人刷新权重、击杀/掉落的基础循环；先用占位SVG素材也可，但结构要可替换
- [ ] M1c: 掉落与选择：实现道具掉落光柱/拾取反馈；关卡结束给出2-3条路线选择（不同关卡配置），路线可汇合
- [ ] M1d: Run 记录：实现 POST /api/run 与 Neon PostgreSQL runs 表接入（migration/初始化说明），能在结束时提交 run（分数/关卡/击杀/时长/seed/items）
- [ ] M1e: Leaderboard：实现 GET /api/leaderboard Top50（按score降序），前端排行榜页面展示
- [ ] M1f: 双语UI最小实现：抽离文案字典（中/英），关键页面（主界面/升级选择/排行榜）可切换语言
- [ ] M2: 道具组合触发：实现至少2条组合规则（I01+I07、I04+I08），并有明显的特效/数值反馈；添加至少2个Boss机制/阶段（可简化）
- [ ] M3: 视效与反馈升级：加入击杀特效/连击反馈/经验条升级戏剧性效果；接入基础音效（可用占位资源）
