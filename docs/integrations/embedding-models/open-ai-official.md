---
sidebar_position: 16
---

# OpenAI 公式 SDK

:::note

これは[公式OpenAI Java SDK](https://github.com/openai/openai-java)を使用する`OpenAI 公式 SDK`統合のドキュメントです。

LangChain4jは埋め込みモデルを使用するためにOpenAIとの4つの異なる統合を提供しており、これは#2です：

- [OpenAI](/integrations/language-models/open-ai)はOpenAI REST APIのカスタムJava実装を使用し、Quarkus（Quarkus RESTクライアントを使用）とSpring（SpringのRestClientを使用）で最もよく機能します。
- [OpenAI 公式 SDK](/integrations/language-models/open-ai-official)は公式OpenAI Java SDKを使用します。
- [Azure OpenAI](/integrations/language-models/azure-open-ai)はMicrosoftのAzure SDKを使用し、高度なAzure認証メカニズムを含むMicrosoft Javaスタックを使用している場合に最適です。
- [GitHub Models](/integrations/language-models/github-models)はGitHubモデルにアクセスするためにAzure AI推論APIを使用します。

:::

## この統合のユースケース

この統合は[OpenAI Java SDK GitHubリポジトリ](https://github.com/openai/openai-java)を使用し、以下から提供されるすべてのOpenAIモデルで動作します：

- OpenAI
- Azure OpenAI
- GitHub Models

また、OpenAI APIをサポートするモデルでも動作します。

## OpenAIドキュメント

- [OpenAI Java SDK GitHubリポジトリ](https://github.com/openai/openai-java)
- [OpenAI APIドキュメント](https://platform.openai.com/docs/introduction)
- [OpenAI APIリファレンス](https://platform.openai.com/docs/api-reference)

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-official</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## モデルの設定

OpenAIモデルを使用するには、通常、エンドポイントURL、APIキー、モデル名が必要です。これはモデルがホストされている場所によって異なりますが、この統合では自動設定によって簡単にしています：

### 一般的な設定

```java
import com.openai.models.embeddings.EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialEmbeddingModel;

// ....

EmbeddingModel model = OpenAiOfficialEmbeddingModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(EmbeddingModel.TEXT_EMBEDDING_3_SMALL)
        .build();
```

### Azure OpenAIとGitHub Modelsの特定の設定

[OpenAI公式チャットモデル](/integrations/language-models/open-ai-official)の設定と同様に、`isAzure()`と`isGitHubModels()`メソッドを使用して、Azure OpenAIとGitHub Modelsで`OpenAiOfficialEmbeddingModel`を設定できます。

#### Azure OpenAI

```java
EmbeddingModel model = OpenAiOfficialEmbeddingModel.builder()
        .baseUrl(System.getenv("AZURE_OPENAI_ENDPOINT"))
        .apiKey(System.getenv("AZURE_OPENAI_KEY"))
        .modelName(EmbeddingModel.TEXT_EMBEDDING_3_SMALL)
        .isAzure(true) // ベースURLが`openai.azure.com`で終わる場合は不要
        .build();
```

[OpenAI公式チャットモデル](/integrations/language-models/open-ai-official)のドキュメントで説明されているように、「パスワードレス」認証も使用できます。

#### GitHub Models

```java
EmbeddingModel model = OpenAiOfficialEmbeddingModel.builder()
        .modelName(EmbeddingModel.TEXT_EMBEDDING_3_SMALL)
        .isGitHubModels(true)
        .build();
```

## モデルの使用

モデルが設定されたら、埋め込みを作成するために使用できます：

```java
Response<Embedding> response = model.embed("Please embed this sentence.");
```
