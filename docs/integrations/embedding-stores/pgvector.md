---
sidebar_position: 19
---

# PGVector

LangChain4jは[PGVector](https://github.com/pgvector/pgvector)とシームレスに統合され、開発者がPostgreSQLで直接ベクトル埋め込みを保存およびクエリできるようにします。この統合は、セマンティック検索、RAGなどのアプリケーションに最適です。

## Maven依存関係

```xml

<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-pgvector</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## Gradle依存関係

```implementation 'dev.langchain4j:langchain4j-pgvector:1.0.0-beta4'```

## API

- `PgVectorEmbeddingStore`

## パラメータ概要

| Plain Javaプロパティ    | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                    | デフォルト値   | 必須/オプション                                                                                                                                                                                                                                                                 |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `datasource`            | データベース接続に使用される`DataSource`オブジェクト。提供されない場合、`host`、`port`、`user`、`password`、および`database`を個別に提供する必要があります。                                                                                                                                                                                                                                                                                                                      | なし            | `host`、`port`、`user`、`password`、および`database`が個別に提供されない場合は必須。                                                                                                                                                                                                     |
| `host`                  | PostgreSQLサーバーのホスト名。`DataSource`が提供されない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                   | なし            | `DataSource`が提供されない場合は必須                                                                                                                                                                                                                                          |
| `port`                  | PostgreSQLサーバーのポート番号。`DataSource`が提供されない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                | なし            | `DataSource`が提供されない場合は必須                                                                                                                                                                                                                                          |
| `user`                  | データベース認証用のユーザー名。`DataSource`が提供されない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                | なし            | `DataSource`が提供されない場合は必須                                                                                                                                                                                                                                          |
| `password`              | データベース認証用のパスワード。`DataSource`が提供されない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                | なし            | `DataSource`が提供されない場合は必須                                                                                                                                                                                                                                          |
| `database`              | 接続するデータベースの名前。`DataSource`が提供されない場合は必須。                                                                                                                                                                                                                                                                                                                                                                                  | なし            | `DataSource`が提供されない場合は必須                                                                                                                                                                                                                                          |
| `table`                 | 埋め込みの保存に使用されるデータベーステーブルの名前。                                                                                                                                                                                                                                                                                                                                                                                                    | なし            | 必須                                                                                                                                                                                                                                                                          |
| `dimension`             | 埋め込みベクトルの次元数。使用する埋め込みモデルと一致する必要があります。動的に設定するには`embeddingModel.dimension()`を使用します。                                                                                                                                                                                                                                                                                                         | なし            | 必須                                                                                                                                                                                                                                                                          |
| `useIndex`              | IVFFlatインデックスはベクトルをリストに分割し、クエリベクトルに最も近いリストのサブセットを検索します。HNSWよりも構築時間が速く、メモリ使用量が少ないですが、クエリパフォーマンス（速度と再現率のトレードオフの観点で）は低くなります。[IVFFlat](https://github.com/pgvector/pgvector#ivfflat)インデックスを使用する必要があります。                                                                                                                                    | `false`         | オプション                                                                                                                                                                                                                                                                          |
| `indexListSize`         | IVFFlatインデックスのリスト数。                                                                                                                                                                                                                                                                                                                                                                                                                     | なし            | 必須の場合：`useIndex`が`true`の場合、`indexListSize`を提供する必要があり、ゼロより大きくなければなりません。そうでない場合、テーブル初期化中にプログラムは例外をスローします。オプションの場合：`useIndex`が`false`の場合、このプロパティは無視され、設定する必要はありません。 |
| `createTable`           | 埋め込みテーブルを自動的に作成するかどうかを指定します。                                                                                                                                                                                                                                                                                                                                                                                                | `true`          | オプション                                                                                                                                                                                                                                                                          |
| `dropTableFirst`        | テーブルを再作成する前にテーブルを削除するかどうかを指定します（テスト用に便利）。                                                                                                                                                                                                                                                                                                                                                                                   | `false`         | オプション                                                                                                                                                                                                                                                                          |
| `metadataStorageConfig` | 埋め込みに関連するメタデータを処理するための設定オブジェクト。3つのストレージモードをサポートします：<ul><li>**COLUMN_PER_KEY**：メタデータキーを事前に知っている場合の静的メタデータ用。</li><li>**COMBINED_JSON**：メタデータキーを事前に知らない場合の動的メタデータ用。データをJSONとして保存します。（デフォルト）</li><li>**COMBINED_JSONB**：JSONと同様ですが、大規模データセットでのクエリを最適化するためにバイナリ形式で保存されます。</li></ul> | `COMBINED_JSON` | オプション。設定されていない場合、`COMBINED_JSON`のデフォルト設定が使用されます。                                                                                                                                                                                                       |

## 例

PGVectorの機能を示すために、DockerizedされたPostgreSQLセットアップを使用できます。Testcontainersを活用してPGVectorを搭載したPostgreSQLを実行します。

#### Dockerでのクイックスタート

PGVector拡張機能を搭載したPostgreSQLインスタンスをすぐに設定するには、次のDockerコマンドを使用できます：

```
docker run --rm --name langchain4j-postgres-test-container -p 5432:5432 -e POSTGRES_USER=my_user -e POSTGRES_PASSWORD=my_password pgvector/pgvector
```

#### コマンドの説明：

- ```docker run```：新しいコンテナを実行します。
- ```--rm```：停止後にコンテナを自動的に削除し、残留データがないことを確認します。
- ```--name langchain4j-postgres-test-container```：コンテナに簡単に識別できるようlangchain4j-postgres-test-containerという名前を付けます。
- ```-p 5432:5432```：ローカルマシンのポート5432をコンテナのポート5432にマッピングします。
- ```-e POSTGRES_USER=my_user```：PostgreSQLのユーザー名をmy_userに設定します。
- ```-e POSTGRES_PASSWORD=my_password```：PostgreSQLのパスワードをmy_passwordに設定します。
- ```pgvector/pgvector```：使用するDockerイメージを指定し、PGVector拡張機能で事前設定されています。

以下は、PgVectorEmbeddingStoreを作成する方法を示す2つのコード例です。最初の例では必須パラメータのみを使用し、2番目の例ではすべての利用可能なパラメータを設定しています。

1. 必須パラメータのみ

```java
EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        .host("localhost")                           // 必須：PostgreSQLインスタンスのホスト
        .port(5432)                                  // 必須：PostgreSQLインスタンスのポート
        .database("postgres")                        // 必須：データベース名
        .user("my_user")                             // 必須：データベースユーザー
        .password("my_password")                     // 必須：データベースパスワード
        .table("my_embeddings")                      // 必須：埋め込みを保存するテーブル名
        .dimension(embeddingModel.dimension())       // 必須：埋め込みの次元数
        .build();
```

2. すべてのパラメータを設定

この例では、DataSource、useIndex、indexListSize、createTable、dropTableFirst、metadataStorageConfigなど、一般的に使用されるオプションパラメータをすべて含めています。必要に応じてこれらの値を調整してください：

 ```java
DataSource dataSource = ...;                 // 利用可能な場合、事前設定されたDataSource

EmbeddingStore<TextSegment> embeddingStore = PgVectorEmbeddingStore.builder()
        // 接続とテーブルのパラメータ
        .datasource(dataSource)                      // オプション：ホスト/ポート認証情報の代わりにDataSourceを使用する場合
        .host("localhost")
        .port(5432)
        .database("postgres")
        .user("my_user")
        .password("my_password")
        .table("my_embeddings")

        // 埋め込みの次元数
        .dimension(embeddingModel.dimension())      // 必須：埋め込みモデルの出力次元と一致する必要があります

        // インデックスとパフォーマンスオプション
        .useIndex(true)                             // IVFFlatインデックスを有効にする
        .indexListSize(100)                         // IVFFlatインデックスのリスト数

        // テーブル作成オプション
        .createTable(true)                          // テーブルが存在しない場合は自動的に作成する
        .dropTableFirst(false)                      // 最初にテーブルを削除しない（新しく始める場合はtrueに設定）

        // メタデータストレージ形式
        .metadataStorageConfig(MetadataStorageConfig.combinedJsonb()) // メタデータを結合されたJSONB列として保存

        .build();
```

すぐに始めるための最小限の設定が必要な場合は、最初の例を使用してください。
2番目の例は、より多くの制御とカスタマイズのために利用可能なすべてのビルダーパラメータを活用する方法を示しています。

- [例](https://github.com/langchain4j/langchain4j-examples/tree/main/pgvector-example/src/main/java)
