---
sidebar_position: 10
---

# Couchbase

https://www.couchbase.com/


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-couchbase</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## API

- `CouchbaseEmbeddingStore`


## 例

- [CouchbaseEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/couchbase-example/src/main/java/CouchbaseEmbeddingStoreExample.java)

## Couchbase埋め込みストア
Couchbase langchain4j統合は、各埋め込みを別々のドキュメントに保存し、FTSベクトルインデックスを使用して保存されたベクトルに対してクエリを実行します。現在、埋め込みとそのメタデータの保存、および埋め込みの削除をサポートしています。このチュートリアルを書いている時点では、ベクトル検索によって選択された埋め込みをメタデータでフィルタリングすることはサポートされていませんでした。埋め込みストア統合はまだ活発に開発中であり、デフォルトの設定は本番環境での使用には推奨されていないことに注意してください。

### Couchbaseクラスターへの接続
ビルダークラスを使用してcouchbase埋め込みストアを初期化できます。初期化には以下のパラメータが必要です：
- クラスター接続文字列
- クラスターユーザー名
- クラスターパスワード
- 埋め込みを保存するバケットの名前
- 埋め込みを保存するスコープの名前
- 埋め込みを保存するコレクションの名前
- 埋め込みストアで使用するFTSベクトルインデックスの名前
- 保存するベクトルの次元数（長さ）

以下のサンプルコードは、ローカルで実行されているCouchbaseサーバーに接続する埋め込みストアを初期化する方法を示しています：

```java
CouchbaseEmbeddingStore embeddingStore = CouchbaseEmbeddingStore.builder()
        .clusterUrl("localhost:8091")
        .username("Administrator")
        .password("password")
        .bucketName("langchain4j")
        .scopeName("_default")
        .collectionName("_default")
        .searchIndexName("test")
        .dimensions(512)
        .build();
```

サンプルソースコードは、`testcontainers`ライブラリを使用して専用のCouchbaseサーバーを起動します：

```java
CouchbaseContainer couchbaseContainer =
        new CouchbaseContainer(DockerImageName.parse("couchbase:enterprise").asCompatibleSubstituteFor("couchbase/server"))
                .withCredentials("Administrator", "password")
                .withBucket(testBucketDefinition)
                .withStartupTimeout(Duration.ofMinutes(1));
```

### ドキュメントの埋め込み
この統合は、保存されたすべての埋め込みに一意の`UUID`ベースの識別子を自動的に割り当てます。以下は埋め込みドキュメントの例です（読みやすさのためにベクトルフィールドの値は省略されています）：

```json
{
  "id": "f4831648-07ca-4c77-a031-75acb6c1cf2f",
  "vector": [
    ...
    0.037255168,
    -0.001608681
  ],
  "text": "text",
  "metadata": {
    "some": "value"
  },
  "score": 0
}
```

これらの埋め込みは開発者が選択した埋め込みモデルで生成され、結果のベクトル値はモデル固有です。

## Couchbaseでの埋め込みの保存
埋め込みモデルで生成された埋め込みは、`CouchbaseEmbeddingStore`クラスの`add`および`addAll`メソッドを使用してcouchbaseに保存できます：
```java
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

TextSegment segment1 = TextSegment.from("I like football.");
Embedding embedding1 = embeddingModel.embed(segment1).content();
embeddingStore.add(embedding1, segment1);

TextSegment segment2 = TextSegment.from("The weather is good today.");
Embedding embedding2 = embeddingModel.embed(segment2).content();
embeddingStore.add(embedding2, segment2);

Thread.sleep(1000); // 埋め込みが確実に永続化されるようにするため
```

## 関連する埋め込みのクエリ
ストアにいくつかの埋め込みを追加した後、クエリベクトルを使用してストア内の関連する埋め込みを見つけることができます。
ここでは、埋め込みモデルを使用して「what is your favorite sport?」というフレーズのベクトルを生成しています。得られたベクトルを使用して、データベース内で最も関連性の高い回答を見つけます：
```java
Embedding queryEmbedding = embeddingModel.embed("What is your favourite sport?").content();
EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(1)
        .build();
EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
EmbeddingMatch<TextSegment> embeddingMatch = searchResult.matches().get(0);
```

選択された回答の関連性スコアとテキストをアプリケーションの出力に表示できます：
```java
System.out.println(embeddingMatch.score()); // 0.81442887
System.out.println(embeddingMatch.embedded().text()); // I like football.
```

## 埋め込みの削除
Couchbase埋め込みストアは、識別子による埋め込みの削除もサポートしています。例えば：
```java
embeddingStore.remove(embeddingMatch.id())
```

または、すべての埋め込みを削除するには：
```java
embeddingStore.removeAll();
```
