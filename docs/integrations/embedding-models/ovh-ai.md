---
sidebar_position: 17
---

# OVHcloud AI Endpoints

- [OVHclous AI Endpointsドキュメント](https://labs.ovhcloud.com/en/ai-endpoints/)
- OVHcloud AI Endpoints APIリファレンス：
  - [bge-base-en-v1.5](https://bge-base-en-v1-5.endpoints.kepler.ai.cloud.ovh.net/doc)
  - [multilingual-e5-base](https://multilingual-e5-base.endpoints.kepler.ai.cloud.ovh.net/doc)

## プロジェクトセットアップ

### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ovh-ai</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

### APIキーの設定
OVHcloud AI APIキーをプロジェクトに追加します。

```java
public static final String OVHAI_AI_API_KEY = System.getenv("OVHAI_AI_API_KEY");
```
APIキーを環境変数として設定することを忘れないでください。
```shell
export OVHAI_AI_API_KEY=your-api-key #Unix系OSの場合
SET OVHAI_AI_API_KEY=your-api-key #Windows OSの場合
```
OVHcloud AI APIキーの取得方法の詳細は[こちら](https://endpoints.ai.cloud.ovh.net/)で確認できます

## 埋め込み
OVHcloud AI埋め込みモデルを使用すると、文章を埋め込むことができ、アプリケーションでの使用は簡単です。OVHcloud AI埋め込みモデル統合を始めるための簡単な例を提供します。

クラスを作成し、以下のコードを追加します。

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ovhai.OvhAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;

import java.util.List;

public class OvhAiEmbeddingSimpleExample {

    public static void main(String[] args) {
        EmbeddingModel embeddingModel = OvhAiEmbeddingModel.builder()
                .apiKey(System.getenv("OVH_AI_API_KEY"))
                .baseUrl("https://multilingual-e5-base.endpoints.kepler.ai.cloud.ovh.net")
                .build();

        // 簡単にするために、この例ではインメモリストアを使用していますが、本番環境では任意の互換性のある外部ストアを選択できます。
        EmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();

        TextSegment segment1 = TextSegment.from("サッカーが好きです。");
        Embedding embedding1 = embeddingModel.embed(segment1).content();
        embeddingStore.add(embedding1, segment1);

        TextSegment segment2 = TextSegment.from("今日の天気は良いです。");
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

もちろん、OVHCloud埋め込みをRAG（検索拡張生成）技術と組み合わせることもできます。

[RAG](/tutorials/rag)では、LangChain4jを使用したRAG技術の取り込み、検索、高度な検索について学ぶことができます。

タイムアウト、モデルタイプ、モデルパラメータなど、多くのパラメータが背後で設定されています。
[モデルパラメータの設定](/tutorials/model-parameters)では、これらのパラメータを明示的に設定する方法を学ぶことができます。

### その他の例
より多くの例を確認したい場合は、[langchain4j-examples](https://github.com/langchain4j/langchain4j-examples)プロジェクトで見つけることができます。
