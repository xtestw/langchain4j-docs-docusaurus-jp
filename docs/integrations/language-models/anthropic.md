---
sidebar_position: 2
---

# Anthropic

- [Anthropicドキュメント](https://docs.anthropic.com/claude/docs)
- [Anthropic APIリファレンス](https://docs.anthropic.com/claude/reference)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic</artifactId>
    <version>1.0.0-beta4</version>
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

### AnthropicChatModelのカスタマイズ
```java
AnthropicChatModel model = AnthropicChatModel.builder()
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
    .cacheSystemMessages(...)
    .cacheTools(...)
    .thinkingType(...)
    .thinkingBudgetTokens(...)
    .timeout(...)
    .maxRetries(...)
    .logRequests(...)
    .logResponses(...)
    .build();
```
上記のパラメータの一部の説明は[こちら](https://docs.anthropic.com/claude/reference/messages_post)で確認できます。

## AnthropicStreamingChatModel
```java
AnthropicStreamingChatModel model = AnthropicStreamingChatModel.builder()
    .apiKey(System.getenv("ANTHROPIC_API_KEY"))
    .modelName(CLAUDE_3_5_SONNET_20240620)
    .build();

model.chat("Say 'Hello World'", new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        // このメソッドは新しい部分的な応答が利用可能になったときに呼び出されます。1つまたは複数のトークンで構成されることがあります。
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        // このメソッドはモデルが応答を完了したときに呼び出されます
    }

    @Override
    public void onError(Throwable error) {
        // このメソッドはエラーが発生したときに呼び出されます
    }
});
```

### AnthropicStreamingChatModelのカスタマイズ

`AnthropicChatModel`と同じです。上記を参照してください。

## ツール

Anthropicはストリーミングモードと非ストリーミングモードの両方で[ツール](/tutorials/tools)をサポートしています。

ツールに関するAnthropicのドキュメントは[こちら](https://docs.anthropic.com/claude/docs/tool-use)で確認できます。

## キャッシング

`AnthropicChatModel`と`AnthropicStreamingChatModel`はシステムメッセージとツールのキャッシングをサポートしています。
キャッシングはデフォルトで無効になっています。
それぞれ`cacheSystemMessages`と`cacheTools`パラメータを設定することで有効にできます。

有効にすると、すべてのシステムメッセージとツールにそれぞれ`cache_control`ブロックが追加されます。

キャッシングを使用するには、`beta("prompt-caching-2024-07-31")`を設定してください。

`AnthropicChatModel`と`AnthropicStreamingChatModel`は応答で`AnthropicTokenUsage`を返します。これには
`cacheCreationInputTokens`と`cacheReadInputTokens`が含まれています。

キャッシングに関する詳細は[こちら](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)で確認できます。

## 思考プロセス

`AnthropicChatModel`と`AnthropicStreamingChatModel`は[思考プロセス](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)機能の**_限定的な_**サポートを提供しています。
`thinkingType`と`thinkingBudgetTokens`パラメータを設定することで有効にできます：
```java
ChatModel model = AnthropicChatModel.builder()
        .apiKey(System.getenv("ANTHROPIC_API_KEY"))
        .modelName(CLAUDE_3_7_SONNET_20250219)
        .thinkingType("enabled")
        .thinkingBudgetTokens(1024)
        .maxTokens(1024 + 100)
        .logRequests(true)
        .logResponses(true)
        .build();
```

現在サポートされていないもの：
- LC4j APIから思考内容を取得することはできません。ログでのみ表示されます。
- 複数ターンの会話（[メモリ](/tutorials/chat-memory)を使用）では思考内容は[保存](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#preserving-thinking-blocks)されません
- など

思考プロセスに関する詳細は[こちら](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)で確認できます。

## Quarkus

詳細は[こちら](https://docs.quarkiverse.io/quarkus-langchain4j/dev/anthropic.html)で確認できます。

## Spring Boot

Anthropic用のSpring Bootスターターをインポートします：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-anthropic-spring-boot-starter</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

`AnthropicChatModel`ビーンを設定します：
```
langchain4j.anthropic.chat-model.api-key = ${ANTHROPIC_API_KEY}
```

`AnthropicStreamingChatModel`ビーンを設定します：
```
langchain4j.anthropic.streaming-chat-model.api-key = ${ANTHROPIC_API_KEY}
```


## 例

- [AnthropicChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicChatModelTest.java)
- [AnthropicStreamingChatModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicStreamingChatModelTest.java)
- [AnthropicToolsTest](https://github.com/langchain4j/langchain4j-examples/blob/main/anthropic-examples/src/main/java/AnthropicToolsTest.java)
