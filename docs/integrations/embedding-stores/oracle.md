---
sidebar_position: 18
---

# Oracle
Oracle Embedding Storeは、Oracle Databaseの
[AI Vector Search機能](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)と統合します。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-oracle</artifactId>
    <version>1.18.1-beta28</version>

</dependency>
```

## API

- `OracleEmbeddingStore`
- `OracleChatMemoryStore`


## 例

- [OracleEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/oracle-example/src/main/java/OracleEmbeddingStoreExample.java)

## 使い方

このストアのインスタンスは、ビルダーを構成して作成できます。ビルダーには
DataSourceと埋め込みテーブルの提供が必要です。2つのベクトル間の距離は、
2つのベクトル間の角度の余弦を測定する
[コサイン類似度](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/cosine-similarity.html)を使用して計算されます。

Universal Connection PoolやHikariなど、接続をプールする
DataSourceを構成することを推奨します。接続プールは、新しいデータベース接続を
繰り返し作成するレイテンシを回避します。

データベースに既に埋め込みテーブルが存在する場合は、テーブル名を指定します。

```java
EmbeddingStore embeddingStore = OracleEmbeddingStore.builder()
   .dataSource(myDataSource)
   .embeddingTable("my_embedding_table")
   .build();
```

テーブルがまだ存在しない場合は、CreateOptionをビルダーに渡して
作成できます。

```java
EmbeddingStore embeddingStore = OracleEmbeddingStore.builder()
   .dataSource(myDataSource)
   .embeddingTable("my_embedding_table", CreateOption.CREATE_IF_NOT_EXISTS)
   .build();
```

デフォルトでは、埋め込みテーブルは次の列を持ちます：

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | VARCHAR(36) | Primary key. Used to store UUID strings which are generated when the embedding store |
| embedding | VECTOR(*, FLOAT32) | Stores the embedding |
| text | CLOB | Stores the text segment |
| metadata | JSON | Stores the metadata |

既存のテーブルの列が事前定義された列名と一致しない場合、
または異なる列名を使用したい場合は、EmbeddingTable
ビルダーを使用して埋め込みテーブルを構成できます。

```java
OracleEmbeddingStore embeddingStore =
OracleEmbeddingStore.builder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
            .createOption(CREATE_OR_REPLACE) // use NONE if the table already exists
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .build())
    .build();
```

ビルダーでは、Indexクラスのインスタンスを提供することで、EmbeddingTableの
埋め込み列とメタデータ列にインデックスを作成できます。Indexクラスのインスタンスを
作成するためのビルダーは2つあります：IVFIndexBuilderとJSONIndexBuilderです。

*IVFIndexBuilder*を使用すると、EmbeddingTableの埋め込み列に
**IVF（Inverted File Flat）**インデックスを構成できます。

```java
OracleEmbeddingStore embeddingStore =
    OracleEmbeddingStore.builder()
        .dataSource(myDataSource)
        .embeddingTable(EmbeddingTable.builder()
            .createOption(CreateOption.CREATE_OR_REPLACE) // use NONE if the table already exists
            .name("my_embedding_table")
            .idColumn("id_column_name")
            .embeddingColumn("embedding_column_name")
            .textColumn("text_column_name")
            .metadataColumn("metadata_column_name")
            .build())
        .index(Index.ivfIndexBuilder().createOption(CreateOption.CREATE_OR_REPLACE).build())
        .build();
```

*JSONIndexBuilder*を使用すると、EmbeddingTableのメタデータ列のキーに
**関数ベースのインデックス**を構成できます。

```java
OracleEmbeddingStore.builder()
    .dataSource(myDataSource)
    .embeddingTable(EmbeddingTable.builder()
        .createOption(CreateOption.CREATE_OR_REPLACE) // use NONE if the table already exists
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

Oracle AI Vector Searchの詳細については、[ドキュメント](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/overview-ai-vector-search.html)を参照してください。

## チャットメモリ

`OracleChatMemoryStore`を使用すると、Oracle Databaseにチャットメモリを永続化できます。

テーブルを作成します：

```sql
CREATE TABLE chat_memory (
    memory_id VARCHAR2(255) PRIMARY KEY,
    content CLOB NOT NULL
);
```

チャットメモリで使用します：

```java
ChatMemoryStore store = OracleChatMemoryStore.builder()
   .dataSource(myDataSource)
   .tableName("chat_memory")
   .build();

ChatMemory chatMemory = MessageWindowChatMemory.builder()
   .id("conversation-1")
   .maxMessages(10)
   .chatMemoryStore(store)
   .build();
```

`OracleChatMemoryStore`はメモリIDごとに1行を格納し、すべてのメッセージは`content`列にJSONとしてシリアライズされます。
