---
sidebar_position: 6
---

# GitHub Models

:::note

これは`GitHub Models`統合のドキュメントで、GitHubモデルにアクセスするためにAzure AI推論APIを使用します。

LangChain4jは埋め込みモデルを使用するためにOpenAIとの4つの異なる統合を提供しており、これは#4です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。
- [GitHub Models](/integrations/language-models/github-models)はGitHubモデルにアクセスするためにAzure AI推論APIを使用します。

:::

生成AIアプリケーションを開発したい場合、GitHub Modelsを使用して無料でAIモデルを見つけて実験することができます。
アプリケーションを本番環境に移行する準備ができたら、有料のAzureアカウントからのトークンに切り替えることができます。

## GitHub Modelsドキュメント

- [GitHub Modelsドキュメント](https://docs.github.com/en/github-models)
- [GitHub Modelsマーケットプレイス](https://github.com/marketplace/models)

## Maven依存関係

### 通常のJava

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-github-models</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## GitHubトークン

GitHub Modelsを使用するには、認証のためにGitHubトークンを使用する必要があります。

トークンは[GitHub開発者設定 > 個人アクセストークン](https://github.com/settings/tokens)で作成および管理されます。

トークンを取得したら、環境変数として設定し、コードで使用できます：

```bash
export GITHUB_TOKEN="<your-github-token-goes-here>"
```

## GitHubトークンを使用した`GitHubModelsEmbeddingModel`の作成

```java
GitHubModelsEmbeddingModel model = GitHubModelsEmbeddingModel.builder()
        .gitHubToken(System.getenv("GITHUB_TOKEN"))
        .modelName(TEXT_EMBEDDING_3_SMALL)
        .logRequestsAndResponses(true)
        .build();
```

これにより、`GitHubModelsEmbeddingModel`のインスタンスが作成されます。

## モデルの使用

```java
Response<Embedding> response = model.embed("Please embed this sentence.");
```

## 例

- [GitHub Models Examples](https://github.com/langchain4j/langchain4j-examples/tree/main/github-models-examples/src/main/java)
