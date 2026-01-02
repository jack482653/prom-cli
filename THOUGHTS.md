# 思考紀錄

## 2024-12-31 專案初始化

### Prometheus REST API 調查

- 查詢了 Prometheus 官方文檔，整理出主要 HTTP API 端點
- 決定優先實作五個常用功能：query、query_range、series、labels、targets
- API 基礎路徑為 `/api/v1`，另有 Management API 用於健康檢查和管理

### 專案架構決策

- 使用 pnpm 作為套件管理器
- 採用 TypeScript 開發，搭配 tsx 進行開發時執行
- CLI 框架選用 commander（輕量、文檔完整）
- HTTP 請求使用 axios

### 程式碼風格設定

- 安裝 prettier 統一格式化
- 加入 @trivago/prettier-plugin-sort-imports 自動排序 import
- import 排序規則：Node 內建模組 → 第三方模組 → 本地模組
- trailingComma 設為 "all"（現代 Node.js 支援，git diff 更乾淨）

### 目前專案結構

```
prom-cli/
├── src/index.ts      # CLI 入口點
├── package.json      # type: module, bin: prom
├── tsconfig.json     # ES2022, NodeNext
└── .prettierrc       # 格式化設定
```

### 功能實作狀態

**已完成 (MVP)**

- [x] config - 配置伺服器連線（支援 basic auth / bearer token）
- [x] query - 即時 PromQL 查詢（vector / scalar / string）
- [x] targets - 列出抓取目標狀態
- [x] status - 檢查伺服器健康狀態

**待實作 (Future)**

- [ ] query_range - 範圍查詢（matrix 結果）
- [ ] series - 列出時間序列
- [ ] labels - 列出 label 名稱與值
- [ ] targets filter - 過濾 targets（--job, --state）

## 2024-12-31 專案憲章與規格

### 專案憲章建立

- 建立 `.specify/memory/constitution.md` 定義六大原則
- 原則：Code Quality、Testing Standards、UX Consistency、Performance、MVP First、No Overdesign
- 版本 1.0.0，作為專案開發的指導方針

### Feature Specification 建立

- 執行 `/speckit.specify` 建立 `001-prom-cli-core` feature branch
- 規格定義三個 User Story：配置伺服器 (P1)、執行查詢 (P2)、檢查狀態 (P3)
- MVP 範圍：只實作 instant query，range query 留待後續
- 規格通過 quality checklist 驗證，無需額外澄清

### Clarification 調整

- 調整 User Story 優先順序：P2 改為 targets，P3 改為 query，P4 改為 status
- 新增輸出格式需求：targets 和 query 支援 table 格式（類似 gcloud）

### Implementation Plan 建立

- 執行 `/speckit.plan` 建立實作計畫
- 技術選擇：Node.js + TypeScript + commander + axios
- 專案結構：單一專案，~10 個源文件
- 通過 Constitution Check 所有原則
- 生成文件：research.md, data-model.md, quickstart.md, contracts/cli-commands.md

## 2025-01-02 功能實作完成

### 實作概要

- 執行 `/speckit.tasks` 生成 19 個任務分解
- 執行 `/speckit.implement` 完成所有功能實作
- 採用 TDD/BDD 方式撰寫測試（49 個測試全部通過）

### 完成的功能

- `prom config` - 配置 Prometheus 伺服器連線（支援 basic auth / bearer token）
- `prom targets` - 列出抓取目標狀態（table / JSON 輸出）
- `prom query` - 執行 PromQL 即時查詢（vector / scalar / string 支援）
- `prom status` - 檢查伺服器健康狀態和版本資訊

### 專案結構

```
prom-cli/
├── src/
│   ├── index.ts           # CLI 入口點
│   ├── commands/          # 命令處理器
│   │   ├── config.ts
│   │   ├── targets.ts
│   │   ├── query.ts
│   │   └── status.ts
│   ├── services/          # 業務邏輯
│   │   ├── config.ts      # 配置檔案管理
│   │   └── prometheus.ts  # Prometheus API 客戶端
│   ├── formatters/        # 輸出格式化
│   │   ├── table.ts
│   │   └── json.ts
│   └── types/             # TypeScript 介面
│       └── index.ts
├── tests/                 # 測試檔案
│   ├── config.test.ts
│   ├── formatters.test.ts
│   ├── prometheus.test.ts
│   └── status.test.ts
└── vitest.config.ts
```

### 測試覆蓋

- vitest 作為測試框架
- 49 個單元測試全部通過
- 涵蓋：URL 驗證、配置管理、API 客戶端、格式化輸出
