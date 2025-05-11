---
sidebar_position: 10
---

# Jlama
[Jlamaプロジェクト](https://github.com/tjake/Jlama)

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
    <artifactId>langchain4j-jlama</artifactId>
    <version>1.0.0-beta4</version>
</dependency>

<dependency>
    <groupId>com.github.tjake</groupId>
    <artifactId>jlama-native</artifactId>
    <!-- より高速な推論のため。linux-x86_64、macos-x86_64/aarch_64、windows-x86_64をサポート
        OSとアーキテクチャを検出するには https://github.com/trustin/os-maven-plugin を使用 -->
    <classifier>${os.detected.name}-${os.detected.arch}</classifier>
    <version>${jlama.version}</version> <!-- langchain4j-jlama pomからのバージョン -->
</dependency>
```

Gradleプロジェクトの`build.gradle`

```groovy
implementation 'dev.langchain4j:langchain4j:1.0.0-beta4'
implementation 'dev.langchain4j:langchain4j-jlama:1.0.0-beta4'
```

## 埋め込み
Jlama埋め込みモデルを使用すると、文章を埋め込むことができ、アプリケーションでの使用は簡単です。
Jlama埋め込みモデル統合を始めるための簡単な例を提供します。
[HuggingFace](https://huggingface.co/models?library=safetensors&sort=trending)から任意の`bert`ベースのモデルを使用でき、`所有者/モデル名`形式で指定できます。

クラスを作成し、以下のコードを追加してください。

```java
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.jlama.JlamaEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;

import java.util.List;

public class HelloWorld {
    public static void main(String[] args) {
        EmbeddingModel embeddingModel = JlamaEmbeddingModel
                                        .modelName("intfloat/e5-small-v2")
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

もちろん、Jlama埋め込みをRAG（検索拡張生成）技術と組み合わせることもできます。

[RAG](/tutorials/rag)では、LangChain4jを使用したRAG技術の取り込み、検索、高度な検索について学ぶことができます。

タイムアウト、モデルタイプ、モデルパラメータなど、多くのパラメータが背後で設定されています。
[モデルパラメータの設定](/tutorials/model-parameters)では、これらのパラメータを明示的に設定する方法を学ぶことができます。

### その他の例
より多くの例を確認したい場合は、[langchain4j-examples](https://github.com/langchain4j/langchain4j-examples)プロジェクトで見つけることができます。
