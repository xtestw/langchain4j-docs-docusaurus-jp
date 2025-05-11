---
sidebar_position: 31
---

# 可観測性

## チャットモデルの可観測性

[特定の](/integrations/language-models) `ChatModel`と`StreamingChatModel`の実装
（「Observability」列を参照）では、以下のようなイベントをリッスンするための`ChatModelListener`を設定できます：
- LLMへのリクエスト
- LLMからのレスポンス
- エラー

これらのイベントには、[OpenTelemetry生成AIセマンティック規約](https://opentelemetry.io/docs/specs/semconv/gen-ai/)に記述されているように、様々な属性が含まれています：
- リクエスト：
  - メッセージ
  - モデル
  - 温度
  - Top P
  - 最大トークン数
  - ツール
  - レスポンス形式
  - など
- レスポンス：
  - アシスタントメッセージ
  - ID
  - モデル
  - トークン使用量
  - 終了理由
  - など

以下は`ChatModelListener`の使用例です：
```java
ChatModelListener listener = new ChatModelListener() {

    @Override
    public void onRequest(ChatModelRequestContext requestContext) {
        ChatRequest chatRequest = requestContext.chatRequest();

        List<ChatMessage> messages = chatRequest.messages();
        System.out.println(messages);

        ChatRequestParameters parameters = chatRequest.parameters();
        System.out.println(parameters.modelName());
        System.out.println(parameters.temperature());
        System.out.println(parameters.topP());
        System.out.println(parameters.topK());
        System.out.println(parameters.frequencyPenalty());
        System.out.println(parameters.presencePenalty());
        System.out.println(parameters.maxOutputTokens());
        System.out.println(parameters.stopSequences());
        System.out.println(parameters.toolSpecifications());
        System.out.println(parameters.toolChoice());
        System.out.println(parameters.responseFormat());

        if (parameters instanceof OpenAiChatRequestParameters openAiParameters) {
            System.out.println(openAiParameters.maxCompletionTokens());
            System.out.println(openAiParameters.logitBias());
            System.out.println(openAiParameters.parallelToolCalls());
            System.out.println(openAiParameters.seed());
            System.out.println(openAiParameters.user());
            System.out.println(openAiParameters.store());
            System.out.println(openAiParameters.metadata());
            System.out.println(openAiParameters.serviceTier());
            System.out.println(openAiParameters.reasoningEffort());
        }

        System.out.println(requestContext.modelProvider());

        Map<Object, Object> attributes = requestContext.attributes();
        attributes.put("my-attribute", "my-value");
    }

    @Override
    public void onResponse(ChatModelResponseContext responseContext) {
        ChatResponse chatResponse = responseContext.chatResponse();

        AiMessage aiMessage = chatResponse.aiMessage();
        System.out.println(aiMessage);

        ChatResponseMetadata metadata = chatResponse.metadata();
        System.out.println(metadata.id());
        System.out.println(metadata.modelName());
        System.out.println(metadata.finishReason());

        if (metadata instanceof OpenAiChatResponseMetadata openAiMetadata) {
            System.out.println(openAiMetadata.created());
            System.out.println(openAiMetadata.serviceTier());
            System.out.println(openAiMetadata.systemFingerprint());
        }

        TokenUsage tokenUsage = metadata.tokenUsage();
        System.out.println(tokenUsage.inputTokenCount());
        System.out.println(tokenUsage.outputTokenCount());
        System.out.println(tokenUsage.totalTokenCount());
        if (tokenUsage instanceof OpenAiTokenUsage openAiTokenUsage) {
            System.out.println(openAiTokenUsage.inputTokensDetails().cachedTokens());
            System.out.println(openAiTokenUsage.outputTokensDetails().reasoningTokens());
        }

        ChatRequest chatRequest = responseContext.chatRequest();
        System.out.println(chatRequest);

        System.out.println(responseContext.modelProvider());

        Map<Object, Object> attributes = responseContext.attributes();
        System.out.println(attributes.get("my-attribute"));
    }

    @Override
    public void onError(ChatModelErrorContext errorContext) {
        Throwable error = errorContext.error();
        error.printStackTrace();

        ChatRequest chatRequest = errorContext.chatRequest();
        System.out.println(chatRequest);

        System.out.println(errorContext.modelProvider());

        Map<Object, Object> attributes = errorContext.attributes();
        System.out.println(attributes.get("my-attribute"));
    }
};

ChatModel model = OpenAiChatModel.builder()
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName(GPT_4_O_MINI)
        .listeners(List.of(listener))
        .build();

model.chat("Tell me a joke about Java");
```

`attributes`マップを使用すると、同じ`ChatModelListener`の`onRequest`、`onResponse`、`onError`メソッド間、
および複数の`ChatModelListener`間で情報を受け渡すことができます。

## リスナーの動作方法

- リスナーは`List<ChatModelListener>`として指定され、イテレーションの順序で呼び出されます。
- リスナーは同期的に、同じスレッドで呼び出されます。ストリーミングの場合の詳細は以下を参照してください。
  最初のリスナーが戻るまで、2番目のリスナーは呼び出されません。
- `ChatModelListener.onRequest()`メソッドは、LLMプロバイダーAPIを呼び出す直前に呼び出されます。
- `ChatModelListener.onRequest()`メソッドはリクエストごとに1回だけ呼び出されます。
  LLMプロバイダーAPIの呼び出し中にエラーが発生し、再試行が行われた場合、
  `ChatModelListener.onRequest()`は再試行ごとに呼び出されることは**_ありません_**。
- `ChatModelListener.onResponse()`メソッドは1回だけ呼び出されます。
  LLMプロバイダーから正常なレスポンスを受信した直後に呼び出されます。
- `ChatModelListener.onError()`メソッドは1回だけ呼び出されます。
  LLMプロバイダーAPIの呼び出し中にエラーが発生し、再試行が行われた場合、
  `ChatModelListener.onError()`は再試行ごとに呼び出されることは**_ありません_**。
- `ChatModelListener`メソッドの1つから例外がスローされた場合、
  `WARN`レベルでログに記録されます。後続のリスナーの実行は通常通り続行されます。
- `ChatModelRequestContext`、`ChatModelResponseContext`、`ChatModelErrorContext`を通じて提供される`ChatRequest`は、
  `ChatModel`で設定されたデフォルトの`ChatRequestParameters`とリクエスト固有の`ChatRequestParameters`が
  マージされた最終的なリクエストです。
- `StreamingChatModel`の場合、`ChatModelListener.onResponse()`と`ChatModelListener.onError()`は
  `ChatModelListener.onRequest()`とは異なるスレッドで呼び出されます。
  スレッドコンテキストは現在自動的に伝播されないため、`attributes`マップを使用して
  `ChatModelListener.onRequest()`から`ChatModelListener.onResponse()`または`ChatModelListener.onError()`に
  必要なデータを伝播することをお勧めします。
- `StreamingChatModel`の場合、`ChatModelListener.onResponse()`は
  `StreamingChatResponseHandler.onCompleteResponse()`が呼び出される前に呼び出されます。
  `ChatModelListener.onError()`は`StreamingChatResponseHandler.onError()`が呼び出される前に呼び出されます。

## Spring Bootアプリケーションでの可観測性

詳細は[こちら](/tutorials/spring-boot-integration#observability)を参照してください。
