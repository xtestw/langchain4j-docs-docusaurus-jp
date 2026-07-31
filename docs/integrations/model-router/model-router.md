---
sidebar_position: 1
---

# Model Router

これは `ModelRouter` のドキュメントです。複数の `ChatModel` インスタンスへメッセージを振り分けるルーターとして動作し、差し替え可能な `RoutingStrategies` を使用します。
このモジュールには 2 つのデフォルト実装があります：`FailoverStrategy` と `LowestTokenUsageRoutingStrategy`。


## Maven依存関係

`langchain4j-community-model-router` ライブラリは Maven Central で利用できます。

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-model-router</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```
## FailoverStrategy

`FailoverStrategy` は、登録順で最初に利用可能なモデルへメッセージを送信します。そのモデルが失敗（エラー発生）した場合、メッセージは直ちに次のモデルへ送られます。この戦略は失敗した `ChatModel` をクールダウン期間中は無視し、その後に再試行します。デフォルトのクールダウンは 1 分です。すべてのモデルが失敗した場合は `NoMatchingModelFoundException` がスローされます。


```java
	ChatModel firstModel = AzureOpenAiChatModel.builder()
		...
         .build();

    ChatModel secondModel = OpenAiOfficialChatModel.builder()
		...
         .build();

    ModelRouter router = ModelRouter.builder()
        .addRoutes(firstModel, secondModel)
        .routingStrategy(new FailoverStrategy(Duration.ofMinutes(5)))
        .build();
            
   router.chat(new UserMessage("Provide 3 short bullet points explaining why Java is awesome"));
	   
	   
```

これで、最初のモデルが失敗した場合、メッセージは 2 番目のモデルへ送られます。

:::note

`FailoverStrategy` はあるモデルが失敗すると次のモデルへメッセージを送るため、そのモデルがスローした例外は呼び出し側から隠されます。追跡したい場合はエラーリスナーを登録する必要があります。

:::


## LowestTokenUsageRoutingStrategy

`LowestTokenUsageRoutingStrategy` は、全体のトークン消費量が最も少ないモデルへメッセージを送信します。

```java
ChatModel firstModel = AzureOpenAiChatModel.builder()
	...
     .build();

ChatModel secondModel = OpenAiOfficialChatModel.builder()
	...
     .build();

ModelRouter router = ModelRouter.builder()
        .addRoutes(firstModel, secondModel)
        .routingStrategy(new LowestTokenUsageRoutingStrategy())
        .build();


ChatResponse first = router.chat(new UserMessage("Hello")); // uses first model    

ChatResponse second = router.chat(new UserMessage("Hello")); // uses second model

ChatResponse third = router.chat(new UserMessage("Hello")); // uses first model  
	   	   
```
## カスタム実装

関数型インターフェース `ModelRoutingStrategy` を実装することで、独自の戦略を作成できます。

```java
interface ModelRoutingStrategy {

    /**
     * Determines the route key to use for the given chat messages.
     *
     * @param availableModels
     *            all configured models, including any routing metadata
     * @param chatRequest
     *            the incoming chat request
     * @return the key of the route to use
     */
    ChatModelWrapper route(List<ChatModelWrapper> availableModels, ChatRequest chatRequest);
}
```

例えば、コンテキストウィンドウが小さいモデルと、より高価だが大きなコンテキストウィンドウを持つモデルがある場合、メッセージ長を考慮する単純なルーターを構築できます。
この例では、500 文字未満のメッセージを小さいモデルへ、それ以外を大きいモデルへルーティングします。

```java
ChatModel smallModel = AzureOpenAiChatModel.builder()
        // ...
        .build();

ChatModel largeModel = OpenAiOfficialChatModel.builder()
        // ...
        .build();

ModelRouter router = ModelRouter.builder()
        .addRoutes(smallModel, largeModel)
        .routingStrategy((availableModels, chatRequest) -> {
           int totalChars = chatRequest.messages().stream()
                    .filter(UserMessage.class::isInstance)
                    .map(UserMessage.class::cast)
                    .filter(UserMessage::hasSingleText)
                    .mapToInt(m -> m.singleText().length())
                    .sum();

            return totalChars < 500 ? availableModels.get(0) : availableModels.get(1);
        })
        .build();

ChatResponse shortMsg = router.chat(new UserMessage("Quick summary?")); // smallModel
ChatResponse longMsg = router.chat(new UserMessage("...very long prompt...")); // largeModel
```


## 例

- [ModelRouter Examples](https://github.com/langchain4j/langchain4j-examples/tree/main/model-router-examples/src/main/java)
