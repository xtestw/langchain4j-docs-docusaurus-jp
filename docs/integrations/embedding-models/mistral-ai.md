---
sidebar_position: 12
---

# Mistral AI
[MistralAIドキュメント](https://docs.mistral.ai/)

### プロジェクトセットアップ

langchain4jをプロジェクトにインストールするには、以下の依存関係を追加してください：

Mavenプロジェクトの`pom.xml`

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>1.0.0-rc1</version>
</dependency>

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mistral-ai</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

Gradleプロジェクトの`build.gradle`

```groovy
implementation 'dev.langchain4j:langchain4j:1.0.0-beta4'
implementation 'dev.langchain4j:langchain4j-mistral-ai:1.0.0-beta4'
```
#### APIキーの設定
MistralAI APIキーをプロジェクトに追加します。以下のコードで```ApiKeys.java```クラスを作成できます

```java
public class ApiKeys {
    public static final String MISTRALAI_API_KEY = System.getenv("MISTRAL_AI_API_KEY");
}
```
APIキーを環境変数として設定することを忘れないでください。
```shell
export MISTRAL_AI_API_KEY=your-api-key #Unix系OSの場合
SET MISTRAL_AI_API_KEY=your-api-key #Windows OSの場合
```
MistralAI APIキーの取得方法の詳細は[こちら](https://docs.mistral.ai/#api-access)で確認できます

## 埋め込み
MistralAI埋め込みモデルを使用すると、文章を埋め込むことができ、アプリケーションでの使用は簡単です。MistralAI埋め込みモデル統合を始めるための簡単な例を提供します。

クラスを作成し、以下のコードを追加してください。

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.mistralai.MistralAiEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;

import java.util.List;

public class HelloWorld {
    public static void main(String[] args) {
        EmbeddingModel embeddingModel = MistralAiEmbeddingModel.builder()
                .apiKey(System.getenv("MISTRAL_AI_API_KEY"))
                .modelName("mistral-embed")
                .build();

        // 簡略化のため、この例ではインメモリストアを使用していますが、本番環境では任意の互換性のある外部ストアを選択できます。
        EmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();

        TextSegment segment1 = TextSegment.from("サッカーが好きです。");
        Embedding embedding1 = embeddingModel.embed(segment1).content();
        embeddingStore.add(embedding1, segment1);
        
        TextSegment segment2 = TextSegment.from("今日は天気が良いです。");
        Embedding embedding2 = embeddingModel.embed(segment2).content();
        embeddingStore.add(embedding2, segment2);
        
        String userQuery = "あなたの好きなスポーツは何ですか？";
        Embedding queryEmbedding = embeddingModel.embed(userQuery).content();
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(1)
                .build();
        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
        EmbeddingMatch<TextSegment> embeddingMatch = searchResult.matches().get(0);

        System.out.println("質問: " + userQuery); // あなたの好きなスポーツは何ですか？
        System.out.println("応答: " + embeddingMatch.embedded().text()); // サッカーが好きです。
    }
}
```
この例では2つのテキストセグメントを追加しますが、LangChain4jはさまざまなソースからドキュメントを読み込むための組み込みサポートを提供しています：
ファイルシステム、URL、Amazon S3、Azure Blob Storage、GitHub、Tencent COS。
さらに、LangChain4jは複数のドキュメントタイプの解析をサポートしています：
テキスト、PDF、DOC、XLS、PPT。

出力は以下のようになります：

```plaintext
質問: あなたの好きなスポーツは何ですか？
応答: サッカーが好きです。
```

もちろん、MistralAI埋め込みをRAG（検索拡張生成）技術と組み合わせることもできます。

[RAG](/tutorials/rag)では、LangChain4jを使用したRAG技術の取り込み、検索、高度な検索について学ぶことができます。

タイムアウト、モデルタイプ、モデルパラメータなど、多くのパラメータが背後で設定されています。
[モデルパラメータの設定](/tutorials/model-parameters)では、これらのパラメータを明示的に設定する方法を学ぶことができます。

### その他の例
より多くの例を確認したい場合は、[langchain4j-examples](https://github.com/langchain4j/langchain4j-examples)プロジェクトで見つけることができます。
