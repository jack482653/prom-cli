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

- [x] query_range - 範圍查詢（matrix 結果）✅ 2025-01-03 完成 (PR #2)
- [x] labels - 列出 label 名稱與值 ✅ 2025-01-05 完成 (PR #3)
- [x] series - 列出時間序列 ✅ 2025-02-03 完成 (PR #4)
- [x] targets filter - 過濾 targets（--job, --state）✅ 2025-02-03 完成

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

## 2025-01-05 Labels 功能實作

### 實作概要

- 執行 `/speckit.specify` 建立 004-labels 規格
- 執行 `/speckit.plan` 建立實作計畫
- 執行 `/speckit.tasks` 生成 32 個任務
- 執行 `/speckit.implement` 完成所有功能

### 完成的功能

- `prom labels` - 列出所有 label 名稱
- `prom labels <name>` - 列出特定 label 的所有值
- `--json` 支援 JSON 輸出格式
- `--start` / `--end` 支援時間範圍過濾

### API 端點

- `/api/v1/labels` - 取得所有 label 名稱
- `/api/v1/label/<name>/values` - 取得特定 label 的值

### 技術決策

- 重用 time-parser.ts 處理時間表達式
- 遵循現有 command 模式（query.ts 作為參考）
- 輸出格式：簡單列表（非表格），符合 label 為純字串的特性

### 測試覆蓋

- 10 個新測試涵蓋 API 函數
- 總測試數量：102 個全部通過

## 2025-01-09 Series 功能實作

### 實作概要

- 執行 `/speckit.specify` 建立 005-series 規格
- 執行 `/speckit.plan` 建立實作計畫
- 執行 `/speckit.tasks` 生成 41 個任務（5 個階段）
- 執行 `/speckit.implement` 完成所有功能

### 完成的功能

- `prom series <matchers...>` - 查詢符合 label matchers 的時間序列
- 支援多個 matchers（邏輯 OR 組合）
- `--start` / `--end` 支援時間範圍過濾（RFC3339 或相對時間）
- `--json` 支援 JSON 輸出格式
- 錯誤處理：無 matcher、無設定、連線失敗、API 錯誤

### API 端點

- `/api/v1/series` - 查詢時間序列，使用 `match[]` 參數

### 技術決策

- 重用 labels 命令的 parseTimeRange() 模式
- 重用 time-parser.ts 處理時間表達式
- 使用 formatLabelSet() 將 label set 格式化為 `{key="value", ...}` 格式
- 輸出格式：人類可讀列表（預設）或 JSON（--json）
- variadic arguments 處理多個 matchers

### 實作效率

- Phase 1 (Setup): 完成型別定義和 API 方法（3 個任務）
- Phase 2 (MVP): 完成核心功能，包含測試和實作（14 個任務）
- Phase 3-4: 時間過濾和 JSON 輸出已在 Phase 2 實作，只需補測試
- Phase 5 (Polish): 測試、格式化、文檔更新（5 個任務）
- 效率提升：同時實作多個 user story 的功能，減少重工

### 測試覆蓋

- 14 個新測試涵蓋 getSeries() API 和時間解析功能
- 總測試數量：121 個全部通過
- 測試涵蓋：單一/多個 matchers、空結果、錯誤處理、時間範圍驗證

## 2025-02-03 Targets Filter 功能實作

### 實作概要

- 執行 `/speckit.specify` 建立 006-targets-filter 規格
- 執行 `/speckit.plan` 建立實作計畫
- 執行 `/speckit.tasks` 生成 37 個任務（6 個階段）
- 執行 `/speckit.implement` 完成所有功能

### 完成的功能

- `prom targets --job <name>` - 依 job 名稱過濾目標
- `prom targets --state <up|down>` - 依健康狀態過濾目標
- `prom targets --job <name> --state <state>` - 組合過濾（AND 邏輯）
- 支援既有的 `--json` 輸出格式
- 向後相容：無過濾參數時顯示全部目標

### 技術決策

- 客戶端過濾：Prometheus API 不支援伺服器端過濾
- 純函數設計：filterTargets() 為可測試的純函數
- AND 邏輯：多個過濾條件需同時符合
- 型別安全：state 限定為 'up' | 'down' union type
- 錯誤處理：無效 state 值會顯示錯誤訊息並 exit(1)

### 實作方式

- filterTargets() 函數：接收 targets 和過濾選項，回傳過濾後陣列
- Array.filter() 實作：O(n) 複雜度，適用於典型目標數量（< 1000）
- 重用既有格式化器：formatTargetsTable 和 formatJson
- 空結果處理：區分「無目標配置」與「無符合過濾條件的目標」

### 測試覆蓋

- 7 個單元測試涵蓋 filterTargets() 函數
- 測試案例：job 過濾、state 過濾、組合過濾、無過濾、空結果
- 總測試數量：128 個全部通過
- 遵循 BDD Given/When/Then 模式

## 2025-02-05 Multi-Config Management 功能實作

### 實作概要

- 執行 `/speckit.specify` 建立 007-multi-config 規格
- 執行 `/speckit.plan` 建立實作計畫
- 執行 `/speckit.tasks` 生成 120 個任務（9 個階段）
- 執行 `/speckit.implement` 完成所有功能

### 完成的功能

- `prom config add <name> <url>` - 新增命名配置（支援 --username/--password/--token）
- `prom config list` - 列出所有配置（顯示 active 指標）
- `prom config use <name>` - 切換 active 配置
- `prom config current` - 顯示目前 active 配置詳情
- `prom config remove <name>` - 移除配置（支援 --force/--yes）
- 自動遷移舊格式配置檔案（向後相容）

### 配置檔案結構

- 舊格式：`{ serverUrl, username?, password?, token? }`
- 新格式：`{ activeConfig?: string, configs: { [name]: Configuration } }`

### 技術決策

- 使用 flat JSON 結構存儲多個配置（activeConfig + configs）
- ConfigStore 模組處理配置操作（add, remove, setActive, getActive, list）
- Migration 模組處理自動遷移（detectOldFormat, migrateOldConfig, backupOldConfig）
- Atomic write（temp file + rename）確保檔案一致性
- 首個配置自動成為 active
- Commander.js subcommands 架構
- 驗證函數：validateConfigName, validateServerUrl, validateAuthentication

### 實作階段

- Phase 1-2: 型別定義 + ConfigStore/migration 模組（TDD 實作，16 個測試）
- Phase 3-5: MVP 功能（add, list, use）
- Phase 6: 整合自動遷移到 loadConfig()
- Phase 7-8: 補充功能（current, remove）
- Phase 9: Polish（格式化、測試、文檔）

### 測試覆蓋

- 總測試數量：177 個全部通過（新增 43 個測試）
- 16 個 ConfigStore 和 migration 測試
- 27 個驗證函數測試
- 涵蓋：配置新增/列出/切換/顯示/移除、自動遷移、錯誤處理
