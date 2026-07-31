---
sidebar_position: 7
---

# watsonx.ai

- [watsonx.ai API Reference](https://cloud.ibm.com/apidocs/watsonx-ai#text-rerank)
- [watsonx.ai Java SDK](https://github.com/IBM/watsonx-ai-java-sdk)


## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-watsonx</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## 認証

Watsonx.ai は `Authenticator` インターフェース経由の認証をサポートします。

これにより、デプロイに応じて異なる認証メカニズムを使えます：

- **IBMCloudAuthenticator** – API キーで **IBM Cloud** に認証。`apiKey(...)` ビルダーメソッドを使う場合の最も簡単な方法です。
- **CP4DAuthenticator** – **Cloud Pak for Data** デプロイ向けの認証。
- **カスタム認証器** – `Authenticator` インターフェースの任意の実装を使用可能。

`WatsonxScoringModel` およびその他のサービスビルダーは、`.apiKey(...)` のショートカット、または `.authenticator(...)` による完全な `Authenticator` インスタンスのどちらも受け付けます。

### 例
```java
WatsonxScoringModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key") // Simple IBM Cloud authentication
    .projectId("your-project-id")
    .modelName("cross-encoder/ms-marco-minilm-l-12-v2")
    .build();

WatsonxScoringModel.builder()
    .baseUrl("https://my-instance-url")
    .authenticator( // For Cloud Pak for Data deployments
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .build()
    )
    .projectId("my-project-id")
    .modelName("cross-encoder/ms-marco-minilm-l-12-v2")
    .build();
```

### カスタム HttpClient と SSL 設定

#### カスタム HttpClient の使用

すべてのサービスと認証器は、ビルダーパターン経由でカスタム `HttpClient` をサポートします。カスタム TLS/SSL、プロキシ、その他の HTTP クライアント設定が必要な Cloud Pak for Data 環境で特に有用です。

```java
HttpClient httpClient = HttpClient.newBuilder()
    .sslContext(createCustomSSLContext())
    .executor(ExecutorProvider.ioExecutor())
    .build();

EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .projectId("project-id")
    .httpClient(httpClient) // Custom HttpClient
    .authenticator(
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .httpClient(httpClient) // Custom HttpClient
            .build()
    )
    .build();
```

> **注意：** Cloud Pak for Data でカスタム `HttpClient` を使う場合は、すべてのリクエストで一貫した HTTP 挙動になるよう、サービスビルダーと認証器ビルダーの両方に設定してください。

#### SSL 検証の無効化

SSL 証明書検証だけを無効にしたい場合は、カスタム `HttpClient` の代わりに `verifySsl(false)` を使えます：

```java
EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .projectId("project-id")
    .verifySsl(false) // Disable SSL verification
    .authenticator(
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .verifySsl(false) // Disable SSL verification
            .build()
    )
    .build();
```

### IBM Cloud API Key の作成方法

[https://cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys) で **Create +** をクリックして API キーを作成できます。

### Project ID の確認方法

1. [https://dataplatform.cloud.ibm.com/projects/?context=wx](https://dataplatform.cloud.ibm.com/projects/?context=wx) にアクセス  
2. プロジェクトを開く  
3. **Manage** タブへ移動  
4. **Details** セクションから **Project ID** をコピー 

## WatsonxScoringModel

`WatsonxScoringModel` は、IBM watsonx.ai モデルを使った LangChain4j の `ScoringModel` 実装を提供します。

ユーザークエリとの関連性に基づき、ドキュメント（またはテキストセグメント）のリストをランキングするのに特に有用です。

### 例

```java
ScoringModel scoringModel = WatsonxScoringModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("cross-encoder/ms-marco-minilm-l-12-v2")
    .build();

var scores = scoringModel.scoreAll(
    List.of(
        TextSegment.from("Example_1"),
        TextSegment.from("Example_2")
    ),
    "Hello from watsonx.ai"
);

System.out.println(scores);
```

> 🔗 [利用可能な rerank モデル ID を見る](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models-embed.html?context=wx&audience=wdp#rerank)

## 例

- [WatsonxScoringModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxScoringModelTest.java)
