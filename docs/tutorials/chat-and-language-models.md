---
sidebar_position: 2
---

# チャットと言語モデル

:::note
このページでは低レベルのLLM APIについて説明します。
高レベルのLLM APIについては[AI Services](/tutorials/ai-services)をご覧ください。
:::

:::note
サポートされているすべてのLLMは[こちら](/integrations/language-models)で確認できます。
:::

LLMは現在、2種類のAPIタイプで利用可能です：
- `LanguageModel`。そのAPIは非常にシンプルで、入力として`String`を受け取り、出力として`String`を返します。
このAPIは現在、チャットAPI（2番目のAPIタイプ）に取って代わられつつあります。
- `ChatModel`。これらは入力として複数の`ChatMessage`を受け取り、出力として単一の`AiMessage`を返します。
`ChatMessage`は通常テキストを含みますが、一部のLLMは他のモダリティ（画像、音声など）もサポートしています。
そのようなチャットモデルの例には、OpenAIの`gpt-4o-mini`やGoogleの`gemini-1.5-pro`があります。

LangChain4jでは`LanguageModel`のサポートはこれ以上拡張されないため、
すべての新機能では`ChatModel` APIを使用します。

`ChatModel`はLangChain4jでLLMと対話するための低レベルAPIであり、最も強力で柔軟性を提供します。
また、高レベルAPI（[AI Services](/tutorials/ai-services)）もあり、基本を説明した後で後ほど説明します。

`ChatModel`と`LanguageModel`の他に、LangChain4jは以下のタイプのモデルをサポートしています：
- `EmbeddingModel` - このモデルはテキストを`Embedding`に変換できます。
- `ImageModel` - このモデルは`Image`を生成および編集できます。
- `ModerationModel` - このモデルはテキストに有害なコンテンツが含まれているかどうかを確認できます。
- `ScoringModel` - このモデルはクエリに対して複数のテキスト片をスコアリング（またはランク付け）し、
本質的に各テキスト片がクエリにどれだけ関連しているかを判断します。これは[RAG](/tutorials/rag)に役立ちます。
これらについては後ほど説明します。

では、`ChatModel` APIをより詳しく見てみましょう。

```java
public interface ChatModel {

    String chat(String userMessage);
    
    ...
}
```
ご覧のように、`LanguageModel`と同様に、入力として`String`を受け取り、出力として`String`を返す単純な`chat`メソッドがあります。
これは単なる便宜的なメソッドで、`String`を`UserMessage`でラップする必要なく、素早く簡単に試すことができます。

他のチャットAPIメソッドは以下の通りです：
```java
    ...
    
    ChatResponse chat(ChatMessage... messages);

    ChatResponse chat(List<ChatMessage> messages);
        
    ...
```

これらのバージョンの`chat`メソッドは、1つまたは複数の`ChatMessage`を入力として受け取ります。
`ChatMessage`はチャットメッセージを表す基本インターフェースです。
次のセクションでチャットメッセージについて詳しく説明します。

リクエストをカスタマイズしたい場合（例：モデル名、temperature、ツール、JSON schemaなどの指定）、
`chat(ChatRequest)`メソッドを使用できます：
```java
    ...
    
    ChatResponse chat(ChatRequest chatRequest);
        
    ...
```

```java
ChatRequest chatRequest = ChatRequest.builder()
    .messages(...)
    .modelName(...)
    .temperature(...)
    .topP(...)
    .topK(...)
    .frequencyPenalty(...)
    .presencePenalty(...)
    .maxOutputTokens(...)
    .stopSequences(...)
    .toolSpecifications(...)
    .toolChoice(...)
    .responseFormat(...)
    .parameters(...) // you can also set common or provider-specific parameters all at once
    .build();

ChatResponse chatResponse = chatModel.chat(chatRequest);
```

### `ChatMessage`の種類
現在、メッセージの各「ソース」に対応する5種類のチャットメッセージがあります：

- `UserMessage`：ユーザーからのメッセージです。
  ユーザーはアプリケーションのエンドユーザー（人間）またはアプリケーション自体のいずれかです。
  以下を含めることができます：
    - `contents()`：メッセージの内容。LLMがサポートするモダリティに応じて、
      単一のテキスト（`String`）のみ、
      または[他のモダリティ](/tutorials/chat-and-language-models#multimodality)を含むことができます。
    - `name()`：ユーザーの名前。すべてのモデルプロバイダーがサポートしているわけではありません。
    - `attributes()`：追加属性：これらの属性はモデルに送信されませんが、
      [`ChatMemory`](/tutorials/chat-memory)に保存されます。
- `AiMessage`：送信されたメッセージに対してAIが生成したメッセージです。
  以下を含めることができます：
    - `text()`：テキストコンテンツ
    - `thinking()`：思考/推論コンテンツ
    - `toolExecutionRequests()`：ツールを実行するリクエスト。ツールについては
      [別のセクション](/tutorials/tools)で説明します。
    - `attributes()`：追加属性。通常はプロバイダー固有です
- `ToolExecutionResultMessage`：これは`ToolExecutionRequest`の結果です。
- `SystemMessage`：システムからのメッセージです。
通常、開発者であるあなたがこのメッセージの内容を定義する必要があります。
通常、ここではLLMのこの会話における役割、
どのように振る舞うべきか、どのようなスタイルで回答するかなどの指示を書きます。
LLMは他の種類のメッセージよりも`SystemMessage`に注意を払うよう訓練されているため、
注意が必要であり、エンドユーザーに`SystemMessage`を自由に定義させたり、入力を注入させたりしない方がよいです。
通常、会話の開始位置に配置されます。
- `CustomMessage`：任意の属性を含むことができるカスタムメッセージです。このメッセージタイプは、
それをサポートする`ChatModel`実装でのみ使用できます（現在はOllamaのみ）。

すべての種類の`ChatMessage`を理解したので、会話でそれらをどのように組み合わせるかを見てみましょう。

最も単純なシナリオでは、`chat`メソッドに単一の`UserMessage`インスタンスを提供できます。
これは、入力として`String`を受け取る最初のバージョンの`chat`メソッドと似ています。
ここでの主な違いは、`String`ではなく`ChatResponse`を返すことです。
`AiMessage`に加えて、`ChatResponse`には`ChatResponseMetadata`も含まれます。
`ChatResponseMetadata`には`TokenUsage`が含まれており、入力
（generateメソッドに提供したすべての`ChatMessage`）にいくつのトークンが含まれていたか、
出力としていくつのトークンが生成されたか（`AiMessage`内）、および合計（入力 + 出力）に関する統計が含まれています。
この情報は、LLMへの特定の呼び出しのコストを計算するために必要です。
次に、`ChatResponseMetadata`には`FinishReason`も含まれており、
これは生成が停止したさまざまな理由を持つ列挙型です。
通常、LLMが自ら生成を停止することを決定した場合、`FinishReason.STOP`になります。

内容に応じて、`UserMessage`を作成する方法は複数あります。
最も単純なものは`new UserMessage("Hi")`または`UserMessage.from("Hi")`です。

### 複数の`ChatMessage`
では、なぜ1つだけでなく、複数の`ChatMessage`を入力として提供する必要があるのでしょうか？
これは、LLMが本質的にステートレスであり、会話の状態を維持しないためです。
したがって、マルチターン会話をサポートしたい場合は、会話の状態を管理する必要があります。

チャットボットを構築したいとしましょう。ユーザーとチャットボット（AI）の間の単純なマルチターン会話を想像してください：
- ユーザー：Hello, my name is Klaus
- AI：Hi Klaus, how can I help you?
- ユーザー：What is my name?
- AI：Klaus

`ChatModel`とのやり取りは次のようになります：
```java
UserMessage firstUserMessage = UserMessage.from("Hello, my name is Klaus");
AiMessage firstAiMessage = model.chat(firstUserMessage).aiMessage(); // Hi Klaus, how can I help you?
UserMessage secondUserMessage = UserMessage.from("What is my name?");
AiMessage secondAiMessage = model.chat(firstUserMessage, firstAiMessage, secondUserMessage).aiMessage(); // Klaus
```
ご覧のように、`chat`メソッドの2回目の呼び出しでは、単一の`secondUserMessage`だけでなく、
会話の以前のメッセージも提供しています。

これらのメッセージを手動で維持および管理するのは面倒です。
そのため、`ChatMemory`の概念が存在し、[次のセクション](/tutorials/chat-memory)で説明します。

### マルチモダリティ

`UserMessage`にはテキストだけでなく、他の種類のコンテンツも含めることができます。
`UserMessage`には`List<Content> contents`が含まれています。
`Content`はインターフェースであり、以下の実装があります：
- `TextContent`
- `ImageContent`
- `AudioContent`
- `VideoContent`
- `PdfFileContent`

どのLLMプロバイダーがどのモダリティをサポートしているかは、比較表[こちら](/integrations/language-models)で確認できます。

テキストと画像の両方をLLMに送信する例を次に示します：
```java
UserMessage userMessage = UserMessage.from(
    TextContent.from("Describe the following image"),
    ImageContent.from("https://example.com/cat.jpg")
);
ChatResponse response = model.chat(userMessage);
```

#### テキストコンテンツ
`TextContent`は、プレーンテキストを表し、単一の`String`をラップする最も単純な形式の`Content`です。
`UserMessage.from(TextContent.from("Hello!"))`は`UserMessage.from("Hello!")`と同等です。

`UserMessage`内に1つまたは複数の`TextContent`を提供できます：
```java
UserMessage userMessage = UserMessage.from(
    TextContent.from("Hello!"),
    TextContent.from("How are you?")
);
```

#### 画像コンテンツ
LLMプロバイダーに応じて、`ImageContent`は**リモート**画像のURLから作成するか（上記の例を参照）、
Base64エンコードされたバイナリデータから作成できます：
```java
byte[] imageBytes = readBytes("/home/me/cat.jpg");
String base64Data = Base64.getEncoder().encodeToString(imageBytes);
ImageContent imageContent = ImageContent.from(base64Data, "image/jpg");
UserMessage userMessage = UserMessage.from(imageContent);
```

モデルが画像を処理する方法を制御するために、`DetailLevel`列挙型（`LOW`/`HIGH`/`AUTO`オプション）を指定することもできます。
詳細は[こちら](https://platform.openai.com/docs/guides/vision#low-or-high-fidelity-image-understanding)をご覧ください。

#### 音声コンテンツ
`AudioContent`は`ImageContent`と似ていますが、音声コンテンツを表します。

#### 動画コンテンツ
`VideoContent`は`ImageContent`と似ていますが、動画コンテンツを表します。

#### PDFファイルコンテンツ
`PdfFileContent`は`ImageContent`と似ていますが、PDFファイルのバイナリコンテンツを表します。

### Kotlin拡張機能

`ChatModel`の[Kotlin拡張機能](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-kotlin/src/main/kotlin/dev/langchain4j/kotlin/model/chat/ChatModelExtensions.kt)は、Kotlinの[コルーチン](https://kotlinlang.org/docs/coroutines-guide.html)機能を活用して、言語モデルとのチャット対話を処理する非同期メソッドを提供します。`chatAsync`メソッドは、`ChatRequest`または`ChatRequest.Builder`構成の非ブロッキング処理を可能にし、モデルの応答を含む`ChatResponse`を返します。同様に、`generateAsync`はチャットメッセージからの応答の非同期生成を処理します。これらの拡張機能は、Kotlinアプリケーションでチャットリクエストを構築し、会話を効率的に処理することを簡素化します。これらのメソッドは実験的としてマークされており、時間とともに進化する可能性があることに注意してください。

**`ChatModel.chatAsync(request: ChatRequest)`**：Kotlinコルーチン向けに設計されたこの*非同期*拡張関数は、`Dispatchers.IO`を使用するコルーチンスコープ内で同期的な`chat`メソッドをラップします。これにより非ブロッキング操作が可能になり、アプリケーションの応答性を維持するために重要です。既存の同期的な`chat`との競合を避けるために、特に`chatAsync`と名付けられています。関数シグネチャは次のとおりです：`suspend fun ChatModel.chatAsync(request: ChatRequest): ChatResponse`。キーワード`suspend`は、それをコルーチン関数として指定します。

**`ChatModel.chat(block: ChatRequestBuilder.() -> Unit)`**：この`chat`のバリアントは、Kotlinの型安全なビルダーDSLを使用することで、より効率的なアプローチを提供します。`ChatRequest`オブジェクトの構築を簡素化しながら、内部的に`chatAsync`を使用して非同期実行を行います。このバージョンは、コルーチンを通じて簡潔さと非ブロッキング動作の両方を提供します。
