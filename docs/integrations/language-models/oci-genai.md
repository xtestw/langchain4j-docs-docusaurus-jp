---
sidebar_position: 21
---

# Oracle Cloud Infrastructure GenAI

[Generative AI Service](https://www.oracle.com/artificial-intelligence/generative-ai/generative-ai-service)
は、Cohere と Meta の事前学習済み基盤モデルへのアクセスを提供します。
AI モデルの可用性は[こちら](https://docs.public.oneportal.content.oci.oraclecloud.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)を参照してください。

専用 AI クラスタを使うと、自分専用の GPU 上で基盤モデルをホストできます。これらのクラスタは本番ユースケースに必要な安定した高スループット性能を提供し、ホスティングとファインチューニングのワークロードをサポートできます。



## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-oci-genai</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

さらに、OCI SDK 用の HTTP クライアントを選択する必要があります。デフォルトでは Jersey 3 ベースのバージョンを使用します：
```xml
<dependency>
    <groupId>com.oracle.oci.sdk</groupId>
    <artifactId>oci-java-sdk-common-httpclient-jersey3</artifactId>
    <version>${oci-sdk.version}</version>
</dependency>
```

**Java EE/Jakarta EE 8 以前**のランタイムを使用している場合は、Jersey 2 ベースのバージョンを使ってください：
```xml
<dependency>
    <groupId>com.oracle.oci.sdk</groupId>
    <artifactId>oci-java-sdk-common-httpclient-jersey</artifactId>
    <version>${oci-sdk.version}</version>
</dependency>
```

詳細は [OCI SDK ドキュメント](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/javasdk3.htm#javasdk3__HTTP-client-libraries) を参照してください。


## API
パッケージ：`dev.langchain4j.community.model.oracle.oci.genai`

設定が異なるため、API は Cohere モデルと Meta モデルで分かれています。

Meta モデル：
* `OciGenAiChatModel` - すべての OCI GenAi 汎用チャットモデル（llama）向け
* `OciGenAiStreamingChatModel` - OCI GenAi 汎用チャットモデルのストリーミング API

Cohere モデル：
* `OciGenAiCohereChatModel` - すべての OCI GenAi Cohere チャットモデル向け
* `OciGenAiCohereStreamingChatModel` - OCI GenAi Cohere チャットモデルのストリーミング API


## 例

ツール呼び出しを伴う同期 Cohere チャットモデルの例：
```java
var model = OciGenAiCohereChatModel.builder()
      .modelName("cohere.command-r-08-2024")
      .compartmentId("ocid1.tenancy.oc1..aa....")
      .authProvider(new ConfigFileAuthenticationDetailsProvider("DEFAULT"))
      .maxTokens(600)
      .temperature(0.2)
      .topP(0.75)
      .build();

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new Calculator())
        .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
        .build();

String answer = assistant.chat("Calculate square root of 16");
```

ストリーミング Meta チャットモデルの例：
```java
var model = OciGenAiStreamingChatModel.builder()
                .modelName("meta.llama-3.3-70b-instruct")
                .compartmentId("ocid1.tenancy.oc1..aa....")
                .authProvider(new ConfigFileAuthenticationDetailsProvider("DEFAULT"))
                .build();

CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();   

model.doChat(ChatRequest.builder()
        .messages(UserMessage.from("Tell me a joke about Java"))
        .build(), 
new StreamingChatResponseHandler() {
    @Override
    public void onPartialResponse(String partialResponse) {
        System.out.print(partialResponse);
    }
    @Override
    public void onCompleteResponse(ChatResponse completeResponse) {
        futureResponse.complete(completeResponse);
    }
    @Override
    public void onError(Throwable error) {
        futureResponse.completeExceptionally(error);
    }
});
futureResponse.join();
```
