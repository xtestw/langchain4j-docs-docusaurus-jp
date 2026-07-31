---
sidebar_position: 23
---

# watsonx.ai

- [watsonx.ai API リファレンス](https://cloud.ibm.com/apidocs/watsonx-ai#text-embeddings)
- [watsonx.ai Java SDK](https://github.com/IBM/watsonx-ai-java-sdk)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-watsonx</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

## 認証

Watsonx.ai は `Authenticator` インターフェースによる認証をサポートします。

これにより、デプロイ形態に応じて異なる認証メカニズムを使用できます：

- **IBMCloudAuthenticator** – API キーを使用して **IBM Cloud** で認証します。最もシンプルな方法で、`apiKey(...)` ビルダーメソッドを提供したときに使用されます。
- **CP4DAuthenticator** – **Cloud Pak for Data** デプロイメントで認証します。
- **カスタム認証器** – `Authenticator` インターフェースの任意の実装を使用できます。

`WatsonxEmbeddingModel` およびその他のサービスビルダーは、`.apiKey(...)` によるショートカット、または `.authenticator(...)` による完全な `Authenticator` インスタンスのいずれかを受け付けます。

### 例
```java
WatsonxEmbeddingModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key") // Simple IBM Cloud authentication
    .projectId("your-project-id")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .build();

WatsonxEmbeddingModel.builder()
    .baseUrl("https://my-instance-url")
    .authenticator( // For Cloud Pak for Data deployments
        CP4DAuthenticator.builder()
            .baseUrl("https://my-instance-url")
            .username("username")
            .apiKey("api-key")
            .build()
    )
    .projectId("my-project-id")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .build();
```

### カスタム HttpClient と SSL 設定

#### カスタム HttpClient の使用

すべてのサービスと認証器は、ビルダーパターンを通じてカスタム `HttpClient` インスタンスをサポートします。これは、カスタム TLS/SSL 設定、プロキシ設定、その他の HTTP クライアントプロパティを構成する必要がある Cloud Pak for Data 環境で特に有用です。

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

> **注意：** Cloud Pak for Data でカスタム `HttpClient` を使用する場合、すべてのリクエストで一貫した HTTP 動作を確保するため、サービスビルダーと認証器ビルダーの両方に設定してください。

#### SSL 検証の無効化

SSL 証明書検証のみを無効にする必要がある場合は、カスタム `HttpClient` を提供する代わりに `verifySsl(false)` オプションを使用できます：

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

### IBM Cloud API キーの作成方法

[https://cloud.ibm.com/iam/apikeys](https://cloud.ibm.com/iam/apikeys) で **Create +** をクリックして API キーを作成できます。

### Project ID の確認方法

1. [https://dataplatform.cloud.ibm.com/projects/?context=wx](https://dataplatform.cloud.ibm.com/projects/?context=wx) にアクセスする  
2. プロジェクトを開く  
3. **Manage** タブに移動する  
4. **Details** セクションから **Project ID** をコピーする 

## WatsonxEmbeddingModel

`WatsonxEmbeddingModel` を使用すると、IBM watsonx.ai で embedding を生成し、検索、検索拡張生成（RAG）、類似度比較などの LangChain4j のベクトルベース操作と統合できます。

これは LangChain4j の `EmbeddingModel` インターフェースを実装しています。

```java
EmbeddingModel embeddingModel = WatsonxEmbeddingModel.builder()
    .baseUrl(CloudRegion.FRANKFURT)
    .apiKey("your-api-key")
    .projectId("your-project-id")
    .modelName("ibm/granite-embedding-278m-multilingual")
    .build();

System.out.println(embeddingModel.embed("Hello from watsonx.ai"));
```
> 🔗 [利用可能な embedding モデル ID を表示](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models-embed.html?context=wx&audience=wdp#embed)

## 例

- [WatsonxEmbeddingModelTest](https://github.com/langchain4j/langchain4j-examples/blob/main/watsonx-ai-examples/src/main/java/WatsonxEmbeddingModelTest.java)
