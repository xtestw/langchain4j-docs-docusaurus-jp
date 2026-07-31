---
sidebar_position: 23
---

# SQL Server

SQL Server Embedding Store は、SQL Server 2025 で導入された [ベクトル検索とベクトルインデックス](https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors?view=sql-server-ver17) と統合します。

## Maven 依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-sqlserver</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API

- `SQLServerEmbeddingStore`

## 使い方

このストアのインスタンスは builder を設定して作成できます。builder には
DataSource と埋め込みテーブルの提供が必須です。

Universal Connection Pool や Hikari など、接続をプールする
DataSource の設定を推奨します。接続プールは
新しいデータベース接続を繰り返し作成するレイテンシを回避します。

### 埋め込みストア設定の例

データベースに埋め込みテーブルが既にある場合は、テーブル設定を指定します：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .dimension(384) // Must specify dimension
           .build())
   .build();
```

テーブルがまだ存在しない場合は、create オプションを設定して作成できます：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .createOption(CreateOption.CREATE)
           .dimension(384) 
           .build())
   .build();
```

前のオプションはテーブルが既に存在する場合に失敗します。その場合は CREATE_IF_NOT_EXISTS オプションを使用できます：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .createOption(CreateOption.CREATE_IF_NOT_EXISTS)
           .dimension(384) 
           .build())
   .build();
```

最後に、テーブルを再作成したい場合は CREATE_OR_REPLACE オプションを使用できます：

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_embedding_table")
           .createOption(CreateOption.CREATE_OR_REPLACE)
           .dimension(384) 
           .build())
   .build();
```

既存テーブルの列が事前定義の列名と一致しない場合、
または別の列名を使いたい場合は、テーブル設定をカスタマイズできます：

```java
SQLServerEmbeddingStore embeddingStore =
SQLServerEmbeddingStore.dataSourceBuilder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
            .createOption(CreateOption.CREATE_OR_REPLACE)
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .dimension(1024)
            .build())
    .build();
```

DataSource を指定せずに SQL Server 接続を直接設定することもできます：

```java
SQLServerEmbeddingStore embeddingStore =
SQLServerEmbeddingStore.connectionBuilder()
    .host("localhost")
    .port(1433)
    .database("MyDatabase")
    .userName("myuser")
    .password("mypassword")
    .embeddingTable(EmbeddingTable.builder()
            .name("embeddings")
            .createOption(CreateOption.CREATE_OR_REPLACE)
            .dimension(384)
            .build())
    .build();
```

### 埋め込みテーブルスキーマ

デフォルトでは、埋め込みテーブルは次の列を持ちます：

| Name | Type              | Description |
| ---- |-------------------| ----------- |
| id | NVARCHAR(36)      | 主キー。埋め込みストア生成時に作られる UUID 文字列の保存に使用 |
| embedding | VECTOR(dimension) | SQL Server 2025 ネイティブベクトル型で埋め込みを保存 |
| text | NVARCHAR(MAX)     | テキストセグメントを保存 |
| metadata | JSON              | SQL Server 2025 ネイティブ JSON データ型でメタデータを保存 |


## 半精度（float16）サポート

### 動機

SQL Server の標準 `float32` ベクトルは **1998 次元** に制限されています。つまり、1998 次元を超えるベクトルを生成する埋め込みモデル（OpenAI の `text-embedding-3-large` は最大 3072 次元など）は、デフォルトのベクトル型では保存できません。

この制限を克服するため、SQL Server は半精度（`float16`）ベクトルをサポートし、より高い次元のベクトルを保存できます。詳細は [半精度ベクトルに関する Microsoft ドキュメント](https://learn.microsoft.com/en-us/sql/t-sql/data-types/vector-data-type-half-precision-float?view=sql-server-ver17) および [JDBC ドライバドキュメント](https://learn.microsoft.com/en-us/sql/connect/jdbc/use-vector-data-type?view=sql-server-ver17#use-vector-float16-data-type) を参照してください。

### 要件

- 半精度ベクトルを使うには、SQL Server データベースで**プレビュー機能を有効にする**必要があります。
- JDBC ドライバプロパティ `vectorTypeSupport` を `v2` に設定する必要があります。

### 設定

`EmbeddingTable` の `halfPrecision` パラメータが半精度ベクトルの使用を制御します：

- `HalfPrecisionConfiguration.OFF`（**デフォルト**）：`float32` ベクトルの使用を強制します。次元が 1998 より大きい場合、テーブル作成は失敗することに注意してください。
- `HalfPrecisionConfiguration.ON`：`float16` ベクトルの使用を強制します。
- `HalfPrecisionConfiguration.AUTO`：デフォルトで `float32` を使い、設定次元が 1998 より大きい場合は自動的に `float16` に切り替えます。

```java
EmbeddingStore<TextSegment> embeddingStore = SQLServerEmbeddingStore.dataSourceBuilder()
   .dataSource(myDataSource)
   .embeddingTable(EmbeddingTable.builder()
           .name("my_large_embedding_table")
           .dimension(3072)
           .halfPrecision(HalfPrecisionConfiguration.ON)
           .build())
   .build();
```

### 制限事項

- 半精度ベクトルサポートは現在 **Azure SQL データベース** でのみ利用可能です。
- 半精度ベクトルの使用は `float32` ベクトルと比較して**精度の低下**につながる場合があります。

## 重要な注意点

### 数値型
メタデータフィールド内のすべての数値は、`Long.MAX_VALUE` のような数値のオーバーフロー問題を避けるため、JSON 文字列として書き込まれます。

### ベクトル保存と類似度
SQL Server 2025+ はネイティブ VECTOR データ型をサポートし、本モジュールは [VECTOR_DISTANCE](https://learn.microsoft.com/en-us/sql/t-sql/functions/vector-distance-transact-sql?view=sql-server-ver17) 類似度関数を使用します。
本モジュールは `VECTOR_DISTANCE` 関数に対して次のメトリックをサポートします：

- **COSINE**：コサイン類似度（デフォルト）
- **EUCLIDEAN**：ユークリッド距離。ユークリッドメトリックは距離からスコアを得るために追加の計算が必要です。

### JSON メタデータサポート

SQL Server 2025 はネイティブ JSON データ型サポートと JSON インデックス機能を提供します。本モジュールは
メタデータ保存にネイティブ JSON データ型を使い、
[JSON_VALUE](https://learn.microsoft.com/es-es/sql/t-sql/functions/json-value-transact-sql?view=sql-server-ver17) 関数による最適化されたメタデータフィルタリングのため JSON インデックス作成をサポートします。

特定のメタデータキーに対する JSON インデックス作成を設定でき、キーの順序を任意で指定できます：

```java
EmbeddingTable embeddingTable = EmbeddingTable.builder()
    .name("test_table")
    .createOption(CreateOption.CREATE_OR_REPLACE)
    .dimension(4)
    .build();

SQLServerEmbeddingStore embeddingStore =
    SQLServerEmbeddingStore.dataSourceBuilder()
        .dataSource(myDataSource)
        .embeddingTable(embeddingTable)
        .addIndex(Index.jsonIndexBuilder()
            .createOption(CreateOption.CREATE_OR_REPLACE)
            .key("author", String.class, JSONIndexBuilder.Order.ASC)
            .key("year", Integer.class)
            .build()
        )
        .build();
```

- `Index.jsonIndexBuilder()` で作成したインデックスは `CreateOption.CREATE_IF_NOT_EXISTS` オプションをサポートしません。

## 制限事項

- ベクトルインデックスの性能はデータサイズと分布に依存します
- ベクトル列上の DiskANN インデックスはサポートされていません
- メタデータの大文字小文字を区別する文字列比較のため、データベース照合順序は大文字小文字を区別する照合順序に設定すべきです
- DOT 距離メトリックはサポートされていません
