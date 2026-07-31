---
sidebar_position: 1
---

# Amazon Bedrock

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-bedrock</artifactId>
    <version>1.18.1</version>
</dependency>
```

## AWS 認証情報
Amazon Bedrock モデルを使用するには、AWS 認証情報を設定する必要があります。
選択肢のひとつは、`AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` 環境変数を設定することです。詳細は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)を参照してください。あるいは、API キー認証のためにローカルで `AWS_BEARER_TOKEN_BEDROCK` 環境変数を設定することもできます。API キーの詳細については、[ドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html)を参照してください。

## BedrockChatModel
:::note
現在の実装では Guardrails はサポートされていません。
:::

サポートされているモデルとその機能は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html)で確認できます。

モデル ID は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)で確認できます。

### 設定
```java
ChatModel model = BedrockChatModel.builder()
        .client(BedrockRuntimeClient)
        .region(...)
        .modelId("us.amazon.nova-lite-v1:0")
        .returnThinking(...)
        .sendThinking(...)
        .timeout(...)
        .maxRetries(...)
        .logRequests(...)
        .logResponses(...)
        .listeners(...)
        .defaultRequestParameters(BedrockChatRequestParameters.builder()
                .modelName(...)
                .temperature(...)
                .topP(...)
                .maxOutputTokens(...)
                .stopSequences(...)
                .toolSpecifications(...)
                .toolChoice(...)
                .additionalModelRequestFields(...)
                .additionalModelRequestField(...)
                .enableReasoning(...)
                .promptCaching(...)
                .build())
        .build();
```

### 例

- [BedrockChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockChatModelExample.java)

## BedrockStreamingChatModel

:::note
現在の実装では Guardrails はサポートされていません。
:::

サポートされているモデルとその機能は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html)で確認できます。

モデル ID は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)で確認できます。

### 設定
```java
StreamingChatModel model = BedrockStreamingChatModel.builder()
        .client(BedrockRuntimeAsyncClient)
        .region(...)
        .modelId("us.amazon.nova-lite-v1:0")
        .returnThinking(...)
        .sendThinking(...)
        .timeout(...)
        .logRequests(...)
        .logResponses(...)
        .listeners(...)
        .defaultRequestParameters(BedrockChatRequestParameters.builder()
                .modelName(...)
                .temperature(...)
                .topP(...)
                .maxOutputTokens(...)
                .stopSequences(...)
                .toolSpecifications(...)
                .toolChoice(...)
                .additionalModelRequestFields(...)
                .additionalModelRequestField(...)
                .enableReasoning(...)
                .promptCaching(...)
                .build())
        .build();
```

### 例

- [BedrockStreamingChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockStreamingChatModelExample.java)


## Additional Model Request Fields

`BedrockChatRequestParameters` の `additionalModelRequestFields` フィールドは `Map<String, Object>` です。
[こちら](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html#bedrock-runtime_Converse-request-additionalModelRequestFields)で説明されているように、
共通の `InferenceConfiguration` ではカバーされない特定モデル向けの推論パラメータを追加できます。


## Thinking / Reasoning

Claude の思考プロセスを有効にするには、`BedrockChatRequestParameters` で `enableReasoning` を呼び出し、モデル構築時に
`defaultRequestParameters` 経由で設定します：
```java
BedrockChatRequestParameters parameters = BedrockChatRequestParameters.builder()
        .enableReasoning(1024) // token budget
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-sonnet-4-20250514-v1:0")
        .defaultRequestParameters(parameters)
        .returnThinking(true)
        .sendThinking(true)
        .build();
```

次のパラメータも思考の挙動を制御します：
- `returnThinking`：利用可能な場合に `AiMessage.thinking()` 内に思考内容を返すかどうか、
および `BedrockStreamingChatModel` 使用時に `StreamingChatResponseHandler.onPartialThinking()` と `TokenStream.onPartialThinking()`
コールバックを呼び出すかどうかを制御します。
デフォルトでは無効です。有効にすると、思考シグネチャも `AiMessage.attributes()` 内に保存・返却されます。
- `sendThinking`：後続リクエストで `AiMessage` に保存された思考内容とシグネチャを LLM に送信するかどうかを制御します。
デフォルトでは有効です。

## Prompt Caching

AWS Bedrock は、類似したプロンプトで API を繰り返し呼び出す際のパフォーマンス向上とコスト削減のためにプロンプトキャッシュをサポートしています。この機能により、キャッシュされたコンテンツのレイテンシを最大 85%、コストを最大 90% 削減できます。

### 仕組み

プロンプトキャッシュでは、会話内の特定のポイントをキャッシュ対象としてマークできます。同じキャッシュ済みコンテンツで後続の API 呼び出しを行うと、Bedrock はキャッシュされた部分を再利用でき、処理時間とコストを大幅に削減します。キャッシュの TTL（有効期間）は 5 分で、キャッシュヒットのたびにリセットされます。

### サポートされているモデル

プロンプトキャッシュは次のモデルでサポートされています：
- Claude Opus 4.5
- Claude Opus 4.1
- Claude Opus 4
- Claude Sonnet 4.5
- Claude Haiku 4.5
- Claude Sonnet 4
- Claude 3.7 Sonnet
- Claude 3.5 Sonnet
- Claude 3.5 Haiku 
- Amazon Nova models

### 設定

プロンプトキャッシュを有効にするには、`BedrockChatRequestParameters` の `promptCaching()` メソッドを使用します：

```java
import dev.langchain4j.model.bedrock.BedrockChatRequestParameters;
import dev.langchain4j.model.bedrock.BedrockCachePointPlacement;

BedrockChatRequestParameters params = BedrockChatRequestParameters.builder()
        .promptCaching(BedrockCachePointPlacement.AFTER_SYSTEM)
        .temperature(0.7)
        .maxOutputTokens(500)
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.amazon.nova-micro-v1:0")
        .region(Region.US_EAST_1)
        .defaultRequestParameters(params)
        .build();
```

### キャッシュポイントの配置オプション

`BedrockCachePointPlacement` 列挙型は、会話内でキャッシュポイントを配置する場所として次の 3 つのオプションを提供します：

- **`AFTER_SYSTEM`**：システムメッセージの後にキャッシュポイントを配置します。複数の会話で再利用したい一貫したシステムプロンプトがある場合に適しています。
- **`AFTER_USER_MESSAGE`**：ユーザーメッセージの後にキャッシュポイントを配置します。同じままの標準ユーザープロンプトやコンテキストがある場合に有用です。
- **`AFTER_TOOLS`**：ツール定義の後にキャッシュポイントを配置します。キャッシュしたい一貫したツール定義セットがある場合に有益です。

### 例

#### システムメッセージキャッシュの基本的な使い方

```java
// Configure prompt caching to cache after system message
BedrockChatRequestParameters params = BedrockChatRequestParameters.builder()
        .promptCaching(BedrockCachePointPlacement.AFTER_SYSTEM)
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-sonnet-4-6")
        .defaultRequestParameters(params)
        .build();

// First request - establishes the cache
ChatRequest request1 = ChatRequest.builder()
        .messages(Arrays.asList(
                SystemMessage.from("You are a helpful coding assistant with expertise in Java."),
                UserMessage.from("What is dependency injection?")
        ))
        .build();

ChatResponse response1 = model.chat(request1);

// Second request - benefits from cached system message
ChatRequest request2 = ChatRequest.builder()
        .messages(Arrays.asList(
                SystemMessage.from("You are a helpful coding assistant with expertise in Java."),
                UserMessage.from("What is the singleton pattern?")
        ))
        .build();

ChatResponse response2 = model.chat(request2); // Faster response due to caching
```

#### 他の機能との組み合わせ

プロンプトキャッシュは、推論などの他の Bedrock 機能と組み合わせることができます：

```java
BedrockChatRequestParameters params = BedrockChatRequestParameters.builder()
        .promptCaching(BedrockCachePointPlacement.AFTER_SYSTEM)
        .enableReasoning(1000)  // Enable reasoning with 1000 token budget
        .temperature(0.3)
        .maxOutputTokens(2000)
        .build();

ChatModel model = BedrockChatModel.builder()
        .modelId("us.anthropic.claude-sonnet-4-6")
        .defaultRequestParameters(params)
        .build();
```

### ベストプラクティス

1. **安定したコンテンツをキャッシュする**：システムプロンプト、ツール定義、共通コンテキストなど、頻繁に変化しないコンテンツにキャッシュを使用します。
2. **適切な配置を選ぶ**： 
   - システムプロンプトが会話間で一貫している場合は `AFTER_SYSTEM` を使用
   - 安定したツール定義セットがある場合は `AFTER_TOOLS` を使用
   - 繰り返されるユーザーコンテキストがあるシナリオでは `AFTER_USER_MESSAGE` を使用
3. **キャッシュヒットを監視する**：5 分の TTL はキャッシュヒットのたびにリセットされるため、同じキャッシュ済みコンテンツへの頻繁なリクエストでキャッシュを維持できます。
4. **コスト最適化**：繰り返し使用される長いシステムプロンプトやツール定義では、キャッシュが特に有益です。

### 追加リソース

- [AWS Bedrock Prompt Caching ドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)
