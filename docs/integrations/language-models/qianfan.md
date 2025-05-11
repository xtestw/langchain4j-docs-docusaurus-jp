---
sidebar_position: 17
---

# Qianfan

[百度インテリジェントクラウド千帆大規模モデル](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
![image](https://github.com/langchain4j/langchain4j/assets/95265298/600f8006-4484-4a75-829c-c8c16a3130c2)


## Maven依存関係

LangChain4jでは、通常のJavaまたはSpring Bootアプリケーションで千帆を使用できます。

### 通常のJava

:::note
`1.0.0-alpha1`以降、`langchain4j-qianfan`は`langchain4j-community`に移行し、`langchain4j-community-qianfan`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan</artifactId>
    <version>${latest version here}</version>
</dependency>
```

### Spring Boot

:::note
`1.0.0-alpha1`以降、`langchain4j-qianfan-spring-boot-starter`は`langchain4j-community`に移行し、
`langchain4j-community-qianfan-spring-boot-starter`に名前が変更されました。
:::

`1.0.0-alpha1`より前：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qianfan-spring-boot-starter</artifactId>
    <version>${previous version here}</version>
</dependency>
```

`1.0.0-alpha1`以降：

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-qianfan-spring-boot-starter</artifactId>
    <version>${latest version here}</version>
</dependency>
```

または、BOMを使用して依存関係を一貫して管理することもできます：

```xml

<dependencyManagement>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-community-bom</artifactId>
        <version>${latest version here}</version>
        <typ>pom</typ>
        <scope>import</scope>
    </dependency>
</dependencyManagement>
```

## QianfanChatModel

[千帆のすべてのモデルと支払い状況](https://console.bce.baidu.com/qianfan/ais/console/onlineService)
```java
QianfanChatModel model = QianfanChatModel.builder()
        .apiKey("apiKey")
        .secretKey("secretKey")
        .modelName("Yi-34B-Chat") // 無料モデル名
        .build();

String answer = model.chat("雷军");

System.out.println(answer);
```
### カスタマイズ

```java
QianfanChatModel model = QianfanChatModel.builder()
    .baseUrl(...)
    .apiKey(...)
    .secretKey(...)
    .temperature(...)
    .maxRetries(...)
    .topP(...)
    .modelName(...)
    .endpoint(...)
    .responseFormat(...)
    .penaltyScore(...)
    .logRequests(...)
    .logResponses()
    .build();
```

上記のパラメータの一部の説明は[こちら](https://console.bce.baidu.com/tools/?u=qfdc#/api?product=QIANFAN&project=%E5%8D%83%E5%B8%86%E5%A4%A7%E6%A8%A1%E5%9E%8B%E5%B9%B3%E5%8F%B0&parent=Yi-34B-Chat&api=rpc%2F2.0%2Fai_custom%2Fv1%2Fwenxinworkshop%2Fchat%2Fyi_34b_chat&method=post)で確認できます。
### 関数
**IAiService（重要）**
```java
public interface IAiService {
    /**
     * Ai Servicesはより簡単で柔軟な代替手段を提供します。独自のAPI（1つまたは複数のメソッドを持つJavaインターフェース）を定義でき、その実装が提供されます。
     * @param userMessage
     * @return String
     */
    String chat(String userMessage);
}
```
#### QianfanChatWithOnePersonMemory（1人のチャットメモリ付き）

```java

  QianfanChatModel model = QianfanChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();
  /* MessageWindowChatMemory
     スライディングウィンドウとして機能し、最新のNメッセージを保持し、もう収まらない古いメッセージを削除します。
     ただし、各メッセージには様々な数のトークンが含まれる可能性があるため、MessageWindowChatMemoryは主に迅速なプロトタイピングに役立ちます。
     最新のn件のメッセージ（返信を含む）を保持します
   */
  MessageWindowChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(10);

  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(model)
          .chatMemory(chatMemory)
          .build();

  String answer = assistant.chat("My name is xiaoyu");
  System.out.println(answer);

  String answerWithName = assistant.chat("What is my name?");
  System.out.println(answerWithName);
```

#### QianfanChatWithMultiplePersonMemory（複数人のチャットメモリ付き）

```java
  QianfanChatModel model = QianfanChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();

  // 複数のユーザーのチャットメモリを保存するためのマップ
  Map<Object, ChatMemory> memories = new ConcurrentHashMap<>();

  // 各ユーザーのチャットメモリを取得するための関数
  Function<Object, ChatMemory> chatMemoryProvider = userId -> {
      return memories.computeIfAbsent(userId, k -> MessageWindowChatMemory.withMaxMessages(10));
  };

  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(model)
          .chatMemoryProvider(chatMemoryProvider)
          .build();

  // ユーザー1とのチャット
  Object user1Id = UUID.randomUUID();
  String answer1 = assistant.chat(user1Id, "My name is xiaoyu");
  System.out.println("User 1: " + answer1);

  // ユーザー2とのチャット
  Object user2Id = UUID.randomUUID();
  String answer2 = assistant.chat(user2Id, "My name is xiaoming");
  System.out.println("User 2: " + answer2);

  // ユーザー1に名前を尋ねる
  String answerWithName1 = assistant.chat(user1Id, "What is my name?");
  System.out.println("User 1: " + answerWithName1);

  // ユーザー2に名前を尋ねる
  String answerWithName2 = assistant.chat(user2Id, "What is my name?");
  System.out.println("User 2: " + answerWithName2);
```

#### QianfanChatWithPersistentMemory（永続的なチャットメモリ付き）

```java
  QianfanChatModel model = QianfanChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();

  ChatMemory chatMemory = MessageWindowChatMemory.builder()
          .maxMessages(10)
          .chatMemoryStore(new PersistentChatMemoryStore())
          .id("user-1")
          .build();

  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(model)
          .chatMemory(chatMemory)
          .build();

  String answer = assistant.chat("My name is xiaoyu");
  System.out.println(answer);

  String answerWithName = assistant.chat("What is my name?");
  System.out.println(answerWithName);
```

永続的なチャットメモリストアの実装例：

```xml
    <dependency>
        <groupId>org.mapdb</groupId>
        <artifactId>mapdb</artifactId>
        <version>3.1.0</version>
    </dependency>
```
```java
class PersistentChatMemoryStore implements ChatMemoryStore {
    private final DB db = DBMaker.fileDB("chat-memory.db").transactionEnable().make();
    private final Map<String, String> map = db.hashMap("messages", STRING, STRING).createOrOpen();

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String json = map.get((String) memoryId);
        return messagesFromJson(json);
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        String json = messagesToJson(messages);
        map.put((String) memoryId, json);
        db.commit();
    }

    @Override
    public void deleteMessages(Object memoryId) {
        map.remove((String) memoryId);
        db.commit();
    }
}

class PersistentChatMemoryTest{
  public void test(){
    QianfanChatModel chatModel = QianfanChatModel.builder()
            .apiKey("apiKey")
            .secretKey("secretKey")
            .modelName("Yi-34B-Chat")
            .build();
    
    ChatMemory chatMemory = MessageWindowChatMemory.builder()
            .maxMessages(10)
            .chatMemoryStore(new PersistentChatMemoryStore())
            .build();
    
    IAiService assistant = AiServices.builder(IAiService.class)
            .chatModel(chatModel)
            .chatMemory(chatMemory)
            .build();
    
    String answer = assistant.chat("My name is xiaoyu");
    System.out.println(answer);
    // 一度実行した後、上をコメントアウトして下を実行します
    // String answerWithName = assistant.chat("What is my name?");
    // System.out.println(answerWithName);
  }
}

```

#### QianfanStreamingChatModel（ストリーミング応答）
LLMはテキストを1トークンずつ生成するため、多くのLLMプロバイダーは、テキスト全体が生成されるのを待つのではなく、トークンごとに応答をストリーミングする方法を提供しています。これにより、ユーザーエクスペリエンスが大幅に向上し、ユーザーは未知の時間待つ必要がなく、ほぼ即座に応答の読み取りを開始できます。
以下はStreamingChatResponseHandlerを使用した実装例です：
```java
  QianfanStreamingChatModel qianfanStreamingChatModel = QianfanStreamingChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();

  qianfanStreamingChatModel.chat(userMessage, new StreamingChatResponseHandler() {

        @Override
        public void onPartialResponse(String partialResponse) {
            System.out.print(partialResponse);
        }
        @Override
        public void onCompleteResponse(ChatResponse completeResponse) {
            System.out.println("onCompleteResponse: " + completeResponse);
        }
        @Override
        public void onError(Throwable throwable) {
            throwable.printStackTrace();
        }
  });
```
以下はTokenStreamを使用した別の実装例です：
```java
  QianfanStreamingChatModel qianfanStreamingChatModel = QianfanStreamingChatModel.builder()
          .apiKey("apiKey")
          .secretKey("secretKey")
          .modelName("Yi-34B-Chat")
          .build();
  IAiService assistant = AiServices.create(IAiService.class, qianfanStreamingChatModel);
  
  TokenStream tokenStream = assistant.chatInTokenStream("Tell me a story.");
  tokenStream.onPartialResponse(System.out::println)
          .onError(Throwable::printStackTrace)
          .start();
```
#### QianfanRAG

プログラムが自動的に一致するコンテンツとユーザーの質問を組み合わせてプロンプトを作成し、大規模言語モデルに質問し、大規模言語モデルが回答を返します。

LangChain4jには「Easy RAG」機能があり、RAGを始めるのをできるだけ簡単にします。埋め込みについて学んだり、ベクトルストアを選んだり、適切な埋め込みモデルを見つけたり、ドキュメントの解析と分割方法を理解したりする必要はありません。ドキュメントを指定するだけで、LangChain4jが魔法をかけます。

- 依存関係のインポート：langchain4j-easy-rag
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-easy-rag</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```
- 使用方法
```java

  QianfanChatModel chatModel = QianfanChatModel.builder()
        .apiKey(API_KEY)
        .secretKey(SECRET_KEY)
        .modelName("Yi-34B-Chat")
        .build();
  // ディレクトリ内のすべてのファイル、txtの方が速いようです
  List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation");
  // 簡単にするために、インメモリのものを使用します：
  InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
  EmbeddingStoreIngestor.ingest(documents, embeddingStore);

  IAiService assistant = AiServices.builder(IAiService.class)
          .chatModel(chatModel)
          .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
          .contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))
          .build();

  String answer = assistant.chat("The Question");
  System.out.println(answer);

```


## 例

- [Qianfan の例](https://github.com/langchain4j/langchain4j-community/tree/main/models/langchain4j-community-qianfan/src/test/java/dev/langchain4j/community/model/qianfan)
