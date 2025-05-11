---
sidebar_position: 18
---

# Oracle
Oracle埋め込みストアは、Oracleデータベースの[AIベクトル検索機能](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)と統合されています。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-oracle</artifactId>
    <version>1.0.0-beta4</version>

</dependency>
```

## API

- `OracleEmbeddingStore`


## 例

- [OracleEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/oracle-example/src/main/java/OracleEmbeddingStoreExample.java)

## 使用方法

このストアのインスタンスは、ビルダーを設定することで作成できます。ビルダーには、DataSourceと埋め込みテーブルを提供する必要があります。2つのベクトル間の距離は、2つのベクトル間の角度のコサインを測定する[コサイン類似度](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/cosine-similarity.html)を使用して計算されます。

Universal Connection PoolやHikariなど、接続をプールするDataSourceを設定することをお勧めします。接続プールは、新しいデータベース接続を繰り返し作成する際の遅延を回避します。

データベースに埋め込みテーブルが既に存在する場合は、テーブル名を提供します。

```java
EmbeddingStore embeddingStore = OracleEmbeddingStore.builder()
   .dataSource(myDataSource)
   .embeddingTable("my_embedding_table")
   .build();
```

テーブルがまだ存在しない場合は、ビルダーにCreateOptionを渡すことで作成できます。

```java
EmbeddingStore embeddingStore = OracleEmbeddingStore.builder()
   .dataSource(myDataSource)
   .embeddingTable("my_embedding_table", CreateOption.CREATE_IF_NOT_EXISTS)
   .build();
```

デフォルトでは、埋め込みテーブルには以下の列があります：

| 名前 | 型 | 説明 |
| ---- | ---- | ----------- |
| id | VARCHAR(36) | 主キー。埋め込みストアが生成するUUID文字列を格納するために使用されます |
| embedding | VECTOR | 埋め込みベクトルを格納するために使用されます |
| text | CLOB | 埋め込みに関連するテキストを格納するために使用されます |
| metadata | JSON | 埋め込みに関連するメタデータを格納するために使用されます |

埋め込みテーブルの列名をカスタマイズするには、EmbeddingTableビルダーを使用します：

```java
OracleEmbeddingStore embeddingStore =
OracleEmbeddingStore.builder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
            .createOption(CREATE_OR_REPLACE) // テーブルが既に存在する場合はNONEを使用
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .build())
    .build();
```

ビルダーでは、Indexクラスのインスタンスを提供することで、EmbeddingTableの埋め込み列とメタデータ列にインデックスを作成できます。Indexクラスのインスタンスを作成するには、IVFIndexBuilderとJSONIndexBuilderの2つのビルダーが用意されています。

*IVFIndexBuilder*は、EmbeddingTableの埋め込み列に**IVF（Inverted File Flat）**インデックスを設定できます。

```java
OracleEmbeddingStore embeddingStore =
    OracleEmbeddingStore.builder()
        .dataSource(myDataSource)
        .embeddingTable(EmbeddingTable.builder()
            .createOption(CreateOption.CREATE_OR_REPLACE) // テーブルが既に存在する場合はNONEを使用
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .build())
        .index(Index.ivfIndexBuilder().createOption(CreateOption.CREATE_OR_REPLACE).build())
        .build();
```

*JSONIndexBuilder*は、EmbeddingTableのメタデータ列のキーに**関数ベースのインデックス**を設定できます。

```java
OracleEmbeddingStore.builder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
        .createOption(CreateOption.CREATE_OR_REPLACE) // テーブルが既に存在する場合はNONEを使用
        .name("my_embedding_table")
        .idColumn("id_column_name")
        .embeddingColumn("embedding_column_name")
        .textColumn("text_column_name")
        .metadataColumn("metadata_column_name")
        .build())
    .index(Index.jsonIndexBuilder()
        .createOption(CreateOption.CREATE_OR_REPLACE)
        .key("name", String.class, JSONIndexBuilder.Order.ASC)
        .key("year", Integer.class, JSONIndexBuilder.Order.DESC)
        .build())
    .build();
```

Oracle AIベクトル検索の詳細については、[ドキュメント](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)を参照してください。
