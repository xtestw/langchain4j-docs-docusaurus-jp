---
sidebar_position: 28
---

# OceanBase

OceanBase Embedding Store は [OceanBase](https://www.oceanbase.com/) データベースと統合し、ベクトル類似度検索およびハイブリッド検索機能を提供します。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-oceanbase</artifactId>
    <version>${latest version here}</version>
</dependency>
```

注意：これはコミュニティ統合モジュールです。プロジェクト構成に langchain4j-community リポジトリを追加する必要がある場合があります。

## API

- `OceanBaseEmbeddingStore`

## 要件

- OceanBase データベースインスタンス（バージョン 4.3.5 以降）
- Java >= 17

## 機能

- メタデータ付きで embedding を保存（JSON 形式）
- コサイン、L2、または内積距離によるベクトル類似度検索
- **ハイブリッド検索**：ベクトル類似度と全文検索を組み合わせ（RRF アルゴリズム）
- メタデータフィールドおよびテーブル列による検索結果のフィルタリング
- テーブルとベクトルインデックスの自動作成
- カスタマイズ可能なフィールド名と距離メトリクス

## 使い方

### 基本例

```java
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.oceanbase.OceanBaseEmbeddingStore;

// Initialize embedding model
EmbeddingModel embeddingModel = new AllMiniLmL6V2QuantizedEmbeddingModel();

// Create embedding store
OceanBaseEmbeddingStore embeddingStore = OceanBaseEmbeddingStore.builder()
    .url("jdbc:oceanbase://127.0.0.1:2881/test")
    .user("root@test")
    .password("password")
    .tableName("embeddings")
    .dimension(384)
    .build();

// Add document with metadata
String id = embeddingStore.add(
    embeddingModel.embed("Java is a programming language").content(),
    TextSegment.from("Java is a programming language", 
        Metadata.from("category", "programming").put("language", "Java"))
);

// Search
Embedding queryEmbedding = embeddingModel.embed("programming language").content();
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
    EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .maxResults(10)
        .build()
);

// Process results
results.matches().forEach(match -> {
    System.out.println("Score: " + match.score());
    System.out.println("Text: " + match.embedded().text());
    System.out.println("Metadata: " + match.embedded().metadata());
});
```

### 高度な設定

```java
OceanBaseEmbeddingStore embeddingStore = OceanBaseEmbeddingStore.builder()
    .url("jdbc:oceanbase://127.0.0.1:2881/test")
    .user("root@test")
    .password("password")
    .tableName("embeddings")
    .dimension(384)
    .metricType("cosine")  // Options: "cosine", "l2", "ip"
    .retrieveEmbeddingsOnSearch(true)
    .idFieldName("id_field")
    .textFieldName("text_field")
    .metadataFieldName("metadata_field")
    .vectorFieldName("vector_field")
    .build();
```

## 距離メトリクス

OceanBase embedding store は 3 種類の距離メトリクスをサポートします。距離値は自動的に [0, 1] の範囲の関連性スコアに変換され、1 が最も関連性の高い一致を表します。

### コサイン距離（デフォルト）- `"cosine"`

**適している用途：** テキスト embedding、意味的類似度検索

**仕組み：**
- OceanBase `cosine_distance` は [0, 2] の範囲の値を返します
  - `0` = 同一ベクトル（同じ方向）
  - `1` = 直交ベクトル（垂直）
  - `2` = 反対ベクトル（完全に反対の方向）
- 関連性スコアへの変換：`score = (2 - distance) / 2`
- 結果はベクトルの大きさに依存しない

```java
.metricType("cosine")  // Default, recommended for text embeddings
```

### L2 距離（ユークリッド）- `"l2"` または `"euclidean"`

**適している用途：** 方向と大きさの両方が重要な場合

**仕組み：**
- ベクトル間の直線距離を測定
- 範囲：[0, ∞)
- 関連性スコアへの変換：`score = 1 / (1 + distance)`

```java
.metricType("l2")  // or "euclidean"
```

### 内積 - `"inner_product"` または `"ip"`

**適している用途：** 正規化された embedding、パフォーマンスが重要なアプリケーション

**仕組み：**
- ベクトルのドット積を測定
- 正規化ベクトルの場合、範囲は [-1, 1]
- 関連性スコアへの変換：`score = (inner_product + 1) / 2`

```java
.metricType("inner_product")  // or "ip"
```

**参考：** [OceanBase ベクトル距離関数](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000004475471)

## フィルタリング

OceanBase embedding store は、メタデータフィールドおよびテーブル列による検索結果のフィルタリングをサポートします。

### メタデータフィールドによるフィルタリング

```java
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;
import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

// Filter by single metadata field
Filter filter = metadataKey("category").isEqualTo("programming");

// Filter with multiple conditions
Filter filter = new And(
    metadataKey("category").isEqualTo("programming"),
    metadataKey("language").isEqualTo("Java")
);

// Filter with IN operator
Filter filter = metadataKey("language").isIn("Java", "Python", "C++");

// Search with filter
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
    EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)
        .filter(filter)
        .maxResults(10)
        .build()
);
```

### テーブル列によるフィルタリング

テーブル列を直接フィルタリングすることもできます（id、text、metadata、vector）：

```java
import dev.langchain4j.store.embedding.filter.comparison.IsIn;
import dev.langchain4j.store.embedding.filter.comparison.ContainsString;
import dev.langchain4j.store.embedding.filter.comparison.IsEqualTo;

// Filter by ID field
Filter filter = new IsIn("id", List.of("id1", "id2", "id3"));

// Filter by text field (contains)
Filter textFilter = new ContainsString("text", "programming");

// Filter by exact text match
Filter exactTextFilter = new IsEqualTo("text", "Java programming");
```

**注意**：テーブル列でフィルタリングする場合は、`FieldDefinition` で定義された実際のフィールド名を使用してください。マッパーは一般的なエイリアスを自動的に認識します：
- `id` → id フィールド
- `text` または `document` → text フィールド  
- `metadata` → metadata フィールド
- `vector` または `embedding` → vector フィールド

### サポートされるフィルター操作

- `isEqualTo`：等価比較
- `isNotEqualTo`：非等価比較
- `isGreaterThan`：より大きい比較
- `isGreaterThanOrEqualTo`：以上比較
- `isLessThan`：より小さい比較
- `isLessThanOrEqualTo`：以下比較
- `isIn`：IN 演算子（複数値）
- `isNotIn`：NOT IN 演算子
- `containsString`：LIKE 演算子（パターンマッチング）
- `And`：論理積
- `Or`：論理和
- `Not`：論理否定

## ハイブリッド検索

ハイブリッド検索はベクトル類似度検索と全文検索を組み合わせ、より良い検索結果を提供します。有効にすると、テキストフィールドに全文インデックスを自動作成し、**Reciprocal Rank Fusion（RRF）** アルゴリズムで結果を結合します。

### ハイブリッド検索を有効にする

```java
OceanBaseEmbeddingStore embeddingStore = OceanBaseEmbeddingStore.builder()
    .url("jdbc:oceanbase://127.0.0.1:2881/test")
    .user("root@test")
    .password("password")
    .tableName("embeddings")
    .dimension(384)
    .enableHybridSearch(true)  // Enable hybrid search
    .build();
```

### ハイブリッド検索を実行する

```java
// Perform hybrid search by providing both query embedding and query text
EmbeddingSearchResult<TextSegment> results = embeddingStore.search(
    EmbeddingSearchRequest.builder()
        .queryEmbedding(queryEmbedding)  // Vector embedding for similarity search
        .query("search text")            // Text query for fulltext search
        .maxResults(10)
        .build()
);
```

### ハイブリッド検索の仕組み

1. **ベクトル検索**：クエリ embedding を使用して類似度検索を実行
2. **全文検索**：テキストフィールドで `MATCH AGAINST` を使用して全文検索を実行
3. **結果の融合**：RRF（Reciprocal Rank Fusion）アルゴリズムで結果を結合
   - 式：`score = Σ(1 / (k + rank))`（k=60）
   - 両方の検索からの各結果が、その順位に基づいて最終スコアに寄与
   - 結果は結合された RRF スコアで正規化およびソートされる

**利点：**
- より良い再現率：意味的類似度または正確なキーワードでドキュメントを発見
- 精度の向上：RRF が両方の検索タイプを効果的にバランス
- ベクトル検索単独よりも正確なキーワード一致をうまく処理

## 実装の詳細

### スコア計算

embedding store は SQL クエリ内で直接関連性スコアを計算します：
- **コサイン**：`score = (2 - cosine_distance) / 2`
- **L2/ユークリッド**：`score = 1 / (1 + distance)`
- **内積**：`score = (inner_product + 1) / 2`

スコアは [0, 1] の範囲で返され、1 が最も関連性の高い一致を表します。

### メタデータの扱い

- メタデータはデータベースに JSON として保存されます
- 大きな `Long` 値（> 2^53-1）は精度を保持するため自動的に文字列としてシリアライズされます
- フィルタリングは直接の列フィルタリングと JSON メタデータフィルタリングの両方をサポートします

### テーブルスキーマ

デフォルトでは、embedding テーブルは次の列を持ちます：

| 名前 | 型 | 説明 |
| ---- | ---- | ----------- |
| id | VARCHAR(36) | 主キー。embedding store が生成する UUID 文字列の保存に使用 |
| vector | JSON | embedding ベクトルを JSON 配列として保存 |
| text | TEXT | テキストセグメントを保存 |
| metadata | JSON | メタデータを JSON として保存 |

## 制限事項

- `removeAll(Filter)` および `removeAll()` メソッドはまだサポートされていません。代わりに `removeAll(Collection<String> ids)` を使用してください。
- テーブル列でフィルタリングする場合、フィールド名は大文字小文字を区別しませんが、実際の列名または認識されたエイリアスと一致する必要があります。

## 参考資料

- [OceanBase ドキュメント](https://www.oceanbase.com/docs)
- [Reciprocal Rank Fusion](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)
- [LangChain4j ドキュメント](https://docs.langchain4j.dev)
