
<div align="center">

# Verilog Design Skill — Claude Code Skill

**把 Verilog 设计规范、流水线模式与 FPGA 优化笔记转成可查询的、本地可引用的知识库，供本地智能代理或脚本调用。**


[![Verilog](https://img.shields.io/badge/Verilog-HDL-orange.svg)](https://en.wikipedia.org/wiki/Verilog)
[![Claude Code Skill](https://img.shields.io/badge/Claude%20Code-Skill-purple.svg)](https://www.anthropic.com/news/skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Zhujian-Liang/verilog-design-skill/blob/main/LICENSE)

</div>

---

## ⚠️ 重要 — 本地使用为主

本 Skill 设计用于本地智能代理或 CLI（例如 Claude Code 本地实例），因为它需要直接访问仓库中文档与可选脚本以返回基于来源的建议和代码片段。在受限沙箱或远端托管环境中，某些功能可能不可用。

## 核心问题

硬件工程师在日常 Verilog 开发中常遇到：
- 在多份参考资料间切换效率低且易丢失上下文
- 检索结果缺乏出处，导致实现/验证出错
- 手动查找接口、时序与资源优化建议耗时

## 解决方案

本 Skill 将仓库内的参考文档结构化为可查询知识库，支持：
- 返回带出处的设计建议与示例代码段
- 推荐工程级优化（时序、资源、可综合性）与反模式提示
- 可选脚本导入外部文档并生成元数据以便检索

```
用户查询 → 本地脚本/代理检索 references/ → 汇总答案并返回出处
```

## 与其它方法对比

| 方法 | 代价 | 设置复杂度 | 幻觉风险 | 可追溯性 |
|------|-----:|-----------:|---------:|--------:|
| 直接把文档喂模型 | 高 | 低 | 高 | 低 |
| 本地 RAG（向量索引） | 中 | 中 | 中 | 中 |
| **本 Skill（本项目）** | 低 | 低 | 低 | 高 |


## 快速安装

把仓库克隆到本地（或将目录复制到你的技能目录）：

```bash
git clone https://github.com/Zhujian-Liang/verilog-design-skill.git
cd verilog-design-skill
```

可选：在 `scripts/` 中添加导入脚本（例如 `add_ref.py`）方便把外部文档复制到 `references/` 并生成元数据。

## 快速开始

1. 把参考文档（Markdown / PDF）放入 `references/`。
2. （可选）运行 `scripts` 中的索引脚本生成轻量索引。
3. 通过本地代理或 CLI 发起查询（示例见下）。

示例查询：

```
query_refs "AXI cross-clock synchronization recommendations"
```

或在你的本地代理中说：

"用 verilog-design-skill 查询关于 ready/valid 流水线的实现示例并给出出处。"


## 主要功能

- **来源驱动的回答**：直接引用 `references/` 中文档的段落或章节
- **设计模式库**：流水线模板、握手接口、跨时钟域同步、复位策略等
- **示例与反模式**：提供可综合的 Verilog 示例并标注风险点
- **工程级建议**：时序收敛策略、资源估算与面积/功耗权衡建议


## 常用命令与脚本（示例）

- `scripts/add_ref.py <path>` — 将外部文档复制到 `references/` 并生成元数据
- `scripts/list_refs.py` — 列出已导入参考文档及标签
- `scripts/query_refs.py "搜索语句"` — 在参考文档中检索并返回答案与出处


## 示例场景

场景 A — 时序收敛：
用户：“我的 AXI 数据通路在 200 MHz 下无法通过静态时序。”
Skill：定位 `fpga-resource-and-timing.md` 中相关章节，返回分阶段优化建议（寄存器均衡、分段注册、约束改进），并提供引用位置。

场景 B — 接口模板：
用户：“给我一个带回压支持的 ready/valid 流水线模板。”
Skill：从 `verilog-pipeline-patterns.md` 返回模板代码片段并标注来源段落。


## 建议的仓库结构

```
verilog-design-skill/
├── SKILL.md
├── README.md
├── scripts/                # 可选：add_ref.py, list_refs.py, query_refs.py
└── references/
    ├── verilog-coding-style.md
    ├── verilog-pipeline-patterns.md
    └── fpga-resource-and-timing.md
```

每个参考文档应包含：问题描述 → 推荐模式 → 反模式 → 示例代码 → 验证建议。


## 技术细节与实现建议

- 文档优先使用 Markdown（便于解析与段落定位），支持 PDF 作为补充。
- 检索可采用 `ripgrep` 或基于标题/段落的简单倒排索引以提高性能。
- 脚本应返回：答案文本 + 来源路径（`references/xxx.md`）+ 段落/章节定位，便于人工复核。


## 限制

- 本 Skill 不是仿真器或综合工具，建议在硬件仿真/综合流程中验证所有建议。
- 答案准确性依赖于 `references/` 中文档质量与覆盖范围。


## 故障排查

- 未被本地代理识别：确认仓库路径和脚本权限，并检查代理加载配置。
- 答案缺少来源：确保 `references/` 文档有清晰标题与可检索段落。
- 脚本报错：在 `scripts/` 中加入日志并独立运行以定位问题。


## 贡献

欢迎 Issue 与 PR：
- 补充设计模式或行业最佳实践
- 添加 Vivado / Quartus 示例工程或仿真测试
- 提供更完善的导入/索引脚本

贡献流程：Fork → 新分支 → PR（请附验证步骤与测试方法）。


## 许可

本项目采用 MIT 协议，参见 `LICENSE`。


## 致谢

感谢开源 FPGA 社区与厂商应用笔记提供的宝贵参考资料。

---


