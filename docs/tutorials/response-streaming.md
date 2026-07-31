---
sidebar_position: 5
---

# レスポンスのストリーミング

:::note
このページでは、低レベル LLM API によるレスポンスのストリーミングについて説明します。
高レベル LLM API については [AI Services](/tutorials/ai-services#streaming) を参照してください。
:::

LLM は一度に 1 トークンずつテキストを生成するため、多くの LLM プロバイダーは、
テキスト全体の生成を待たずにトークン単位でレスポンスをストリームする手段を提供しています。
これによりユーザー体験が大きく向上します。ユーザーは不明な時間を待つ必要がなく、
ほぼ即座にレスポンスの読み取りを開始できます。

`ChatModel` および `LanguageModel` インターフェースに対応して、
`StreamingChatModel` および `StreamingLanguageModel` インターフェースがあります。
API は似ていますが、レスポンスをストリームできます。
引数として `StreamingChatResponseHandler` インターフェースの実装を受け取ります。

```java
public interface StreamingChatResponseHandler {

    default void onPartialResponse(String partialResponse) {}
    default void onPartialResponse(PartialResponse partialResponse, PartialResponseContext context) {}

    default void onPartialThinking(PartialThinking partialThinking) {}
    default void onPartialThinking(PartialThinking partialThinking, PartialThinkingContext context) {}

    default void onPartialToolCall(PartialToolCall partialToolCall) {}
    default void onPartialToolCall(PartialToolCall partialToolCall, PartialToolCallContext context) {}

    default void onCompleteToolCall(CompleteToolCall completeToolCall) {}

    default void onUnmappedRawEvent(Object rawEvent) {}

    void onCompleteResponse(ChatResponse completeResponse);

    void onError(Throwable error);
}
```

`StreamingChatResponseHandler` を実装することで、次のイベントに対する処理を定義できます：
- 次の部分テキストレスポンスが生成されたとき：`onPartialResponse(String)`
または `onPartialResponse(PartialResponse, PartialResponseContext)` が呼び出されます（いずれかを実装すれば十分です）。
LLM プロバイダーによっては、部分レスポンスのテキストは 1 つ以上のトークンで構成されます。
たとえば、トークンが利用可能になり次第、UI に直接送信できます。
- 次の部分的な思考/推論テキストが生成されたとき：`onPartialThinking(PartialThinking)`
または `onPartialThinking(PartialThinking, PartialThinkingContext)` が呼び出されます（いずれかを実装すれば十分です）。
LLM プロバイダーによっては、部分的な思考テキストは 1 つ以上のトークンで構成されます。
- 次の[部分的なツール呼び出し](/tutorials/tools#using-streamingchatmodel)が生成されたとき：`onPartialToolCall(PartialToolCall)`
または `onPartialToolCall(PartialToolCall, PartialToolCallContext)` が呼び出されます（いずれかを実装すれば十分です）。
- LLM が単一のツール呼び出しのストリーミングを完了したとき：`onCompleteToolCall(CompleteToolCall)` が呼び出されます。
- プロバイダーが上記の型付きコールバックのいずれにもまだ公開されていない生のストリーミングイベントを発行したとき：
`onUnmappedRawEvent(Object)` が呼び出されます。下記の[未マッピングの生イベント](#unmapped-raw-events)を参照してください。
- LLM が生成を完了したとき：`onCompleteResponse(ChatResponse)` が呼び出されます。
`ChatResponse` オブジェクトには完全なレスポンス（`AiMessage`）および `ChatResponseMetadata` が含まれます。
- エラーが発生したとき：`onError(Throwable error)` が呼び出されます。

以下は `StreamingChatModel` でストリーミングを実装する例です：
```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

String userMessage = "Tell me a joke";

model.chat(userMessage, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("onPartialResponse: " + partialResponse);
    }

    @Override
    public void onPartialThinking(PartialThinking partialThinking) {
        System.out.println("onPartialThinking: " + partialThinking);
    }

    @Override
    public void onPartialToolCall(PartialToolCall partialToolCall) {
        System.out.println("onPartialToolCall: " + partialToolCall);
    }

    @Override
    public void onCompleteToolCall(CompleteToolCall completeToolCall) {
        System.out.println("onCompleteToolCall: " + completeToolCall);
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("onCompleteResponse: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

よりコンパクトにストリームする方法は、`LambdaStreamingResponseHandler` クラスを使うことです。
このユーティリティクラスは、ラムダ式で `StreamingChatResponseHandler` を作成する静的メソッドを提供します。
ラムダでレスポンスをストリームする方法は非常にシンプルです。
部分レスポンスの扱いを定義するラムダ式を渡して `onPartialResponse()` 静的メソッドを呼び出すだけです：

```java
import static dev.langchain4j.model.LambdaStreamingResponseHandler.onPartialResponse;

model.chat("Tell me a joke", onPartialResponse(System.out::print));
```

`onPartialResponseAndError()` メソッドでは、
`onPartialResponse()` と `onError()` の両方のイベントに対する処理を定義できます：

```java
import static dev.langchain4j.model.LambdaStreamingResponseHandler.onPartialResponseAndError;

model.chat("Tell me a joke", onPartialResponseAndError(System.out::print, Throwable::printStackTrace));
```

## 未マッピングの生イベント

:::note
これは高度なユースケース向けの実験的機能です。API は将来変更される可能性があります。
:::

ほとんどのアプリケーションは上記の型付きコールバックだけで十分です。しかし、一部の LLM プロバイダーは、
LangChain4j が（まだ）専用コールバックにマッピングしていない追加のストリーミングイベントを発行します。たとえば、
`web_search` のような OpenAI のサーバーサイドツールのライフサイクルイベント
（`response.web_search_call.in_progress`、`response.web_search_call.searching`、
`response.web_search_call.completed`）です。

`onUnmappedRawEvent(Object rawEvent)` コールバックは、そのようなイベントへのアクセスを提供します。
型付きコールバック（`onPartialResponse`、`onPartialThinking`、`onPartialToolCall`、`onCompleteToolCall`、`onCompleteResponse`）
のいずれにも**まだ**公開されていないイベントに対して**のみ**呼び出されます。
言い換えると、部分レスポンス、思考、ツール呼び出しは未マッピングの生イベントとして**繰り返されない**ため、
重複なく両方を消費できます。

`rawEvent` の具体的な型はプロバイダー実装に依存します：

| プロバイダー | 生イベントの型 |
|----------|----------------|
| OpenAI、Anthropic、Google AI Gemini、Mistral、Ollama | `dev.langchain4j.http.client.sse.ServerSentEvent` |
| OpenAI（公式）- Responses API | `com.openai.models.responses.ResponseStreamEvent` |
| OpenAI（公式）- Chat Completions API | `com.openai.models.chat.completions.ChatCompletionChunk` |
| Amazon Bedrock | `software.amazon.awssdk.services.bedrockruntime.model.ConverseStreamOutput` |
| Google GenAI | `com.google.genai.types.GenerateContentResponse` |

イベント型はプロバイダー固有のため、通常は `instanceof` で検査してキャストします：
```java
model.chat(userMessage, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("onPartialResponse: " + partialResponse);
    }

    @Override
    public void onUnmappedRawEvent(Object rawEvent) {
        if (rawEvent instanceof ServerSentEvent sse) {
            System.out.println("Raw SSE event: " + sse.event() + " -> " + sse.data());
        }
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("onCompleteResponse: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

[AI Services](/tutorials/ai-services#streaming) を使用する場合、同じイベントは
`TokenStream.onUnmappedRawEvent(Consumer<Object>)` コールバック経由で利用できます。

## ストリーミングのキャンセル

ストリーミングをキャンセルしたい場合は、次のいずれかのメソッドから行えます：
- `onPartialResponse(PartialResponse, PartialResponseContext)`
- `onPartialThinking(PartialThinking, PartialThinkingContext)`
- `onPartialToolCall(PartialToolCall, PartialToolCallContext)`

コンテキストオブジェクトには、ストリーミングをキャンセルするために使える `StreamingHandle` が含まれます：
```java
model.chat(userMessage, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(PartialResponse partialResponse, PartialResponseContext context) {
        process(partialResponse);
        if (shouldCancel()) {
            context.streamingHandle().cancel();
        }
    }

    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        System.out.println("onCompleteResponse: " + completeResponse);
    }

    @Override
    public void onError(Throwable error) {
        error.printStackTrace();
    }
});
```

`StreamingHandle.cancel()` が呼び出されると、LangChain4j は接続を閉じてストリーミングを停止します。
`StreamingHandle.cancel()` が呼び出された後、`StreamingChatResponseHandler` はそれ以上コールバックを受け取りません。
