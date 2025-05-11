---
sidebar_position: 1
---

# Amazon Bedrock

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-bedrock</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## AWS認証情報
Amazon Bedrockモデルを使用するには、AWS認証情報を設定する必要があります。
オプションの1つは、`AWS_ACCESS_KEY_ID`と`AWS_SECRET_ACCESS_KEY`環境変数を設定することです。
詳細は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)で確認できます。

## InvokeAPIとConverseAPIの違い
Amazon Bedrockは推論のための2つの主要なモデル呼び出しAPI操作を提供しています：
- [Converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) – AmazonはメッセージをサポートするすべてのAmazon Bedrockモデルで動作する一貫したAPIを提供するConverseAPIの使用を推奨しています。
- [InvokeModel](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-invoke.html) – 元々は単一のプロンプトに対する応答を得るための単一の呼び出しを目的としていました。

## ConverseAPIを使用したChatModel
現在の実装ではガードレールはサポートされていません。

サポートされているモデルとその機能は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html)で確認できます。

モデルIDは[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)で確認できます。

### 設定
```java
ChatModel model = BedrockChatModel.builder()
        .modelId("us.amazon.nova-lite-v1:0")
        .region(...)
        .maxRetries(...)
        .timeout(...)
        .logRequests(...)
        .logResponses(...)
        .listeners(...)
        .defaultRequestParameters(BedrockChatRequestParameters.builder()
                .topP(...)
                .temperature(...)
                .maxOutputTokens(...)
                .stopSequences(...)
                .toolSpecifications(...)
                .additionalModelRequestFields(...)
                .build())
        .build();
```

`additionalModelRequestFields`フィールドは`Map<String, Object>`です。[こちら](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html#bedrock-runtime_Converse-request-additionalModelRequestFields)で説明されているように、
共通のinferenceConfigでカバーされていない特定のモデルの推論パラメータを追加することができます。
BedrockChatRequestParametersには、additionalModelRequestFieldsに推論パラメータを追加することでClaude 3.7の思考プロセスを有効にする便利なメソッドがあります。

### 例

- [BedrockChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockChatModelExample.java)

## ConverseAPIを使用したStreamingChatModel
現在の実装ではガードレールはサポートされていません。

サポートされているモデルとその機能は[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html)で確認できます。

モデルIDは[こちら](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)で確認できます。

### 設定
```java
StreamingChatModel model = BedrockStreamingChatModel.builder()
        .modelId("us.amazon.nova-lite-v1:0")
        .region(...)
        .maxRetries(...)
        .timeout(...)
        .logRequests(...)
        .logResponses(...)
        .listeners(...)
        .defaultRequestParameters(BedrockChatRequestParameters.builder()
                .topP(...)
                .temperature(...)
                .maxOutputTokens(...)
                .stopSequences(...)
                .toolSpecifications(...)
                .additionalModelRequestFields(...)
                .build())
        .build();
```

`additionalModelRequestFields`フィールドは`Map<String, Object>`です。[こちら](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html#bedrock-runtime_Converse-request-additionalModelRequestFields)で説明されているように、
共通のinferenceConfigでカバーされていない特定のモデルの推論パラメータを追加することができます。
BedrockChatRequestParametersには、additionalModelRequestFieldsに推論パラメータを追加することでClaude 3.7の思考プロセスを有効にする便利なメソッドがあります。

### 例

- [BedrockStreamingChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockStreamingChatModelExample.java)

## InvokeAPIを使用したChatModel

### AI21モデル
- `BedrockAI21LabsChatModel`（非推奨、`BedrockChatModel`を使用してください）

### Anthropicモデル
- `BedrockAnthropicMessageChatModel`：（非推奨、`BedrockChatModel`を使用してください）新しいMessages APIをサポート
- `BedrockAnthropicCompletionChatModel`：（非推奨、`BedrockChatModel`を使用してください）古いText Completions APIをサポート
- `BedrockAnthropicStreamingChatModel`

例：
```java
ChatModel model = BedrockAnthropicMessageChatModel.builder()
.model("anthropic.claude-3-sonnet-20240229-v1:0")
.build();
```

### Cohereモデル
- `BedrockCohereChatModel`（非推奨、`BedrockChatModel`を使用してください）

### Meta Llamaモデル
- `BedrockLlamaChatModel`（非推奨、`BedrockChatModel`を使用してください）

### Mistralモデル
- `BedrockMistralAiChatModel`（非推奨、`BedrockChatModel`を使用してください）

### Titanモデル
- `BedrockTitanChatModel`（非推奨、`BedrockChatModel`を使用してください）
- `BedrockTitanEmbeddingModel`

### 例

- [BedrockChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/converse/BedrockChatModelExample.java)
- [BedrockStreamingChatModelExample](https://github.com/langchain4j/langchain4j-examples/blob/main/bedrock-examples/src/main/java/invoke/BedrockStreamingChatModelExample.java)
