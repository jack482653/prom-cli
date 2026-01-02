# General Instructions

我現在準備要開始開發 prom-cli 專案，這是一個 node.js 程式可以透過 terminal 去存取 Prometheus。基本的功能如下：

1. 設定 prometheus 伺服器的 URL 和認證資訊(選填)
2. 執行 prometheus rest api 支援的查詢，這部分還未知所以需要再深入探索
3. 顯示查詢結果
4. 檢查 prometheus 伺服器的狀態

請你如果有作任何

- 思考邏輯
- 操作
- 結果推論

請寫到 @THOUGHTS.md，以供未來自己或其他 AI agent 進行回想，內容請用

- 條列式
- 盡量簡短，一條不要超過 250 個字
- 用詞請盡量中性，不要用太過於強烈的詞彙

如果有什麼想不起來的地方，也可以回去查 @THOUGHTS.md

## 開發原則

請你開發的模式遵照

## S.O.L.I.D 原則

SOLID 原則則是一組設計原則，有助於實現Clean Architecture。以下是 SOLID 原則的簡要說明，以便更好地理解其在 Clean Architecture 中的應用：

- 單一職責原則 (Single Responsibility Principle — SRP)：每個類別或模組應該僅有一個改變的理由，也就是說，它應該只有一個職責。在 Clean Architecture 中，這意味著每一層（例如，實體、用例、介面等）都應該只負責一個特定的關注點。

- 開放/封閉原則 (Open/Closed Principle — OCP)：系統的設計應該是開放擴展的，但封閉修改的。這表示，當需要新增功能時，應該透過擴展現有的代碼而非修改現有的代碼。在 Clean Architecture 中，這鼓勵我們透過新增新的用例、實體等，而不是修改現有的業務邏輯。

- 里氏替換原則 (Liskov Substitution Principle — LSP)：衍生類別應該能夠替換基類別而不影響程式的正確性。在 Clean Architecture 中，這表示你可以更換不同的實現方式，而不影響用例或其他高層次的模組。

- 介面隔離原則 (Interface Segregation Principle — ISP)：不應該強迫一個類別實現它用不到的介面。換句話說，一個類別不應該被迫依賴它不使用的方法。在 Clean Architecture 中，這表示介面應該被設計得小而專注，每個用例或模組僅需實現它們需要的部分。

- 依賴反轉原則 (Dependency Inversion Principle — DIP)：高層次的模組不應該依賴於低層次的模組，兩者都應該依賴於抽象。在 Clean Architecture 中，這表示高層次的用例或實體不應該直接依賴低層次的實現，而應該透過介面或抽象來實現。

## Active Technologies

- Node.js 18+ with TypeScript 5.x (ESM) + commander (CLI), axios (HTTP) (001-prom-cli-core)
- JSON file (`~/.prom-cli/config.json`) (001-prom-cli-core)

## Recent Changes

- 001-prom-cli-core: Added Node.js 18+ with TypeScript 5.x (ESM) + commander (CLI), axios (HTTP)
