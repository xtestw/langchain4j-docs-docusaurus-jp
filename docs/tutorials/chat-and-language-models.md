---
sidebar_position: 2
---

# チャットと言語モデル

:::note
このページでは低レベルのLLM APIについて説明します。
高レベルのLLM APIについては[AIサービス](/tutorials/ai-services)をご覧ください。
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
また、高レベルAPI（[AIサービス](/tutorials/ai-services)）もあり、基本を説明した後で後ほど説明します。

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

これらのバージョンの`chat`メソッドは、入力として1つまたは複数の`ChatMessage`を受け取ります。
`ChatMessage`はチャットメッセージを表す基本インターフェースです。
次のセクションでは、チャットメッセージについて詳しく説明します。

リクエストをカスタマイズしたい場合（モデル名、温度、ツール、JSONスキーマなどを指定する場合）、
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
    .parameters(...) // 共通またはプロバイダー固有のパラメータをまとめて設定することもできます
    .build();

ChatResponse chatResponse = chatModel.chat(chatRequest);
```

### `ChatMessage`の種類
現在、メッセージの「ソース」ごとに4種類のチャットメッセージがあります：

- `UserMessage`：これはユーザーからのメッセージです。
ユーザーはアプリケーションのエンドユーザー（人間）またはアプリケーション自体のいずれかです。
LLMがサポートするモダリティに応じて、`UserMessage`はテキスト（`String`）のみを含むか、
または[他のモダリティ](/tutorials/chat-and-language-models#multimodality)を含むことができます。
- `AiMessage`：これはAIによって生成されたメッセージで、通常は`UserMessage`に応答して生成されます。
お気づきかもしれませんが、generateメソッドは`Response`でラップされた`AiMessage`を返します。
`AiMessage`はテキスト応答（`String`）またはツールを実行するリクエスト（`ToolExecutionRequest`）を含むことができます。
ツールについては[別のセクション](/tutorials/tools)で詳しく説明します。
- `ToolExecutionResultMessage`：これは`ToolExecutionRequest`の結果です。
- `SystemMessage`：これはシステムからのメッセージです。
通常、開発者であるあなたがこのメッセージの内容を定義する必要があります。
通常、ここにはLLMの役割、どのように振る舞うべきか、どのようなスタイルで回答するかなどの指示を書きます。
LLMは他のタイプのメッセージよりも`SystemMessage`により注意を払うように訓練されているため、
注意が必要であり、エンドユーザーに`SystemMessage`を自由に定義したり入力を注入したりする権限を与えないほうが良いでしょう。
通常、会話の冒頭に配置されます。
- `CustomMessage`：これは任意の属性を含むことができるカスタムメッセージです。このメッセージタイプは
それをサポートする`ChatModel`実装でのみ使用できます（現在はOllamaのみ）。

これで`ChatMessage`のすべての種類を知ったので、会話でそれらをどのように組み合わせるかを見てみましょう。

最も単純なシナリオでは、`chat`メソッドに`UserMessage`の単一インスタンスを提供できます。
これは入力として`String`を受け取る最初のバージョンの`chat`メソッドと似ています。
主な違いは、`String`ではなく`ChatResponse`を返すことです。
`AiMessage`に加えて、`ChatResponse`は`ChatResponseMetadata`も含みます。
`ChatResponseMetadata`は`TokenUsage`を含み、これには入力（generateメソッドに提供したすべての`ChatMessage`）に含まれるトークン数、
出力（`AiMessage`内）として生成されたトークン数、および合計（入力+出力）に関する統計が含まれます。
この情報は、LLMへの特定の呼び出しがどれだけのコストがかかるかを計算するために必要です。
また、`ChatResponseMetadata`には`FinishReason`も含まれており、
これは生成が停止した様々な理由を示す列挙型です。
通常、LLMが自ら生成を停止することを決定した場合は`FinishReason.STOP`になります。

内容に応じて`UserMessage`を作成する方法はいくつかあります。
最も単純なのは`new UserMessage("Hi")`または`UserMessage.from("Hi")`です。

### 複数の`ChatMessage`
では、なぜ1つだけでなく、複数の`ChatMessage`を入力として提供する必要があるのでしょうか？
これは、LLMが本質的にステートレスであり、会話の状態を維持しないためです。
したがって、複数ターンの会話をサポートしたい場合は、会話の状態を管理する必要があります。

チャットボットを構築したいとします。ユーザーとチャットボット（AI）の間の単純な複数ターンの会話を想像してみてください：
- ユーザー：こんにちは、私の名前はKlausです
- AI：こんにちはKlausさん、どのようにお手伝いできますか？
- ユーザー：私の名前は何ですか？
- AI：Klausです

これが`ChatModel`との対話がどのようになるかです：
```java
UserMessage firstUserMessage = UserMessage.from("Hello, my name is Klaus");
AiMessage firstAiMessage = model.chat(firstUserMessage).aiMessage(); // Hi Klaus, how can I help you?
UserMessage secondUserMessage = UserMessage.from("What is my name?");
AiMessage secondAiMessage = model.chat(firstUserMessage, firstAiMessage, secondUserMessage).aiMessage(); // Klaus
```
ご覧のように、`chat`メソッドの2回目の呼び出しでは、単一の`secondUserMessage`だけでなく、
会話の前のメッセージも提供しています。

これらのメッセージを手動で維持・管理することは面倒です。
そのため、`ChatMemory`の概念が存在し、これについては[次のセクション](/tutorials/chat-memory)で詳しく説明します。

### マルチモダリティ

`UserMessage`はテキストだけでなく、他のタイプのコンテンツも含むことができます。
`UserMessage`は`List<Content> contents`を含みます。
`Content`はインターフェースであり、以下の実装があります：
- `TextContent`
- `ImageContent`
- `AudioContent`
- `VideoContent`
- `PdfFileContent`

どのLLMプロバイダーがどのモダリティをサポートしているかは、[こちら](/integrations/language-models)の比較表で確認できます。

以下はテキストと画像の両方をLLMに送信する例です：
```java
UserMessage userMessage = UserMessage.from(
    TextContent.from("Describe the following image"),
    ImageContent.from("https://example.com/cat.jpg")
);
ChatResponse response = model.chat(userMessage);
```

#### テキストコンテンツ
`TextContent`は単純なテキストを表す最も単純な形式の`Content`で、単一の`String`をラップします。
`UserMessage.from(TextContent.from("Hello!"))`は`UserMessage.from("Hello!")`と同等です。

`UserMessage`内に1つまたは複数の`TextContent`を提供できます：
```java
UserMessage userMessage = UserMessage.from(
    TextContent.from("Hello!"),
    TextContent.from("How are you?")
);
```

#### 画像コンテンツ
LLMプロバイダーに応じて、`ImageContent`は**リモート**画像のURL（上記の例を参照）から作成するか、
Base64エンコードされたバイナリデータから作成できます：
```java
byte[] imageBytes = readBytes("/home/me/cat.jpg");
String base64Data = Base64.getEncoder().encodeToString(imageBytes);
ImageContent imageContent = ImageContent.from(base64Data, "image/jpg");
UserMessage userMessage = UserMessage.from(imageContent);
```

また、モデルが画像を処理する方法を制御するために`DetailLevel`列挙型（`LOW`/`HIGH`/`AUTO`オプション）を指定することもできます。
詳細は[こちら](https://platform.openai.com/docs/guides/vision#low-or-high-fidelity-image-understanding)をご覧ください。

#### 音声コンテンツ
`AudioContent`は`ImageContent`に似ていますが、音声コンテンツを表します。

#### ビデオコンテンツ
`VideoContent`は`ImageContent`に似ていますが、ビデオコンテンツを表します。

#### PDFファイルコンテンツ
`PdfFileContent`は`ImageContent`に似ていますが、PDFファイルのバイナリコンテンツを表します。

### Kotlin拡張機能

`ChatModel` [Kotlin拡張機能](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-kotlin/src/main/kotlin/dev/langchain4j/kotlin/model/chat/ChatModelExtensions.kt)は、Kotlinの[コルーチン](https://kotlinlang.org/docs/coroutines-guide.html)機能を活用して、言語モデルとのチャット対話を処理する非同期メソッドを提供します。`chatAsync`メソッドは、`ChatRequest`または`ChatRequest.Builder`構成のノンブロッキング処理を可能にし、モデルの返信を含む`ChatResponse`を返します。同様に、`generateAsync`はチャットメッセージからの応答の非同期生成を処理します。これらの拡張機能により、Kotlinアプリケーションでのチャットリクエストの構築と会話の効率的な処理が簡素化されます。これらのメソッドは実験的なものとしてマークされており、時間とともに進化する可能性があることに注意してください。

**`ChatModel.chatAsync(request: ChatRequest)`**：Kotlinコルーチン用に設計されたこの*非同期*拡張関数は、同期的な`chat`メソッドを`Dispatchers.IO`を使用してコルーチンスコープ内でラップします。これにより、アプリケーションの応答性を維持するために重要なノンブロッキング操作が可能になります。既存の同期的な`chat`との競合を避けるために、特に`chatAsync`と名付けられています。その関数シグネチャは：`suspend fun ChatModel.chatAsync(request: ChatRequest): ChatResponse`です。キーワード`suspend`はそれがコルーチン関数であることを示します。

**`ChatModel.chat(block: ChatRequestBuilder.() -> Unit)`**：この`chat`のバリアントは、KotlinのタイプセーフビルダーDSLを使用することで、よりスリムなアプローチを提供します。これにより、`ChatRequest`オブジェクトの構築が簡素化され、内部的には非同期実行のために`chatAsync`を使用します。このバージョンは、コルーチンを通じて簡潔さとノンブロッキング動作の両方を提供します。
