---
sidebar_position: 16
---

# OpenAI公式SDK

:::note

これは、[公式OpenAI Java SDK](https://github.com/openai/openai-java)を使用する`OpenAI Official SDK`統合のドキュメントです。

LangChain4jはチャットモデル用に3つの異なるOpenAI統合を提供しており、これはその#2です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）およびSpring（SpringのRestClientを使用）で最もよく動作します。
- [OpenAI Official SDK](/integrations/language-models/open-ai-official)は公式のOpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最もよく動作します。

:::

## この統合のユースケース

この統合は[OpenAI Java SDK GitHubリポジトリ](https://github.com/openai/openai-java)を使用し、次から提供されるすべてのOpenAIモデルで動作します：

- OpenAI
- Microsoft Foundry
- GitHub Models

DeepSeekなど、OpenAI APIをサポートするモデルでも動作します。

## OpenAIドキュメント

- [OpenAI Java SDK GitHub Repository](https://github.com/openai/openai-java)
- [OpenAI API Documentation](https://platform.openai.com/docs/introduction)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-official</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## モデルの設定

:::note
この設定、および次の使用方法のセクションは、非ストリーミングモード（「ブロッキング」または「同期」モードとも呼ばれます）向けです。
ストリーミングモードは2セクション後で詳しく説明します。モデルとのリアルタイムチャットが可能ですが、使用はより複雑です。
:::

OpenAIモデルを使用するには、通常エンドポイントURL、APIキー、モデル名が必要です。これはモデルのホスト場所によって異なり、この統合は
自動構成により設定を容易にしようとします：

### 汎用設定

```java
import com.openai.models.ChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialChatModel;

import static com.openai.models.ChatModel.GPT_5_MINI;

// ....

ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

### OpenAI設定

OpenAIの`baseUrl`（`https://api.openai.com/v1`）がデフォルトのため、省略できます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

### Azure OpenAI設定

#### 汎用設定

Azure OpenAIでは`baseUrl`の設定が必須で、URLが`openai.azure.com`で終わる場合はAzure OpenAIが自動検出されます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

Azure OpenAIの使用を強制したい場合は、`isAzure()`メソッドも使用できます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .isAzure(true)
        .modelName(GPT_5_MINI)
        .build();
```

#### パスワードレス認証

「パスワードレス」認証を使用してAzure OpenAIに認証できます。APIキーを管理しないため、より安全です。

そのためには、まずAzure OpenAIインスタンスがマネージドIDをサポートするよう構成し、次にこのアプリケーションにアクセス権を付与します。例：

```bash
# Enable system managed identity on the Azure OpenAI instance
az cognitiveservices account identity assign \
    --name <your-openai-instance-name> \
    --resource-group <your-resource-group>

# Get your logged-in identity
az ad signed-in-user show \
    --query id -o tsv
    
# Give access to the Azure OpenAI instance
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee <your-logged-identity-from-the-previous-command> \
    --scope "/subscriptions/<your-subscription-id>/resourceGroups/<your-resource-group>"
```

次に、Mavenの`pom.xml`に`azure-identity`依存関係を追加する必要があります：

```xml
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
</dependency>
```

APIキーが構成されていない場合、LangChain4jは自動的にAzure OpenAIのパスワードレス認証を使用します。

### GitHub Models設定

GitHub Modelsでは、デフォルトの`baseUrl`（`https://models.inference.ai.azure.com`）を使用できます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .baseUrl("https://models.inference.ai.azure.com")
        .apiKey(System.getenv("GITHUB_TOKEN"))
        .modelName(GPT_5_MINI)
        .build();
```

または、`isGitHubModels()`メソッドを使用してGitHub Modelsの使用を強制でき、`baseUrl`が自動設定されます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .apiKey(System.getenv("GITHUB_TOKEN"))
        .modelName(GPT_5_MINI)
        .isGitHubModels(true)
        .build();
```

GitHub Modelsは通常、GitHub ActionsまたはGitHub Codespaces使用時に自動入力される`GITHUB_TOKEN`環境変数で構成されるため、自動検出されます：

```java
ChatModel model = OpenAiOfficialChatModel.builder()
        .modelName(GPT_5_MINI)
        .isGitHubModels(true)
        .build();
```

この最後の構成は使いやすく、`GITHUB_TOKEN`環境変数がコードやGitHubログに露出しないため、より安全です。

## モデルの使用

前のセクションでは、`ChatModel`インターフェースを実装する`OpenAiOfficialChatModel`オブジェクトを作成しました。

[AI Service](https://docs.langchain4j.dev/tutorials/spring-boot-integration/#langchain4j-spring-boot-starter)で使用するか、Javaアプリケーションで直接使用できます。

この例では、Spring Beanとしてオートワイヤリングされています：

```java
@RestController
class ChatModelController {

    ChatModel chatModel;

    ChatModelController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @GetMapping("/model")
    public String model(@RequestParam(value = "message", defaultValue = "Hello") String message) {
        return chatModel.chat(message);
    }
}
```

## 構造化出力
[構造化出力](https://openai.com/index/introducing-structured-outputs-in-the-api/)機能は
[ツール](/tutorials/tools)と[レスポンスフォーマット](/tutorials/ai-services#json-mode)の両方でサポートされています。

構造化出力の詳細は[こちら](/tutorials/structured-outputs)をご覧ください。

### 構造化出力 for Tools
ツールの構造化出力機能を有効にするには、モデル構築時に`.strictTools(true)`を設定します：

```java
OpenAiOfficialChatModel.builder()
        // ...
        .strictTools(true)
        .build();
```

これにより、現在のOpenAIの制限により、すべてのツールパラメータが必須（JSONスキーマでは`required`）になり、
JSONスキーマの各`object`に対して`additionalProperties=false`が設定されることに注意してください。

### 構造化出力 for Response Format
AIサービス使用時にレスポンスフォーマット用の構造化出力機能を有効にするには、
モデル構築時に`supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))`と`.strictJsonSchema(true)`を設定します：

```java
import static dev.langchain4j.model.chat.Capability.RESPONSE_FORMAT_JSON_SCHEMA;

// ...

OpenAiChatModel.builder()
        // ...
        .supportedCapabilities(Set.of(RESPONSE_FORMAT_JSON_SCHEMA))
        .strictJsonSchema(true)
        .build();
```

この場合、AIサービスは指定されたPOJOからJSONスキーマを自動生成し、LLMに渡します。

## モデルの設定 for streaming

:::note
上記の2つのセクションでは、非ストリーミングモード（「ブロッキング」または「同期」モードとも呼ばれます）のモデル設定について詳しく説明しました。
このセクションはストリーミングモード用であり、モデルとのリアルタイムチャットを可能にしますが、使用はより複雑です。
:::

これは非ストリーミングモードと似ていますが、`OpenAiOfficialChatModel`の代わりに`OpenAiOfficialStreamingChatModel`クラスを使用する必要があります：

```java
StreamingChatModel model = OpenAiOfficialStreamingChatModel.builder()
        .baseUrl(System.getenv("OPENAI_BASE_URL"))
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

非ストリーミング設定セクションで詳述されているように、特定の`isAzure()`および`isGitHubModels()`メソッドを使用して、Azure OpenAIまたはGitHub Modelsの使用を強制することもできます。

## OpenAI Responses API

:::note
この機能は実験的であり、将来のリリースで変更される可能性があります。
:::

OpenAIの[Responses API](https://platform.openai.com/docs/api-reference/responses)（`/v1/responses`）は、Chat Completions APIの代替です。

### `OpenAiOfficialResponsesChatModel`の作成

```java
ChatModel model = OpenAiOfficialResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5.4")
        .build();
```

### `OpenAiOfficialResponsesStreamingChatModel`の作成

```java
StreamingChatModel model = OpenAiOfficialResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_5_MINI)
        .build();
```

`OpenAiOfficialResponsesChatRequestParameters`を使用してデフォルトのリクエストパラメータを構成することもできます：
```java
StreamingChatModel model = OpenAiOfficialResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .defaultRequestParameters(OpenAiOfficialResponsesChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .previousResponseId("resp_abc123")
                .reasoningEffort("medium")
                .store(true)
                .build())
        .build();
```

### `OpenAiOfficialResponsesChatRequestParameters`

`OpenAiOfficialResponsesChatRequestParameters`は`DefaultChatRequestParameters`を拡張し、Responses API固有のフィールドを追加します：
`previousResponseId`、`maxToolCalls`、`parallelToolCalls`、`topLogprobs`、`truncation`、`include`、
`serviceTier`、`safetyIdentifier`、`promptCacheKey`、`promptCacheRetention`、`reasoningEffort`、
`reasoningSummary`、`textVerbosity`、`streamIncludeObfuscation`、`store`、`strictTools`、`strictJsonSchema`。

これらのパラメータは、モデル作成時に（ビルダー上の`defaultRequestParameters`経由で）デフォルトとして構成するか、
`ChatRequest`経由でリクエストごとに渡すことができます（リクエストごとのパラメータがデフォルトを上書きします）：
```java
ChatRequest chatRequest = ChatRequest.builder()
        .messages(UserMessage.from("Hello"))
        .parameters(OpenAiOfficialResponsesChatRequestParameters.builder()
                .modelName("gpt-4o-mini")
                .previousResponseId("resp_abc123")
                .store(true)
                .build())
        .build();
```

### 思考 / 推論
OpenAIの推論モデル（例：`gpt-5.4`、`gpt-5-mini`）は、
モデルの内部推論の要約を公開する
[推論サマリー](https://developers.openai.com/api/docs/guides/reasoning#reasoning-summaries)
をサポートします。

推論サマリーを有効にするには、ビルダー上で（または`OpenAiOfficialResponsesChatRequestParameters`経由で）
`reasoningSummary`を`Reasoning.Summary.AUTO`に設定します。
`reasoningEffort`でモデルが推論にかける労力も制御できます。

```java
ChatModel model = OpenAiOfficialResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort(ReasoningEffort.LOW)
        .reasoningSummary(Reasoning.Summary.AUTO)
        .build();

ChatResponse response = model.chat("What is the capital of Germany?");
response.aiMessage().text();     // "The capital of Germany is Berlin."
response.aiMessage().thinking(); // reasoning summary text
```

`OpenAiOfficialResponsesStreamingChatModel`に`reasoningSummary`が設定されている場合、
推論サマリーのトークンがストリームされるにつれて
`StreamingChatResponseHandler.onPartialThinking()`コールバックが呼び出されます：

```java
StreamingChatModel model = OpenAiOfficialResponsesStreamingChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort(ReasoningEffort.LOW)
        .reasoningSummary(Reasoning.Summary.AUTO)
        .build();
```

`AiMessage.thinking()`内の推論サマリーは情報提供用であり、後続リクエストで送り返す必要はありません
——OpenAIはターン間でそれを破棄します。モデルの推論状態をターン間で実際に保持するには
（例：ツール呼び出しの間）、以下で説明する暗号化推論を使用してください。

#### 暗号化推論（コンテキスト内で推論を保持）

`store`が`false`（デフォルト）の場合、または組織がゼロデータ保持の場合、
モデルの推論コンテキストはターン間で失われます。
保持するには、`include`パラメータ経由で
[暗号化された推論コンテンツ](https://developers.openai.com/api/docs/guides/reasoning#keeping-reasoning-items-in-context)
をリクエストします：

```java
ChatModel model = OpenAiOfficialResponsesChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-5-mini")
        .reasoningEffort(ReasoningEffort.MEDIUM)
        .include(List.of("reasoning.encrypted_content"))
        .build();
```

`include`に`"reasoning.encrypted_content"`が含まれる場合、レスポンスの推論アイテムは
不透明な暗号化blobを含みます。これは自動的に
`AiMessage.attributes()`のキー`"encrypted_reasoning"`の下に格納されます。

後続リクエストでその`AiMessage`を返すと（例：ツール呼び出し後）、
暗号化推論が自動的にリクエストに含まれ、
モデルが推論コンテキストを再開できるようになります：

```java
// Turn 1: model calls a tool
ChatResponse response1 = model.chat(ChatRequest.builder()
        .messages(userMessage)
        .parameters(ChatRequestParameters.builder()
                .toolSpecifications(weatherTool)
                .build())
        .build());

AiMessage aiMessage1 = response1.aiMessage();
// aiMessage1.attribute("encrypted_reasoning", String.class) is not null

// Turn 2: send tool result back — encrypted reasoning is sent automatically
ChatResponse response2 = model.chat(ChatRequest.builder()
        .messages(
                userMessage,
                aiMessage1, // contains encrypted reasoning in attributes
                ToolExecutionResultMessage.from(aiMessage1.toolExecutionRequests().get(0), "sunny"))
        .parameters(ChatRequestParameters.builder()
                .toolSpecifications(weatherTool)
                .build())
        .build());
```

これは`OpenAiOfficialResponsesStreamingChatModel`でも同様に動作します。

### `OpenAiOfficialResponsesChatResponseMetadata`

Responses APIのレスポンスメタデータは、標準の`ChatResponseMetadata`を超える追加フィールドを提供します：

```java
OpenAiOfficialResponsesChatResponseMetadata metadata =
        (OpenAiOfficialResponsesChatResponseMetadata) chatResponse.metadata();

metadata.id();               // Response ID (can be used as previousResponseId)
metadata.modelName();        // Model name used for the request
metadata.finishReason();     // Finish reason (STOP, LENGTH, TOOL_EXECUTION, OTHER)
metadata.tokenUsage();       // Returns OpenAiOfficialTokenUsage with detailed token counts
metadata.createdAt();        // Timestamp when the response was created
metadata.completedAt();      // Timestamp when the response was completed
metadata.serviceTier();      // Service tier used for the request
```
