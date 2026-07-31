---
sidebar_position: 2
---

# Anthropic

- [Anthropic ドキュメント](https://docs.anthropic.com/en/home)
- [Anthropic API リファレンス](https://docs.anthropic.com/en/api/overview)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic</artifactId>
    <version>1.18.1</version>
</dependency>
```

## AnthropicChatModel

```java
AnthropicChatModel model = AnthropicChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_3_5_SONNET_20240620)
    .build();
String answer = model.chat("Say 'Hello World'");
System.out.println(answer);
```

### AnthropicChatModel のカスタマイズ
```java
AnthropicChatModel model = AnthropicChatModel.builder()
    .httpClientBuilder(...)
    .baseUrl(...)
    .apiKey(...)
    .version(...)
    .beta(...)
    .modelName(...)
    .temperature(...)
    .topP(...)
    .topK(...)
    .maxTokens(...)
    .stopSequences(...)
    .toolSpecifications(...)
    .toolChoice(...)
    .toolChoiceName(...)
    .disableParallelToolUse(...)
    .serverTools(...)
    .returnServerToolResults(...)
    .toolMetadataKeysToSend(...)
    .cacheSystemMessages(...)
    .cacheTools(...)
    .returnCacheDiagnostics(...)
    .thinkingType(...)
    .thinkingBudgetTokens(...)
    .thinkingDisplay(...)
    .returnThinking(...)
    .sendThinking(...)
    .midConversationSystemMessages(...)
    .timeout(...)
    .maxRetries(...)
    .logRequests(...)
    .logResponses(...)
    .listeners(...)
    // You can also specify default chat request parameters using ChatRequestParameters or AnthropicChatRequestParameters
    .defaultRequestParameters(...)
    .userId(...)
    .customParameters(...)
    .build();
```
上記の一部パラメータの説明は [こちら](https://docs.anthropic.com/en/api/messages)。

### リクエスト単位のパラメータ

上記の Anthropic 固有オプション（`cacheSystemMessages`、`cacheTools`、`returnCacheDiagnostics`、
`thinkingType`、`thinkingBudgetTokens`、`sendThinking`、`returnThinking`、`midConversationSystemMessages`、
`toolChoiceName`、`disableParallelToolUse`、および `userId`）、ならびに `previousMessageId`（リクエスト専用、
[キャッシュ診断](#キャッシュ診断) を参照）は、
`AnthropicChatRequestParameters` 経由でリクエスト単位にも設定でき、モデルビルダー上の値を上書きします。
これにより、共有の単一モデルインスタンスで呼び出しごとにこれらのオプションを変えられます——例えば、
長時間のエージェントループではプロンプトキャッシュを有効にし、安価なワンショット補完ではスキップし、
2 つ目のモデルを構築せずに済みます：

```java
AnthropicChatModel model = AnthropicChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_3_5_SONNET_20240620)
    .build();

AnthropicChatRequestParameters parameters = AnthropicChatRequestParameters.builder()
    .cacheSystemMessages(true)
    .cacheTools(true)
    .build();

ChatRequest chatRequest = ChatRequest.builder()
    .messages(systemMessage, userMessage)
    .parameters(parameters)
    .build();

ChatResponse chatResponse = model.chat(chatRequest);
```

リクエストに設定されていないパラメータは、モデルビルダー上の値にフォールバックします。

## AnthropicStreamingChatModel
```java
AnthropicStreamingChatModel model = AnthropicStreamingChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_3_5_SONNET_20240620)
    .build();

model.chat("Say 'Hello World'", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        // this method is called when a new partial response is available. It can consist of one or more tokens.
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        // this method is called when the model has completed responding
    }

    @Override
    public void onError(Throwable error) {
        // this method is called when an error occurs
    }
});
```

### AnthropicStreamingChatModel のカスタマイズ

`AnthropicChatModel` と同一です。上記を参照してください。

## Batch API

[Message Batches API](https://docs.anthropic.com/en/api/creating-message-batches) は多数のチャットリクエストを
標準のトークン単価の 50% で非同期処理します。`AnthropicBatchChatModel` はコアの `BatchChatModel`
インターフェース（`submit`、`retrieve`、`cancel`、`list`）を実装します。各リクエストは
`AnthropicChatModel` 呼び出しと同じパラメータで送信します。

```java
AnthropicBatchChatModel model = AnthropicBatchChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName("claude-sonnet-4-5")
    .maxTokens(1024)
    .build();

// Submit a batch of requests
BatchResponse<ChatResponse> submitted = model.submit(new BatchRequest<>(List.of(
    ChatRequest.builder().messages(UserMessage.from("What is the capital of France?")).build(),
    ChatRequest.builder().messages(UserMessage.from("What is the capital of Germany?")).build())));

String batchId = submitted.batchId();

// Poll until the batch reaches a terminal state (typically well under an hour)
BatchResponse<ChatResponse> batch = model.retrieve(batchId);
while (!batch.state().isTerminal()) {
    TimeUnit.SECONDS.sleep(30); // throws InterruptedException
    batch = model.retrieve(batchId);
}

// Read the per-request results, in submission order
for (BatchItemResult<ChatResponse> result : batch.results()) {
    if (result.isSuccess()) {
        System.out.println(result.response().aiMessage().text());
    } else {
        System.out.println("Failed: " + result.error().message());
    }
}
```

`model.list(...)` で最近のバッチをページングし、`model.cancel(batchId)` で処理中のバッチをキャンセルできます。
キャンセルしたバッチも Anthropic 側では `ended` 状態で終わり、`BatchState.CANCELLED` として報告されます。
キャンセルが効く前に完了したリクエストの結果が含まれる場合があります。

thinking やプロンプトキャッシュなどの Anthropic 固有オプションは `defaultRequestParameters(...)` で設定し、
`AnthropicChatModel` と全く同様で、リクエスト単位で上書きできます：

```java
AnthropicBatchChatModel model = AnthropicBatchChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName("claude-sonnet-4-5")
    .maxTokens(4096)
    .defaultRequestParameters(AnthropicChatRequestParameters.builder()
        .thinkingType("enabled")
        .thinkingBudgetTokens(2000)
        .cacheSystemMessages(true)
        .build())
    .returnThinking(true) // store the returned thinking in AiMessage.thinking()
    .build();
```

## ツール（Tools）

Anthropic はストリーミング／非ストリーミングの両方で [ツール](/tutorials/tools) をサポートします。

Anthropic のツールに関するドキュメントは [こちら](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)。


## ツール選択（Tool Choice）

Anthropic の [ツール選択](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use#forcing-tool-use)
機能は、`toolChoice(ToolChoice)` または `toolChoiceName(String)` を設定することで、
ストリーミング／非ストリーミングの両方で利用できます。

## 並列ツール使用

デフォルトでは Anthropic Claude はユーザーのクエリに答えるために複数のツールを使うことがありますが、
`disableParallelToolUse(true)` を設定することで [並列ツール](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use#parallel-tool-use) を無効化できます。

## サーバーツール（Server Tools）

Anthropic の [サーバーツール](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview#server-tools)
は `serverTools` パラメータでサポートされます。以下は [ウェブ検索ツール](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) の使用例です：
```java
AnthropicServerTool webSearchTool = AnthropicServerTool.builder()
        .type("web_search_20250305")
        .name("web_search")
        .addAttribute("max_uses", 5)
        .addAttribute("allowed_domains", List.of("accuweather.com"))
        .build();

ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-5")
        .serverTools(webSearchTool)
        .logRequests(true)
        .logResponses(true)
        .build();

String answer = model.chat("What is the weather in Munich?");
```

`serverTools` で指定したツールは、Anthropic API へのすべてのリクエストに含まれます。

### サーバーツール結果の取得

サーバーツールの生の結果（ウェブ検索結果、コード実行出力、
生成ファイルの fileIds など）にアクセスするには、`returnServerToolResults(true)` を有効にします。
結果は `AiMessage.attributes()` の `"server_tool_results"` キー配下に入ります：

```java
ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-5")
        .serverTools(webSearchTool)
        .returnServerToolResults(true)
        .build();

ChatResponse response = model.chat("What is the weather in Munich?");
AiMessage aiMessage = response.aiMessage();

List<AnthropicServerToolResult> results = aiMessage.attribute("server_tool_results", List.class);
for (AnthropicServerToolResult result : results) {
    System.out.println("Type: " + result.type());
    System.out.println("Tool Use ID: " + result.toolUseId());
    System.out.println("Content: " + result.content());
}
```

ChatMemory に大きなデータが保存されるのを避けるため、デフォルトでは無効です。

## Skills

Anthropic の [Agent Skills](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
は、コード実行コンテナ内で事前構築スキルを実行し、ダウンロード可能な実ドキュメント（`.xlsx`、`.pptx`、`.docx`、`.pdf`）を Claude に生成させます。
型付きの `skills` パラメータで有効化します：

```java
AnthropicChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-opus-4-8")
        .maxTokens(4096)
        .beta("code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14")
        .skills(AnthropicSkill.XLSX, AnthropicSkill.PPTX)
        .returnServerToolResults(true)
        .build();

ChatResponse response = model.chat("Create an Excel spreadsheet with the numbers 1 to 5 in column A");
```

skills を有効にすると自動的に：

- リクエストに `container.skills` ブロックを追加し、
- 必要な `code_execution` サーバーツールを追加します（既に `serverTools(...)` で設定済みでない場合）。

必要な beta 機能は、上記のように自分で `beta(...)` によりオプトインする必要があります。これらは beta
ヘッダーで、値は時間とともに変わるため自動注入されません——現行セットは
[Agent Skills ドキュメント](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
を確認してください。

`returnServerToolResults(true)` と組み合わせると、生成されたファイル id が
`AiMessage.attributes()` の `"server_tool_results"` キー配下に現れます（上記の
[サーバーツール結果の取得](#サーバーツール結果の取得) を参照）。ファイルは Anthropic の Files API 経由で
24 時間ダウンロード可能です。

Skills は Claude Sonnet 4 / 4.5、Opus 4 以降でサポートされます。リクエストあたり最大 8 スキルまで有効化できます。
同じ `skills(...)` パラメータは `AnthropicStreamingChatModel` でも利用できます。

## ツール検索ツール（Tool Search Tool）

Anthropic の [ツール検索ツール](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
は `serverTools`、ツールの `metadata`、および `toolMetadataKeysToSend` パラメータでサポートされます。

高レベル AI Service と `@Tool` API を使う例：

```java
AnthropicServerTool toolSearchTool = AnthropicServerTool.builder()
        .type("tool_search_tool_regex_20251119")
        .name("tool_search_tool_regex")
        .build();

class Tools {

    @Tool(metadata = "{\"defer_loading\": true}")
    String getWeather(String location) {
        return "sunny";
    }

    @Tool
    String getTime(String location) {
        return "12:34:56";
    }
}

ChatModel chatModel = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .serverTools(toolSearchTool)
        .toolMetadataKeysToSend("defer_loading") // need to specify it explicitly
        .logRequests(true)
        .logResponses(true)
        .build();

interface Assistant {

    @SystemMessage("Use tool search if needed")
    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(new Tools())
        .build();

assistant.chat("What is the weather in Munich?");
```

低レベル `ChatModel` と `ToolSpecification` API を使う例：
```java
AnthropicServerTool toolSearchTool = AnthropicServerTool.builder()
        .type("tool_search_tool_regex_20251119")
        .name("tool_search_tool_regex")
        .build();

Map<String, Object> toolMetadata = Map.of("defer_loading", true);

ToolSpecification weatherTool = ToolSpecification.builder()
        .name("get_weather")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("location")
                .required("location")
                .build())
        .metadata(toolMetadata)
        .build();

ToolSpecification timeTool = ToolSpecification.builder()
        .name("get_time")
        .parameters(JsonObjectSchema.builder()
                .addStringProperty("location")
                .required("location")
                .build())
        .build();

ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .serverTools(toolSearchTool)
        .toolMetadataKeysToSend(toolMetadata.keySet()) // need to specify it explicitly
        .logRequests(true)
        .logResponses(true)
        .build();

ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("What is the weather in Munich? Use tool search if needed."))
        .toolSpecifications(weatherTool, timeTool)
        .build();

ChatResponse chatResponse = model.chat(chatRequest);
```

### プログラマティック・ツール呼び出し（Programmatic Tool Calling）

Anthropic の [プログラマティック・ツール呼び出し](https://www.anthropic.com/engineering/advanced-tool-use)
は `serverTools`、ツールの `metadata`、および `toolMetadataKeysToSend` パラメータでサポートされます。

高レベル AI Service と `@Tool` API を使う例：

```java
AnthropicServerTool codeExecutionTool = AnthropicServerTool.builder()
        .type("code_execution_20250825")
        .name("code_execution")
        .build();

class Tools {

    static final String TOOL_METADATA = "{\"allowed_callers\": [\"code_execution_20250825\"]}";
    static final String TOOL_DESCRIPTION = """
            Returns daily minimum and maximum temperatures recorded
            for a specified city for a specified number of previous days.
            Response format: [{"min":0.0,"max":10.0},{"min":0.0,"max":20.0},{"min":0.0,"max":30.0}]
            """;

    record TemperatureRange(double min, double max) {}

    @Tool(value = TOOL_DESCRIPTION, metadata = TOOL_METADATA)
    List<TemperatureRange> getDailyTemperatures(String city, int days) {
        if ("Munich".equals(city) && days == 5) {
            return List.of(
                    new TemperatureRange(0.0, 1.0),
                    new TemperatureRange(0.0, 2.0),
                    new TemperatureRange(0.0, 3.0),
                    new TemperatureRange(0.0, 4.0),
                    new TemperatureRange(0.0, 5.0)
            );
        }

        throw new IllegalArgumentException("Unknown city: " + city + " or days: " + days);
    }

    @Tool(value = "Calculates the average of the specified list of numbers", metadata = TOOL_METADATA)
    Double average(List<Double> numbers) {
        return numbers.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElseThrow();
    }
}

ChatModel chatModel = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .serverTools(codeExecutionTool)
        .toolMetadataKeysToSend("allowed_callers") // need to specify it explicitly
        .logRequests(true)
        .logResponses(true)
        .build();

interface Assistant {

    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(new Tools())
        .build();

assistant.chat("What was the average max temperature in Munich in the last 5 days?");
```

低レベル `ToolSpecification` API でツール `metadata` を指定する例は、
[ツール検索ツール](/integrations/language-models/anthropic#tool-search-tool) セクションを参照してください。

### ツール使用例（Tool Use Examples）

Anthropic の [ツール使用例](https://www.anthropic.com/engineering/advanced-tool-use)
はツールの `metadata` と `toolMetadataKeysToSend` パラメータでサポートされます。

高レベル AI Service と `@Tool` API を使う例：

```java
enum Unit {
    CELSIUS, FAHRENHEIT
}

class Tools {

    // NOTE: if javac "-parameters" option is not enabled, you need to change "location" to "arg0"
    // and "unit" to "arg1" inside the TOOL_METADATA to make it work.
    public static final String TOOL_METADATA = """
            {
                "input_examples": [
                    {
                        "location": "San Francisco, CA",
                        "unit": "FAHRENHEIT"
                    },
                    {
                        "location": "Tokyo, Japan",
                        "unit": "CELSIUS"
                    },
                    {
                        "location": "New York, NY"
                    }
                ]
            }
            """;

    @Tool(metadata = TOOL_METADATA)
    String getWeather(String location, @P(description = "temperature unit", required = false) Unit unit) {
        return "sunny";
    }
}

ChatModel chatModel = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_SONNET_4_5_20250929)
        .beta("advanced-tool-use-2025-11-20")
        .toolMetadataKeysToSend("input_examples") // need to specify it explicitly
        .logRequests(true)
        .logResponses(true)
        .build();

interface Assistant {

    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .tools(new Tools())
        .build();

assistant.chat("What is the weather in Munich in Fahrenheit?");
```

低レベル `ToolSpecification` API でツール `metadata` を指定する例は、
[ツール検索ツール](/integrations/language-models/anthropic#tool-search-tool) セクションを参照してください。

## キャッシュ（Caching）

`AnthropicChatModel` と `AnthropicStreamingChatModel` はレスポンスで `AnthropicTokenUsage` を返し、
`cacheCreationInputTokens` と `cacheReadInputTokens` を含みます。

キャッシュの詳細は [こちら](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)。

### システムメッセージとツールのキャッシュ

システムメッセージとツールのキャッシュはデフォルトで無効です。
それぞれ `cacheSystemMessages` と `cacheTools` パラメータで有効化できます。

有効にすると、最後のシステムメッセージと最後のツールにそれぞれ `cache_control` ブロックが追加されます。

### 個別メッセージのキャッシュ

`UserMessage`、`AiMessage`、`ToolExecutionResultMessage` はそれぞれ、
`cache_control` 属性を `ephemeral` に設定することでキャッシュ対象にできます。キャッシュ制御マーカーは自動的に
メッセージの最後のコンテンツブロックに適用されます（`ToolExecutionResultMessage` の場合は `tool_result` ブロック
自体）。

`UserMessage` は可変の attributes マップを公開します：

```java
UserMessage userMessage = UserMessage.from("Hello cached world");
userMessage.attributes().put("cache_control", "ephemeral");
```

`AiMessage` と `ToolExecutionResultMessage` は不変の attributes マップを持つため、
`toBuilder()` 経由で設定します。エージェントのツール実行ループでは特に有用です。会話履歴は
毎ターン増え続け、ターン末尾のメッセージを `ephemeral` にすると、後続のより大きなリクエストが
キャッシュ済みプレフィックスを再利用でき、増え続ける履歴全体をフル価格で再課金せずに済みます。

```java
AiMessage aiMessage = someAiMessage.toBuilder()
        .attributes(Map.of("cache_control", "ephemeral"))
        .build();

ToolExecutionResultMessage toolExecutionResultMessage = someToolExecutionResultMessage.toBuilder()
        .attributes(Map.of("cache_control", "ephemeral"))
        .build();
```

### キャッシュ診断

Anthropic の（beta）[キャッシュ診断](https://docs.anthropic.com/en/docs/build-with-claude/cache-diagnostics)
機能は、プロンプトキャッシュがヒットしなかった*理由*（モデル、システムプロンプト、ツール、メッセージ履歴の変更）を報告し、
単に `cacheReadInputTokens` がゼロになったことだけを示すのではありません。

`cache-diagnosis-2026-04-07` beta ヘッダーが必要で、`returnCacheDiagnostics` で有効化します。会話の最初のターンでは
`previousMessageId` に `null` を渡してオプトインし、以降の各ターンでは前のレスポンスの `id` を渡します：

```java
AnthropicChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .beta("cache-diagnosis-2026-04-07")
        .returnCacheDiagnostics(true)
        .build();

ChatResponse response1 = model.chat(ChatRequest.builder()
        .messages(UserMessage.from("Summarize section 1."))
        .build());
String previousMessageId = ((AnthropicChatResponseMetadata) response1.metadata()).id();

ChatResponse response2 = model.chat(ChatRequest.builder()
        .messages(UserMessage.from("Summarize section 1."), UserMessage.from("Now summarize section 2."))
        .parameters(AnthropicChatRequestParameters.builder()
                // returnCacheDiagnostics is already enabled on the model above, so on subsequent turns
                // you only need to supply the previousMessageId (it changes every turn).
                .previousMessageId(previousMessageId)
                .build())
        .build());

AnthropicCacheDiagnostics diagnostics = ((AnthropicChatResponseMetadata) response2.metadata()).cacheDiagnostics();
if (diagnostics != null && diagnostics.cacheMissReasonType() != null) {
    // e.g. "model_changed", "system_changed", "tools_changed", "messages_changed",
    // "previous_message_not_found" or "unavailable"
    System.out.println(diagnostics.cacheMissReasonType());
}
```

診断を要求していない、または不一致が見つからない場合、`cacheDiagnostics()` は `null` です。

## Thinking

`AnthropicChatModel` と `AnthropicStreamingChatModel` はどちらも
[拡張 thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
と [適応的 thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) をサポートします。

次のパラメータで制御します：
- `thinkingType` と `thinkingBudgetTokens`：thinking を有効化。
  詳細は [こちら](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)。
- `thinkingDisplay`：thinking コンテンツの返し方を制御。有効値は `"summarized"` と `"omitted"`。
- `returnThinking`：利用可能な場合に `AiMessage.thinking()` 内で thinking を返すか、
  また `BedrockStreamingChatModel` 使用時に `StreamingChatResponseHandler.onPartialThinking()` と `TokenStream.onPartialThinking()`
  コールバックを呼び出すかを制御。
  デフォルト無効。有効にすると、thinking シグネチャも `AiMessage.attributes()` に保存・返却されます。
- `sendThinking`：後続リクエストで `AiMessage` に保存された thinking とシグネチャを LLM に送るかを制御。
デフォルト有効。

`effort` パラメータを設定するには、モデル構築時に `customParameters` を設定します：
```java
ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-7")
        .customParameters(Map.of("output_config", Map.of("effort", "max")))
        ...
        .build();
```

thinking の設定例：
```java
ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName("claude-sonnet-4-5-20250929")
        .thinkingType("enabled")
        .thinkingBudgetTokens(1024)
        .maxTokens(1024 + 100)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

## 会話途中のシステムメッセージ（Mid-Conversation System Messages）

デフォルトでは、メッセージリスト内の位置に関係なく、すべての `SystemMessage` がトップレベル `system` プロンプトに折りたたまれます。
これは Anthropic の従来どおりの動作で、変更ありません。

Claude Opus 4.8 は追加で
[会話途中のシステムメッセージ](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages)
をサポートします：会話が*開始したあと*に現れる `SystemMessage` を `messages` 配列内のインライン `system` エントリとして送り、
その時点以降の会話に効かせられます（例：セッション途中でアシスタントの指示を変更）。
`midConversationSystemMessages(true)` で有効化します：

```java
AnthropicChatModel model = AnthropicChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName("claude-opus-4-8")
    .midConversationSystemMessages(true)
    .build();

ChatResponse response = model.chat(ChatRequest.builder()
    .messages(
        SystemMessage.from("You are a helpful assistant."), // leading -> top-level "system" prompt
        UserMessage.from("Hello"),
        AiMessage.from("Hi! How can I help?"),
        SystemMessage.from("From now on, answer only in French."), // mid-conversation -> inline
        UserMessage.from("What is the capital of Spain?"))
    .build());
```

有効時、**先頭の** `SystemMessage`（最初のユーザー／アシスタントメッセージより前のもの）は引き続きトップレベル
`system` プロンプトを埋めます。会話開始後に現れたものだけがインライン送信されます。これは単なる慣習ではなく——Anthropic の要件です：
`system` メッセージは `messages` 配列の先頭エントリにはできず、
ベースのシステムプロンプトは安定してキャッシュ可能なプレフィックスに置くべきだからです。オプション無効（デフォルト）時は
動作は変わらず、すべての `SystemMessage` がトップレベル `system` プロンプトに入ります。

`AnthropicChatRequestParameters` 経由でリクエスト単位にも設定できます（[リクエスト単位のパラメータ](#リクエスト単位のパラメータ) を参照）。

:::note
Anthropic は会話途中のシステムメッセージの配置を制約します：必ず `user`
ターンの直後（ツール結果を含む `user` ターンも含む）に置き、`assistant` ターンの前か配列末尾でなければならず、
`tool_use` ブロックとその `tool_result` の間に挟んではいけません。連続する `system` メッセージも不可です。
注意：オプション無効時、langchain4j は複数の `SystemMessage` をトップレベル `system`
フィールドにマージします。有効時、隣接する 2 つの会話途中 `SystemMessage` は連続するインライン
`system` エントリとして送られ拒否されます。langchain4j はインラインメッセージを並べ替えたりマージしたりせず——
指定した位置のまま送ります——サポート外モデルや無効な配置は Anthropic API から `400` になります。
:::

## PDF サポート

Anthropic Claude は PDF ドキュメントの処理をサポートします。URL または base64 エンコードデータで PDF を送れます。

### URL 経由で PDF を送る
```java
UserMessage message = UserMessage.from(
    PdfFileContent.from(URI.create("https://example.com/document.pdf")),
    TextContent.from("What are the key findings in this document?")
);

ChatResponse response = model.chat(message);
```

### Base64 経由で PDF を送る
```java
String base64Data = Base64.getEncoder().encodeToString(Files.readAllBytes(Path.of("document.pdf")));

UserMessage message = UserMessage.from(
    PdfFileContent.from(base64Data, "application/pdf"),
    TextContent.from("Summarize this document.")
);

ChatResponse response = model.chat(message);
```

PDF サポートの詳細は [こちら](https://docs.anthropic.com/en/docs/build-with-claude/pdf-support)。

## カスタムチャットリクエストパラメータの設定

`AnthropicChatModel` と `AnthropicStreamingChatModel` を構築するとき、
HTTP リクエストの JSON ボディ内のチャットリクエストにカスタムパラメータを設定できます。
[コンテキスト編集](https://docs.claude.com/en/docs/build-with-claude/context-editing) を有効にする例：
```java
record Edit(String type) {}
record ContextManagement(List<Edit> edits) { }
Map<String, Object> customParameters = Map.of("context_management", new ContextManagement(List.of(new Edit("clear_tool_uses_20250919"))));

ChatModel model = AnthropicChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_SONNET_4_5_20250929)
    .beta("context-management-2025-06-27")
    .customParameters(customParameters)
    .logRequests(true)
    .logResponses(true)
    .build();

String answer = model.chat("Hi");
```

次のボディを持つ HTTP リクエストが生成されます：
```json
{
    "model" : "claude-sonnet-4-5-20250929",
    "messages" : [ {
        "role" : "user",
        "content" : [ {
            "type" : "text",
            "text" : "Hi"
        } ]
    } ],
    "context_management" : {
        "edits" : [ {
            "type" : "clear_tool_uses_20250919"
        } ]
    }
}
```

あるいは、カスタムパラメータをネストした map 構造としても指定できます：
```java
Map<String, Object> customParameters = Map.of(
        "context_management",
        Map.of("edits", List.of(Map.of("type", "clear_tool_uses_20250919")))
);
```

## 生の HTTP レスポンスと Server-Sent Events（SSE）へのアクセス

`AnthropicChatModel` 使用時、生の HTTP レスポンスにアクセスできます：
```java
SuccessfulHttpResponse rawHttpResponse = ((AnthropicChatResponseMetadata) chatResponse.metadata()).rawHttpResponse();
System.out.println(rawHttpResponse.body());
System.out.println(rawHttpResponse.headers());
System.out.println(rawHttpResponse.statusCode());
```

`AnthropicStreamingChatModel` 使用時は、生の HTTP レスポンス（上記）と生の Server-Sent Events にアクセスできます：
```java
List<ServerSentEvent> rawServerSentEvents = ((AnthropicChatResponseMetadata) chatResponse.metadata()).rawServerSentEvents();
System.out.println(rawServerSentEvents.get(0).data());
System.out.println(rawServerSentEvents.get(0).event());
```

## AnthropicTokenCountEstimator

```java
TokenCountEstimator tokenCountEstimator = AnthropicTokenCountEstimator.builder()
        .modelName(CLAUDE_3_OPUS_20240229)
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .logRequests(true)
        .logResponses(true)
        .build();

List<ChatMessage> messages = List.of(...);

int tokenCount = tokenCountEstimator.estimateTokenCountInMessages(messages);
```

## Quarkus

詳細は [こちら](https://docs.quarkiverse.io/quarkus-langchain4j/dev/anthropic.html)。

## Spring Boot

Anthropic 用 Spring Boot starter をインポート：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic-spring-boot-starter</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

`AnthropicChatModel` bean を設定：
```
langchain4j.anthropic.chat-model.api-key = ${ANTHROPIC_API_KEY}
```

`AnthropicStreamingChatModel` bean を設定：
```
langchain4j.anthropic.streaming-chat-model.api-key = ${ANTHROPIC_API_KEY}
```


## 例

- [AnthropicChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicChatModelTest.java)
- [AnthropicStreamingChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicStreamingChatModelTest.java)
- [AnthropicToolsTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicToolsTest.java)
- [AnthropicPdfExample](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicPdfExample.java)
