---
sidebar_position: 3
---

# チャットメモリ

`ChatMessage`を手動で維持・管理することは面倒です。
そのため、LangChain4jは`ChatMemory`抽象化と複数の組み込み実装を提供しています。

`ChatMemory`は、スタンドアロンの低レベルコンポーネントとして、
または[AIサービス](/tutorials/ai-services)のような高レベルコンポーネントの一部として使用できます。

`ChatMemory`は`ChatMessage`のコンテナ（`List`によってバックアップされる）として機能し、以下のような追加機能があります：
- 退避ポリシー
- 永続性
- `SystemMessage`の特別な扱い
- [ツール](/tutorials/tools)メッセージの特別な扱い

## メモリと履歴

「メモリ」と「履歴」は似ているが異なる概念であることに注意してください。
- 履歴はユーザーとAIの間の**すべての**メッセージを**そのまま**保持します。履歴はユーザーがUIで見るものです。実際に言われたことを表します。
- メモリは**一部の情報**を保持し、LLMに提示して会話を「記憶」しているかのように振る舞わせます。
メモリは履歴とはかなり異なります。使用されるメモリアルゴリズムによって、履歴をさまざまな方法で変更できます：
一部のメッセージを退避する、複数のメッセージを要約する、個別のメッセージを要約する、メッセージから重要でない詳細を削除する、
メッセージに追加情報（RAGの場合など）や指示（構造化出力の場合など）を挿入するなどです。

LangChain4jは現在「メモリ」のみを提供し、「履歴」は提供していません。完全な履歴を保持する必要がある場合は、手動で行ってください。

## 退避ポリシー

退避ポリシーはいくつかの理由で必要です：
- LLMのコンテキストウィンドウに収めるため。LLMが一度に処理できるトークン数には上限があります。
ある時点で、会話がこの制限を超える可能性があります。そのような場合、一部のメッセージを退避する必要があります。
通常、最も古いメッセージが退避されますが、必要に応じてより洗練されたアルゴリズムを実装することもできます。
- コストを制御するため。各トークンにはコストがあり、LLMへの各呼び出しが徐々に高価になります。
不要なメッセージを退避することでコストを削減できます。
- レイテンシーを制御するため。LLMに送信されるトークンが多いほど、処理に時間がかかります。

現在、LangChain4jは2つの組み込み実装を提供しています：
- よりシンプルな`MessageWindowChatMemory`は、スライディングウィンドウとして機能し、
  最新の`N`個のメッセージを保持し、もはや収まらない古いメッセージを退避します。
  ただし、各メッセージには様々な数のトークンが含まれる可能性があるため、
`MessageWindowChatMemory`は主に迅速なプロトタイピングに役立ちます。
- より洗練されたオプションは`TokenWindowChatMemory`で、
  これもスライディングウィンドウとして機能しますが、最新の`N`個の**トークン**を保持することに焦点を当て、
  必要に応じて古いメッセージを退避します。
  メッセージは分割できません。メッセージが収まらない場合、完全に退避されます。
  `TokenWindowChatMemory`は各`ChatMessage`のトークンを数えるための`TokenCountEstimator`を必要とします。

## 永続性

デフォルトでは、`ChatMemory`実装はメモリ内に`ChatMessage`を保存します。

永続性が必要な場合、カスタム`ChatMemoryStore`を実装して、
選択した任意の永続ストアに`ChatMessage`を保存できます：
```java
class PersistentChatMemoryStore implements ChatMemoryStore {

        @Override
        public List<ChatMessage> getMessages(Object memoryId) {
          // TODO: メモリIDによって永続ストアからすべてのメッセージを取得する実装。
          // ChatMessageDeserializer.messageFromJson(String)と
          // ChatMessageDeserializer.messagesFromJson(String)ヘルパーメソッドを使用して、
          // JSONからチャットメッセージを簡単にデシリアライズできます。
        }

        @Override
        public void updateMessages(Object memoryId, List<ChatMessage> messages) {
            // TODO: メモリIDによって永続ストア内のすべてのメッセージを更新する実装。
            // ChatMessageSerializer.messageToJson(ChatMessage)と
            // ChatMessageSerializer.messagesToJson(List<ChatMessage>)ヘルパーメソッドを使用して、
            // チャットメッセージをJSONに簡単にシリアライズできます。
        }

        @Override
        public void deleteMessages(Object memoryId) {
          // TODO: メモリIDによって永続ストア内のすべてのメッセージを削除する実装。
        }
    }

ChatMemory chatMemory = MessageWindowChatMemory.builder()
        .id("12345")
        .maxMessages(10)
        .chatMemoryStore(new PersistentChatMemoryStore())
        .build();
```

`updateMessages()`メソッドは、新しい`ChatMessage`が`ChatMemory`に追加されるたびに呼び出されます。
これは通常、LLMとの各対話中に2回発生します：
新しい`UserMessage`が追加されたときと、新しい`AiMessage`が追加されたときです。
`updateMessages()`メソッドは、指定されたメモリIDに関連付けられたすべてのメッセージを更新することが期待されています。
`ChatMessage`は、個別に（例：メッセージごとに1つのレコード/行/オブジェクト）
または一緒に（例：`ChatMemory`全体に対して1つのレコード/行/オブジェクト）保存できます。

:::note
`ChatMemory`から退避されたメッセージは`ChatMemoryStore`からも退避されることに注意してください。
メッセージが退避されると、`updateMessages()`メソッドが呼び出され、
退避されたメッセージを含まないメッセージのリストが渡されます。
:::

`getMessages()`メソッドは、`ChatMemory`のユーザーがすべてのメッセージをリクエストするたびに呼び出されます。
これは通常、LLMとの各対話中に1回発生します。
`Object memoryId`引数の値は、`ChatMemory`の作成時に指定された`id`に対応します。
これを使用して、複数のユーザーや会話を区別できます。
`getMessages()`メソッドは、指定されたメモリIDに関連付けられたすべてのメッセージを返すことが期待されています。

`deleteMessages()`メソッドは、`ChatMemory.clear()`が呼び出されるたびに呼び出されます。
この機能を使用しない場合は、このメソッドを空のままにしておくことができます。

## `SystemMessage`の特別な扱い

`SystemMessage`は特別なタイプのメッセージであるため、他のメッセージタイプとは異なる扱いを受けます：
- 一度追加されると、`SystemMessage`は常に保持されます。
- 一度に保持できる`SystemMessage`は1つだけです。
- 同じ内容の新しい`SystemMessage`が追加された場合、それは無視されます。
- 異なる内容の新しい`SystemMessage`が追加された場合、それは前のものを置き換えます。

## ツールメッセージの特別な扱い

`ToolExecutionRequest`を含む`AiMessage`が退避された場合、
以下の孤立した`ToolExecutionResultMessage`も自動的に退避されます。
これは、リクエストに孤立した`ToolExecutionResultMessage`を送信することを禁止している
一部のLLMプロバイダー（OpenAIなど）との問題を回避するためです。

## 例
- `AiServices`を使用：
  - [チャットメモリ](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryExample.java)
  - [各ユーザーごとの個別チャットメモリ](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithMemoryForEachUserExample.java)
  - [永続的チャットメモリ](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryExample.java)
  - [各ユーザーごとの永続的チャットメモリ](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ServiceWithPersistentMemoryForEachUserExample.java)
- レガシーな`Chain`を使用：
  - [ConversationalChainを使用したチャットメモリ](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ChatMemoryExamples.java)
  - [ConversationalRetrievalChainを使用したチャットメモリ](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/ChatWithDocumentsExamples.java)

## 関連チュートリアル
- [LangChain4j ChatMemoryを使用した生成AIの会話](https://www.sivalabs.in/generative-ai-conversations-using-langchain4j-chat-memory/) by [Siva](https://www.sivalabs.in/)
