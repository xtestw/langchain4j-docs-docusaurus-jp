---
sidebar_position: 14
---

# Ollama

### Ollamaとは？

Ollamaは、大規模言語モデルをローカル（CPUおよびGPUモード）で簡単にセットアップして実行できる高度なAIツールです。Ollamaを使用すると、ユーザーはLlama 2などの強力な言語モデルを活用し、独自のモデルをカスタマイズして作成することもできます。Ollamaは、モデルの重み、設定、データをModelfileで定義された単一のパッケージにバンドルします。GPUの使用を含むセットアップと設定の詳細を最適化します。

Ollamaの詳細については、以下をご覧ください：

- https://ollama.ai/
- https://github.com/jmorganca/ollama

### 講演

[Docker Con 23](https://www.dockercon.com/2023/program)でのプレゼンテーションをご覧ください：

<iframe width="640" height="480" src="https://www.youtube.com/embed/yPuhGtJT55o" title="Introducing Docker's Generative AI and Machine Learning Stack (DockerCon 2023)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

[Code to the Moon](https://www.youtube.com/@codetothemoon)による紹介をご覧ください：

<iframe width="640" height="480" src="https://www.youtube.com/embed/jib1wjgIaa4" title="this open source project has a bright future" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### はじめに

始めるには、プロジェクトの`pom.xml`に以下の依存関係を追加してください：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>1.0.0-beta4</version>
</dependency>

<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>ollama</artifactId>
    <version>1.19.1</version>
</dependency>
```

Ollamaがtestcontainersで実行されている場合の簡単なチャット例コードを試してみてください：

```java
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Image;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.Container;
import org.testcontainers.ollama.OllamaContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.util.List;

public class OllamaChatExample {

  private static final Logger log = LoggerFactory.getLogger(OllamaChatExample.class);

  static final String OLLAMA_IMAGE = "ollama/ollama:latest";
  static final String TINY_DOLPHIN_MODEL = "tinydolphin";
  static final String DOCKER_IMAGE_NAME = "tc-ollama/ollama:latest-tinydolphin";

  public static void main(String[] args) {
    // Ollamaコンテナを作成して起動
    DockerImageName dockerImageName = DockerImageName.parse(OLLAMA_IMAGE);
    DockerClient dockerClient = DockerClientFactory.instance().client();
    List<Image> images = dockerClient.listImagesCmd().withReferenceFilter(DOCKER_IMAGE_NAME).exec();
    OllamaContainer ollama;
    if (images.isEmpty()) {
        ollama = new OllamaContainer(dockerImageName);
    } else {
        ollama = new OllamaContainer(DockerImageName.parse(DOCKER_IMAGE_NAME).asCompatibleSubstituteFor(OLLAMA_IMAGE));
    }
    ollama.start();

    // モデルをプルして、選択したモデルに基づいてイメージを作成
    try {
        log.info("'{}' モデルのプル開始... 数分かかります...", TINY_DOLPHIN_MODEL);
        Container.ExecResult r = ollama.execInContainer("ollama", "pull", TINY_DOLPHIN_MODEL);
        log.info("モデルのプル完了！ {}", r);
    } catch (IOException | InterruptedException e) {
        throw new RuntimeException("モデルのプル中にエラーが発生しました", e);
    }
    ollama.commitToImage(DOCKER_IMAGE_NAME);

    // ChatModelを構築
    ChatModel model = OllamaChatModel.builder()
            .baseUrl(ollama.getEndpoint())
            .temperature(0.0)
            .logRequests(true)
            .logResponses(true)
            .modelName(TINY_DOLPHIN_MODEL)
            .build();

    // 使用例
    String answer = model.chat("Javaが素晴らしい理由を3つの短い箇条書きで説明してください");
    System.out.println(answer);

    // Ollamaコンテナを停止
    ollama.stop();
  }
}

```

Ollamaがローカルで実行されている場合は、以下のチャット例コードも試すことができます：

```java
class OllamaChatLocalModelTest {
  static String MODEL_NAME = "llama3.2"; // 他のローカルollamaモデル名を試してみてください
  static String BASE_URL = "http://localhost:11434"; // ローカルollamaのベースURL

  public static void main(String[] args) {
      ChatModel model = OllamaChatModel.builder()
              .baseUrl(BASE_URL)
              .modelName(MODEL_NAME)
              .build();
      String answer = model.chat("中国のトップ10都市をリストアップしてください");
      System.out.println(answer);

      model = OllamaChatModel.builder()
              .baseUrl(BASE_URL)
              .modelName(MODEL_NAME)
              .responseFormat(JSON)
              .build();

      String json = model.chat("アメリカのトップ10都市をリストアップしてください");
      System.out.println(json);
    }
}
```

Ollamaがtestcontainersで実行されている場合の簡単なストリーミングチャット例コードを試してみてください：

```java
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Image;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import dev.langchain4j.model.output.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.Container;
import org.testcontainers.ollama.OllamaContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class OllamaStreamingChatExample {

  private static final Logger log = LoggerFactory.getLogger(OllamaStreamingChatExample.class);

  static final String OLLAMA_IMAGE = "ollama/ollama:latest";
  static final String TINY_DOLPHIN_MODEL = "tinydolphin";
  static final String DOCKER_IMAGE_NAME = "tc-ollama/ollama:latest-tinydolphin";

  public static void main(String[] args) {
    DockerImageName dockerImageName = DockerImageName.parse(OLLAMA_IMAGE);
    DockerClient dockerClient = DockerClientFactory.instance().client();
    List<Image> images = dockerClient.listImagesCmd().withReferenceFilter(DOCKER_IMAGE_NAME).exec();
    OllamaContainer ollama;
    if (images.isEmpty()) {
        ollama = new OllamaContainer(dockerImageName);
    } else {
        ollama = new OllamaContainer(DockerImageName.parse(DOCKER_IMAGE_NAME).asCompatibleSubstituteFor(OLLAMA_IMAGE));
    }
    ollama.start();
    try {
        log.info("'{}' モデルのプル開始... 数分かかります...", TINY_DOLPHIN_MODEL);
        Container.ExecResult r = ollama.execInContainer("ollama", "pull", TINY_DOLPHIN_MODEL);
        log.info("モデルのプル完了！ {}", r);
    } catch (IOException | InterruptedException e) {
        throw new RuntimeException("モデルのプル中にエラーが発生しました", e);
    }
    ollama.commitToImage(DOCKER_IMAGE_NAME);

    StreamingChatModel model = OllamaStreamingChatModel.builder()
            .baseUrl(ollama.getEndpoint())
            .temperature(0.0)
            .logRequests(true)
            .logResponses(true)
            .modelName(TINY_DOLPHIN_MODEL)
            .build();

    CompletableFuture<ChatResponse> futureResponse = new CompletableFuture<>();
    model.chat("Javaが素晴らしい理由を3つの短い箇条書きで説明してください", new StreamingChatResponseHandler() {
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
    ollama.stop();
  }
}
```

### パラメータ

`OllamaChatModel`と`OllamaStreamingChatModel`クラスは、ビルダーパターンを使用して以下のパラメータでインスタンス化できます：

| パラメータ        | 説明                                                                                                                                                                       | 型             | 例                |
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|------------------------|
| `baseUrl`        | OllamaサーバーのベースURL。                                                                                                                                                    | `String`         | http://localhost:11434 |
| `modelName`      | Ollamaサーバーから使用するモデルの名前。                                                                                                                                                  | `String`         |                        |
| `temperature`    | 生成される応答のランダム性を制御します。高い値（例：1.0）はより多様な出力をもたらし、低い値（例：0.2）はより決定論的な応答を生成します。 | `Double`         |                        |
| `topK`           | 生成中の各ステップで考慮する最高確率トークンの数を指定します。                                                                                   | `Integer`        |                        |
| `topP`           | トップトークンの累積確率のしきい値を設定することで、生成される応答の多様性を制御します。                                                            | `Double`         |                        |
| `repeatPenalty`  | 生成された出力で類似したトークンを繰り返すことにペナルティを与えます。                                                                                                         | `Double`         |                        |
| `seed`           | 生成された応答の再現性のためのランダムシードを設定します。                                                                                                                  | `Integer`        |                        |
| `numPredict`     | 各入力プロンプトに対して生成する予測の数。                                                                                                                      | `Integer`        |                        |
| `stop`           | 生成された場合に応答の終了をマークする文字列のリスト。                                                                                                          | `List<String>`   |                        |
| `format`         | 生成された出力の希望する形式。（**非推奨** **responseFormat**を参照）                                                                                              | `String`         |                        |
| `responseFormat` | 生成された出力の希望する形式。TEXTまたはJSONとオプションのJSONスキーマ定義                                                                                    | `ResponseFormat` |                        |
| `supportedCapabilities` | `AiServices` APIで使用されるモデル機能のセット（`OllamaChatModel`のみサポート）                                                                                             | `Capability` | RESPONSE_FORMAT_JSON_SCHEMA |
| `timeout`        | API呼び出しが完了するまでの最大許容時間。                                                                                                                            | `Duration`       | PT60S                  |
| `maxRetries`     | API呼び出しが失敗した場合の最大再試行回数。                                                                                                                        | `Integer`        |                        |

#### 使用例
```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

#### Spring Bootでの使用例
```properties
langchain4j.ollama.chat-model.base-url=http://localhost:11434
langchain4j.ollama.chat-model.model-name=llama3.1
langchain4j.ollama.chat-model.temperature=0.8
langchain4j.ollama.chat-model.timeout=PT60S
```

### JSONモード

#### ビルダーを使用したJSONモード

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .responseFormat(ResponseFormat.JSON)    
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

#### ビルダーを使用したJSONモード *非推奨*

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .format("json")    
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

### 構造化出力

#### ビルダーを使用したJSONスキーマ定義

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .responseFormat(ResponseFormat.builder()
            .type(ResponseFormatType.JSON)
            .jsonSchema(JsonSchema.builder().rootElement(JsonObjectSchema.builder()
                            .addProperty("name", JsonStringSchema.builder().build())
                            .addProperty("capital", JsonStringSchema.builder().build())
                            .addProperty(
                                    "languages",
                                    JsonArraySchema.builder()
                                            .items(JsonStringSchema.builder().build())
                                            .build())
                            .required("name", "capital", "languages")
                            .build())
                    .build())
            .build())
    .temperature(0.8)
    .timeout(Duration.ofSeconds(60))
    .build();
```

#### ChatRequest APIを使用したJSONスキーマ

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.1")
    .build();

ChatResponse chatResponse = ollamaChatModel.chat(ChatRequest.builder()
        .messages(userMessage("カナダについて教えてください。"))
        .responseFormat(ResponseFormat.builder()
                .type(ResponseFormatType.JSON)
                .jsonSchema(JsonSchema.builder().rootElement(JsonObjectSchema.builder()
                                .addProperty("name", JsonStringSchema.builder().build())
                                .addProperty("capital", JsonStringSchema.builder().build())
                                .addProperty(
                                        "languages",
                                        JsonArraySchema.builder()
                                                .items(JsonStringSchema.builder().build())
                                                .build())
                                .required("name", "capital", "languages")
                                .build())
                        .build())
                .build())
        .build());

String jsonFormattedResponse = chatResponse.aiMessage().text();

/* jsonFormattedResponseの値:

  {
    "capital" : "Ottawa",
    "languages" : [ "English", "French" ],
    "name" : "Canada"
  }

 */


```


### AiServicesでのJsonスキーマ

`OllamaChatModel`が`RESPONSE_FORMAT_JSON_SCHEMA`のサポート機能で作成されると、`AIService`はインターフェースの戻り値から自動的にスキーマを生成します。詳細は[構造化出力](/tutorials/structured-outputs.md#using-json-schema-with-ai-services)をご覧ください。

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("...")
    .modelName("...")
    .supportedCapabilities(RESPONSE_FORMAT_JSON_SCHEMA)    
    .build();
```

### カスタムメッセージ

`OllamaChatModel`と`OllamaStreamingChatModel`は、標準のチャットメッセージタイプに加えてカスタムチャットメッセージをサポートしています。
カスタムメッセージを使用して、任意の属性を持つメッセージを指定できます。これは、
[Granite Guardian](https://ollama.com/library/granite3-guardian)のような一部のモデルで役立ちます。
これらのモデルは、検索拡張生成（RAG）に使用される取得されたコンテキストを評価するために
非標準のメッセージを使用します。

`CustomMessage`を使用して任意の属性を持つメッセージを指定する方法を見てみましょう：

```java
OllamaChatModel ollamaChatModel = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("granite3-guardian")
    .build();
 
String retrievedContext = "条約締結の重要な部分の一つは、条約に署名することは、相手側が主権国家であり、検討中の合意が国際法の下で執行可能であることを認めることを意味します。したがって、国家は合意を条約と呼ぶことに非常に慎重になることがあります。例えば、米国内では、州間の合意はコンパクトであり、州と連邦政府間または政府機関間の合意は了解覚書です。";

List<ChatMessage> messages = List.of(
    SystemMessage.from("context_relevance"),
    UserMessage.from("条約締結の歴史は何ですか？"),
    CustomMessage.from(Map.of(
        "role", "context",
        "content", retrievedContext
    ))
);

ChatResponse chatResponse = ollamaChatModel.chat(ChatRequest.builder().messages(messages).build());

System.out.println(chatResponse.aiMessage().text()); // "Yes"（Granite Guardianによってリスクが検出されたことを意味します）
```
