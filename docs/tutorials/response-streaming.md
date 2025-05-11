---
sidebar_position: 5
---

# レスポンスストリーミング

:::note
このページでは低レベルLLM APIによるレスポンスストリーミングについて説明します。
高レベルLLM APIについては[AIサービス](/tutorials/ai-services#streaming)をご覧ください。
:::

LLMはテキストを1トークンずつ生成するため、多くのLLMプロバイダーはテキスト全体が生成されるのを待つのではなく、
トークンごとにレスポンスをストリーミングする方法を提供しています。
これにより、ユーザーは未知の時間待つ必要がなく、ほぼ即座にレスポンスの読み始めることができるため、
ユーザーエクスペリエンスが大幅に向上します。

`ChatModel`と`LanguageModel`インターフェースには、対応する
`StreamingChatModel`と`StreamingLanguageModel`インターフェースがあります。
これらは類似したAPIを持ちますが、レスポンスをストリーミングすることができます。
これらは引数として`StreamingChatResponseHandler`インターフェースの実装を受け取ります。

```java
public interface StreamingChatResponseHandler {

    void onPartialResponse(String partialResponse);

    void onCompleteResponse(ChatResponse completeResponse);

    void onError(Throwable error);
}
```

`StreamingChatResponseHandler`を実装することで、以下のイベントに対するアクションを定義できます：
- 次の部分的なレスポンスが生成されたとき：`onPartialResponse(String partialResponse)`が呼び出されます。
部分的なレスポンスは単一または複数のトークンで構成されることがあります。
例えば、トークンが利用可能になり次第、直接UIに送信することができます。
- LLMが生成を完了したとき：`onCompleteResponse(ChatResponse completeResponse)`が呼び出されます。
`ChatResponse`オブジェクトには完全なレスポンス（`AiMessage`）と`ChatResponseMetadata`が含まれています。
- エラーが発生したとき：`onError(Throwable error)`が呼び出されます。

以下は`StreamingChatModel`でストリーミングを実装する方法の例です：
```java
StreamingChatModel model = OpenAiStreamingChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

String userMessage = "冗談を教えて";

model.chat(userMessage, new StreamingChatResponseHandler() {

    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.println("onPartialResponse: " + partialResponse);
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

レスポンスをストリーミングするより簡潔な方法は、`LambdaStreamingResponseHandler`クラスを使用することです。
このユーティリティクラスは、ラムダ式を使用して`StreamingChatResponseHandler`を作成する静的メソッドを提供します。
ラムダを使用してレスポンスをストリーミングする方法は非常に簡単です。
`onPartialResponse()`静的メソッドを部分的なレスポンスの処理方法を定義するラムダ式と共に呼び出すだけです：

```java
import static dev.langchain4j.model.LambdaStreamingResponseHandler.onPartialResponse;

model.chat("冗談を教えて", onPartialResponse(System.out::print));
```

`onPartialResponseAndError()`メソッドを使用すると、`onPartialResponse()`と`onError()`の両方のイベントに対するアクションを定義できます：

```java
import static dev.langchain4j.model.LambdaStreamingResponseHandler.onPartialResponseAndError;

model.chat("冗談を教えて", onPartialResponseAndError(System.out::print, Throwable::printStackTrace));
```
