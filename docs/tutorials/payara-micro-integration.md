---
sidebar_position: 35
---

# Payara Micro 統合

LangChain4j は、Jakarta EE と MicroProfile の標準機能を利用した依存性注入と設定管理により、Payara Micro アプリケーションへシームレスに統合できます。

本ガイドでは、MicroProfile Config で設定を管理しつつ、JAX-RS リソースが LangChain4j モデルを直接インスタンス化して利用する方法を示します。

## Maven 依存関係

まず、pom.xml に langchain4j コア依存関係と、必要なモデル統合モジュールを追加します：
```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.release>21</maven.compiler.release>
    <jakartaee-api.version>10.0.0</jakartaee-api.version>
    <payara.version>6.2025.5</payara.version>
    <version.langchain4j>1.18.1</version.langchain4j>
</properties>

<dependencies>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-open-ai</artifactId>
        <version>${version.langchain4j}</version>
    </dependency>
    
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-google-ai-gemini</artifactId>
        <version>${version.langchain4j}</version>
    </dependency>
    
    <dependency>
        <groupId>jakarta.platform</groupId>
        <artifactId>jakarta.jakartaee-api</artifactId>
        <version>${jakartaee-api.version}</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

## 複数モデルの設定

複数の AI モデルは、`src/main/resources/META-INF/microprofile-config.properties` にある MicroProfile 設定ファイルへそれぞれのプロパティを記述することで設定できます。例：
```
openai.api.key=${OPENAI_API_KEY}
openai.chat.model=gpt-4o-mini

google-ai-gemini.chat-model.api-key=${GEMINI_KEY}
google-ai-gemini.chat-model.model-name=gemini-2.0-flash-lite

deepseek.api.key=${DEEPSEEK_API_KEY}
deepseek.chat.model=deepseek-reasoner
```

## チャットリソースの実装

このアプローチでは、各 JAX-RS リソースが自身の AI モデルインスタンスを管理します。このパターンは各プロバイダーで再利用されます。

`RestConfiguration` クラスは `jakarta.ws.rs.core.Application` を拡張し、すべての REST エンドポイントのベースパス `/api` を定義します：

```java
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

@ApplicationPath("api")
public class RestConfiguration extends Application {
}
```
各モデルには JAX-RS Resource クラスがあり、次のことを行います：

- `@Inject` と `@ConfigProperty` を使って設定プロパティを注入する。
- プロパティ注入後にモデルインスタンスを構築するため、`@PostConstruct` アノテーション付きメソッドを使う。
- モデルと対話する `@GET` エンドポイントを作成する。

```java
@Path("openai")
public class OpenAiChatModelResource {

    @Inject
    @ConfigProperty(name = "openai.api.key")
    private String openAiApiKey;

    @Inject
    @ConfigProperty(name = "openai.chat.model")
    private String modelName;

    private OpenAiChatModel chatModel;

    @PostConstruct
    public void init() {
        chatModel = OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .modelName(modelName)
                .build();
    }

    @GET
    @Path("chat")
    @Produces(MediaType.TEXT_PLAIN)
    public String chat(@QueryParam("message") @DefaultValue("Hello") String message) {
        return chatModel.generate(message);
    }
}
```

同じパターンは `GeminiChatModelResource` と `DeepSeekChatModelResource` にも使われます。

後者は `OpenAiChatModel` クラスを再利用し、baseUrl のみを [deepseek API](https://api.deepseek.com) に変更している点に注意してください。これはライブラリの柔軟性を示しています。

## API ドキュメント

サンプルプロジェクトには、API エンドポイントを対話的に探索・テストするための Swagger UI が含まれています。

webapp フォルダ内の `index.html` は、Payara Micro が `/openapi` エンドポイントで自動生成する OpenAPI 仕様を Swagger UI が読み込むよう設定されています：
```json
openapi: 3.0.0
info:
  title: Deployed Resources
  version: 1.0.0
...
        
endpoints:
/:
- /api/deepseek/chat
- /api/gemini/chat
- /api/openai/chat
components: {}
```

## サンプルアプリケーションの実行

このプロジェクトは Payara Micro Maven プラグインで実行するよう設定されています。

### 前提条件：
- Java SE 21+
- Maven の実行環境

### 実行手順
1. プロジェクトのルートディレクトリでターミナルを開きます。
2. API キー用の必要な環境変数を設定します。アプリケーションは AI サービスへの認証にこれらを必要とします。次を設定してください：
   - OPENAI_API_KEY
   - GEMINI_KEY
   - DEEPSEEK_API_KEY
3. 次の Maven コマンドを実行します：`mvn clean package payara-micro:start`

サーバー起動後、次の 2 つの方法でエンドポイントをテストできます：

1. **IntelliJ IDEA**（Ultimate Edition）または同様の機能を持つ**別の IDE** を使っている場合、`.http` ファイルから直接リクエストを実行できます：

    a. `src/test/resources/` にある `test.http` ファイルを開きます。
    
    b. IDE は各リクエスト定義の横に小さな緑の「再生」アイコンを表示します： 
    ![](/img/payara-micro-test-http.png)

    c. 実行したいリクエストの横のアイコンをクリックします。API からの応答は IDE のツールウィンドウに直接表示されます：
    ![](/img/payara-micro-test-results.png)

2. AI チャットインターフェースを使う

    ブラウザで http://localhost:8080/ にアクセスします。利用可能なエンドポイントをブラウザから直接探索・テストできる対話的な**チャットページ**が開きます：
    ![](/img/payara-micro-ai-chat.png)
