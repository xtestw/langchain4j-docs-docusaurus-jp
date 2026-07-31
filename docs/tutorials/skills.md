---
sidebar_position: 32
---

# Skills

:::note
Skills API は実験的です。API と挙動は今後のリリースで変更される可能性があります。
:::

Skills は、再利用可能で自己完結した振る舞い指示を LLM に装備する仕組みです。
skill は名前、短い説明、および指示本文（その _content_）をまとめ、
オプションでリソース（例：references、assets、templates など）も同梱します。
LLM は必要に応じて skill を読み込み、初期コンテキストを小さく保ち、
実際に必要になったときだけ詳細な指示を取り込みます。

:::note
Skills は [Agent Skills 仕様](https://agentskills.io) に従って設計されています。
:::

## Skills の作成

### ファイルシステムから

通常、各 skill は `SKILL.md` ファイルを含む独自のディレクトリに置かれます。
ファイルは skill の `name` と `description` を宣言する YAML front matter ブロックで始まる必要があります。
front matter 以下のすべてが skill の content——LLM が skill を有効化したときに与えられる指示——になります。

```
skills/
├── docx/
│   ├── SKILL.md
│   └── references/
│       └── tracked-changes.md   ← loaded as a resource
└── data-analysis/
    └── SKILL.md
```

`SKILL.md` の例：

```markdown
---
name: docx
description: Edit and review Word documents using tracked changes
---

When the user asks you to edit a Word document:

1. Always use tracked changes so edits can be reviewed.
   ...
```

skill ディレクトリ内の任意のファイル（`SKILL.md` 自体と `scripts/`
サブディレクトリ配下のファイルを除く）は、LLM が必要に応じて読める `SkillResource` として自動的に読み込まれます。

`langchain4j-skills` モジュールの `FileSystemSkillLoader` を使ってファイルシステムから skills を読み込みます。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-skills</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

```java
// Load all skills found in immediate subdirectories:
List<FileSystemSkill> skills = FileSystemSkillLoader.loadSkills(Path.of("skills/"));

// Or load a single skill by its directory:
FileSystemSkill skill = FileSystemSkillLoader.loadSkill(Path.of("skills/docx"));
```

### クラスパスから

`ClassPathSkillLoader` は `FileSystemSkillLoader` と同様に動作しますが、ファイルシステムではなく
クラスパスから skill ディレクトリを解決します。skills が JAR 内に同梱されている場合や、
`src/main/resources` 配下にある場合に便利です。

```
src/main/resources/
└── skills/
    ├── docx/
    │   ├── SKILL.md
    │   └── references/
    │       └── tracked-changes.md
    └── data-analysis/
        └── SKILL.md
```

```java
// Load all skills from a classpath directory:
List<FileSystemSkill> skills = ClassPathSkillLoader.loadSkills("skills");

// Or load a single skill:
FileSystemSkill skill = ClassPathSkillLoader.loadSkill("skills/docx");
```

デフォルトでは、`ClassPathSkillLoader` はスレッドのコンテキストクラスローダーを使用します。
必要に応じてカスタム `ClassLoader` を渡せます。

```java
FileSystemSkill skill = ClassPathSkillLoader.loadSkill("skills/docx", myClassLoader);
```

`FileSystemSkillLoader` と同じ `SKILL.md` 形式、リソース読み込みルール、`scripts/` 除外が適用されます。

### プログラマティックに

Skills は必ずしもファイルシステムベースである必要はありません。
builder API を使えば、データベース、リモート API、実行時生成など、任意のソースから作成できます。

```java
Skill skill = Skill.builder()
        .name("incident-response")
        .description("Step-by-step runbook for diagnosing and resolving production incidents")
        .content("""
                When a production alert fires:
                1. Call `fetchRecentLogs(serviceName)` to retrieve the last 5 minutes of logs.
                2. Call `checkServiceHealth(serviceName)` to get current health metrics.
                3. Based on the findings, call `createIncidentTicket(summary, severity)`.
                4. If severity is CRITICAL, also call `pageOnCall(incidentId)`.
                """)
        .build();
```

リソースをプログラマティックに付けることもできます。

```java
SkillResource reference = SkillResource.builder()
        .relativePath("references/tone-guide.md")
        .content("Use warm, concise language. Avoid jargon.")
        .build();

Skill skill = Skill.builder()
        .name("customer-support")
        .description("Handles customer support inquiries")
        .content("Follow the tone guide in references/tone-guide.md ...")
        .resources(List.of(reference))
        .build();
```

## モード

Skills は、必要な制御と信頼の度合いに応じて、2 つの異なるモードで AI Service と統合できます。

### Tool モード（推奨）

**クラス：** `Skills`（`langchain4j-skills` モジュール）

これは [Agent Skills 仕様](https://agentskills.io/integrate-skills) で説明されている
**ツールベースのエージェント**統合アプローチに対応します。

このモードでは、LLM が skill を有効化してステップバイステップの指示を受け取り、
明示的に登録した [ツール](/tutorials/tools) を呼び出して実行します。
**推論時に LLM はファイルシステムにアクセスできません**——すべての skill コンテンツと
リソースは事前にメモリへ読み込まれ（例：`FileSystemSkillLoader` 経由）、`activate_skill`
と `read_skill_resource` ツールはディスクから読むのではなく、その事前読み込み済みコンテンツを返します。
定義済みツールのみが呼び出し可能なため、**任意コード実行のリスクはありません**。

#### 登録されるツール

| ツール                  | 登録タイミング                                                                               |
|-----------------------|-----------------------------------------------------------------------------------------------|
| `activate_skill`      | 常に登録。LLM がこれを呼び出して skill の完全な指示をコンテキストに読み込みます。              |
| `read_skill_resource` | 少なくとも 1 つの skill がリソースを持つ場合。LLM が個別の参照ファイルを読むために呼び出します。 |
| Skill スコープのツール    | skill が有効化された後。                                                                 |

#### 仕組み

1. システムメッセージが利用可能な skills（名前と説明）を列挙し、LLM が選択できるようにします。
2. ユーザーが特定の skill を必要とする質問をします。
3. LLM が `activate_skill("my-skill")` を呼び出して指示を受け取ります。
4. LLM はその指示に従ってタスクを完了し、途中で必要に応じてリソースファイルを読みます。

#### Skill の例

Skills は _方針_——呼び出しの正確な順序、必須引数、エラー処理の手順、および具体例——を記述し、
実際の実行は型安全でテスト済みの Java コードに残します。

```markdown
---
name: process-order
description: Processes a customer order end-to-end
---

To process an order:

1. Call `validateOrder(orderId)` to check the order is valid.
2. Call `reserveInventory(orderId)` to reserve the required stock.
3. Only if reservation succeeds, call `chargePayment(orderId)`.
4. Finally, call `sendConfirmationEmail(orderId)`.

If any step fails, call `rollbackOrder(orderId)` before reporting the error.
```

#### 配線

通常のツールとあわせて、`Skills` の `ToolProvider` を AI Service builder に渡します。
`formatAvailableSkills()` を使って skill カタログをシステムメッセージに注入し、
LLM が有効化できる skills を把握できるようにします。

```java
Skills skills = Skills.from(FileSystemSkillLoader.loadSkills(Path.of("skills/")));

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .tools(new OrderTools()) // your tools
        .toolProvider(skills.toolProvider()) // or .toolProviders(myToolProvider, skills.toolProvider()) if you already have a tool provider configured
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, activate it first using the `activate_skill` tool before proceeding.")
        .build();
```

`formatAvailableSkills()` は各 skill の名前と説明を列挙する XML 形式のブロックを返します。

```xml

<available_skills>
    <skill>
        <name>process-order</name>
        <description>Processes a customer order end-to-end</description>
    </skill>
    <skill>
        <name>data-analysis</name>
        <description>Analyse tabular data and produce charts</description>
    </skill>
</available_skills>
```

#### カスタマイズ

各ツールの名前、説明、パラメータメタデータは、ビルダー上の対応する設定クラスで上書きできます。

```java
Skills skills = Skills.builder()
        .skills(mySkills)
        .activateSkillToolConfig(ActivateSkillToolConfig.builder()
                .name(...)                    // tool name (default: "activate_skill")
                .description(...)             // tool description
                .parameterName(...)           // parameter name (default: "skill_name")
                .parameterDescription(...)    // parameter description
                .throwToolArgumentsExceptions(...) // throw ToolArgumentsException instead of ToolExecutionException (default: false)
                .build())
        .readResourceToolConfig(ReadResourceToolConfig.builder()
                .name(...)                              // tool name (default: "read_skill_resource")
                .description(...)                       // tool description
                .skillNameParameterName(...)             // skill_name parameter name (default: "skill_name")
                .skillNameParameterDescription(...)      // skill_name parameter description
                .relativePathParameterName(...)          // relative_path parameter name (default: "relative_path")
                .relativePathParameterDescription(...)   // static description (takes precedence over provider)
                .relativePathParameterDescriptionProvider(...) // dynamic description based on available resources
                .throwToolArgumentsExceptions(...)       // throw ToolArgumentsException instead of ToolExecutionException (default: false)
                .build())
        .build();
```

#### Skill スコープのツール

ツールを skill に直接付けることができます。これらのツールは **`activate_skill` ツールで skill が有効化された後にのみ**
LLM に公開されます。これにより LLM のツール一覧を小さく焦点を絞った状態に保ち、
skill 固有のツールが関連するときだけ現れるようにします。

##### `@Tool` アノテーション付きメソッドの使用

ツールを付ける最も簡単な方法は、`@Tool` アノテーション付きメソッドを持つオブジェクトを渡すことです。

```java
class OrderTools {

    @Tool("Validates a customer order by ID")
    String validateOrder(String orderId) {
        // validation logic
        return "valid";
    }

    @Tool("Charges payment for a customer order")
    String chargePayment(String orderId) {
        // payment logic
        return "charged";
    }
}

Skill skill = Skill.builder()
        .name("process-order")
        .description("Processes a customer order end-to-end")
        .content("""
                To process an order:
                1. Call `validateOrder(orderId)` to check the order is valid.
                2. Call `chargePayment(orderId)`.
                """)
        .tools(new OrderTools())
        .build();
```

すでに構築済みの skill に `toBuilder()` でツールを付けることもできます。たとえば、
ファイルシステムから読み込んだ skill にツールを追加する場合です。

```java
FileSystemSkill skill = FileSystemSkillLoader.loadSkill(Path.of("skills/process-order"));

Skill skillWithTools = skill.toBuilder()
        .tools(new OrderTools())
        .build();
```

##### Tool Provider の使用

`ToolProvider` を skill に付けることもできます。たとえば、skill 有効化後にのみ MCP サーバーのツールを公開する場合です。

```java
ToolProvider mcpToolProvider = McpToolProvider.builder()
        .mcpClients(mcpClient)
        .toolFilter((tool, mcpClient) -> tool.name().startsWith("inventory_"))
        .build();

Skill skill = Skill.builder()
        .name("inventory-management")
        .description("Manages warehouse inventory")
        .content("""
                Use inventory tools to check stock levels and update quantities.
                """)
        .toolProviders(mcpToolProvider)
        .build();
```

##### `Map<ToolSpecification, ToolExecutor>` の使用

ツール仕様と実行ロジックを完全に制御したい場合は、マップを直接渡せます。

```java
ToolSpecification validateOrder = ToolSpecification.builder()
        .name("validateOrder")
        .description("Validates a customer order by ID")
        .addParameter("orderId", JsonSchemaProperty.STRING, JsonSchemaProperty.description("The order ID"))
        .build();

ToolExecutor validateOrderExecutor = (request, memoryId) -> {
    String orderId = parseOrderId(request.arguments());
    return validate(orderId);
};

Skill skill = Skill.builder()
        .name("process-order")
        .description("Processes a customer order end-to-end")
        .content("""
                To process an order:
                1. Call `validateOrder(orderId)` to check the order is valid.
                """)
        .tools(Map.of(validateOrder, validateOrderExecutor))
        .build();
```

3 つのアプローチは組み合わせ可能です——`@Tool` メソッド、`ToolProvider`、`Map` エントリは
単一の skill スコープツールセットにマージされます。

```java
Skill skill = Skill.builder()
        .name("process-order")
        .description("Processes a customer order end-to-end")
        .content("...")
        .tools(new OrderTools())
        .tools(Map.of(validateOrder, validateOrderExecutor))
        .toolProviders(mcpToolProvider)
        .build();
```

##### 配線

```java
Skills skills = Skills.from(skill);

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(100))
        .toolProvider(skills.toolProvider())
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, activate it first.")
        .build();
```

##### Skill スコープツールの動作

1. skill 有効化前、LLM は `activate_skill`（および `read_skill_resource`）ツールのみを見ます。
   Skill スコープのツールはツール一覧に含まれません。
2. LLM が `activate_skill("process-order")` を呼び出すと、有効化が `ToolExecutionResultMessage` に記録されます。
3. 次の LLM 呼び出しの前（同じ AI Service 呼び出し内）に、AI Service は現在のメッセージに対して
   動的ツールプロバイダーを再評価します。skill スコープのツール（例：`validateOrder`）が
   可視になり、LLM は同じ AI Service 呼び出し内ですぐに呼び出せます。
   skill スコープのツールは次の AI Service 呼び出しでも LLM に可視のままです。非表示になるのは
   skill が無効化されたときだけです。

##### ツール検索と Skills の併用

Skills は [ツール検索](/tutorials/tools#tool-search) と併用できます。両方が設定されている場合、
それらは独立して動作します。

- **Skill スコープのツールは決して検索可能ではありません。** 検索可能なツールプールには現れず、
  `tool_search_tool` でも見つかりません。対応する skill を LLM が有効化した後にのみ可視になります。
- **通常のツールは引き続き検索可能です。** AI Service の `.tools(...)` 経由で登録されたツール
  （skill 上ではないもの）は、skill が有効化されているかどうかに関係なく検索可能です。
- **`activate_skill` は常に可視です。** `ALWAYS_VISIBLE` とマークされているため、ツール検索が有効でも
  LLM は常に呼び出せます。

```java
Skills skills = Skills.from(mySkills);

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(100))
        .tools(new MySearchableTools()) // these are searchable
        .toolProvider(skills.toolProvider()) // skill-scoped tools are NOT searchable
        .toolSearchStrategy(new SimpleToolSearchStrategy())
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, activate it first.")
        .build();
```

### Shell モード（実験的）

**クラス：** `ShellSkills`（`langchain4j-experimental-skills-shell` モジュール）

これは [Agent Skills 仕様](https://agentskills.io/integrate-skills) で説明されている
**ファイルシステムベースのエージェント**統合アプローチに対応します。

:::warning
**シェル実行は本質的に安全ではありません。**
コマンドはホストプロセス環境で直接実行され、**サンドボックス、コンテナ化、権限制限はありません**。
誤動作やプロンプトインジェクションされた LLM は、アプリケーションを実行しているマシン上で任意のコマンドを実行できます。
入力を完全に信頼し、関連リスクを受け入れる管理された環境でのみ使用してください。
:::

このモードでは、LLM に単一の `run_shell_command` ツールが与えられ、シェルコマンドでファイルシステムから直接 skill 指示を読みます。
`activate_skill` や `read_skill_resource` ツールはありません——LLM は人間の開発者のように skill ファイルをナビゲートします。

#### 登録されるツール

| ツール                | 登録タイミング                                                                                   |
|---------------------|---------------------------------------------------------------------------------------------------|
| `run_shell_command` | 常に登録。LLM がシェルコマンドを実行して `SKILL.md`、リソースファイルを読み、スクリプトを実行します。 |

#### 仕組み

1. システムメッセージが利用可能な skills を絶対ファイルシステムパス付きで列挙します。
2. ユーザーが特定の skill を必要とする質問をします。
3. LLM が `cat /path/to/skills/docx/SKILL.md` を実行して指示を読みます。
4. LLM はさらにシェルコマンドを実行してその指示に従います。

#### 依存関係

シェル実行は別の実験的アーティファクトにあります——ビルドに追加してください。

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-experimental-skills-shell</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

#### 配線

すべての skills はファイルシステムベース（`FileSystemSkillLoader` 経由で読み込み）である必要があります。
`Skills` の代わりに `ShellSkills` を使用します。

```java
ShellSkills skills = ShellSkills.from(FileSystemSkillLoader.loadSkills(Path.of("skills/")));

MyAiService service = AiServices.builder(MyAiService.class)
        .chatModel(chatModel)
        .toolProvider(skills.toolProvider()) // or .toolProviders(myToolProvider, skills.toolProvider()) if you already have a tool provider configured
        .systemMessage("You have access to the following skills:\n" + skills.formatAvailableSkills()
                + "\nWhen the user's request relates to one of these skills, read its SKILL.md before proceeding.")
        .build();
```

`formatAvailableSkills()` には `<location>` フィールドが含まれ、LLM が各 `SKILL.md` の場所を正確に把握できます。

```xml

<available_skills>
    <skill>
        <name>docx</name>
        <description>Edit and review Word documents using tracked changes</description>
        <location>/path/to/skills/docx/SKILL.md</location>
    </skill>
    <skill>
        <name>data-analysis</name>
        <description>Analyse tabular data and produce charts</description>
        <location>/path/to/skills/data-analysis/SKILL.md</location>
    </skill>
</available_skills>
```

#### Shell モードを使うタイミング

このモードは **実験とプロトタイピング**、またはコミュニティ公開のサードパーティ skills
（例：[agentskills.io](https://agentskills.io) エコシステム）を、まず Java に移植せずに使いたい場合に最適です。
動作するワークフローを素早く配線し、ソリューションが成熟するにつれて個々のアクションをツールへ移行できます。

#### カスタマイズ

`RunShellCommandToolConfig` で作業ディレクトリ、出力制限、パラメータ名を調整します。

```java
ShellSkills skills = ShellSkills.builder()
        .skills(mySkills)
        .runShellCommandToolConfig(RunShellCommandToolConfig.builder()
                .name(...)                              // tool name (default: "run_shell_command")
                .description(...)                       // tool description (default: includes OS name)
                .commandParameterName(...)              // command parameter name (default: "command")
                .commandParameterDescription(...)       // command parameter description
                .timeoutSecondsParameterName(...)       // timeout parameter name (default: "timeout_seconds")
                .timeoutSecondsParameterDescription(...) // timeout parameter description
                .workingDirectory(...)                  // working directory for commands (default: JVM's user.dir)
                .maxStdOutChars(...)                    // max stdout chars in result (default: 10_000)
                .maxStdErrChars(...)                    // max stderr chars in result (default: 10_000)
                .executorService(...)                   // ExecutorService for reading stdout/stderr streams
                .throwToolArgumentsExceptions(...)      // throw ToolArgumentsException instead of ToolExecutionException (default: false)
                .build())
        .build();
```
