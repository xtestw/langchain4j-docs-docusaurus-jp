---
sidebar_position: 34
---

# Hazelcast

[Hazelcast](https://hazelcast.com/) は分散インメモリデータグリッドおよびコンピューティングプラットフォームです。
LangChain4j は 2 つのモジュール経由で Hazelcast と統合しており、オープンソース経路が
Enterprise/ライセンス要件から自由であるよう分割されています：

- **`langchain4j-community-hazelcast`**（オープンソース）— Hazelcast `IMap` をバックエンドとする
  `ChatMemoryStore` である `HazelcastChatMemoryStore` を提供します。オープンソースの Community Edition
  に対してライセンスなしで動作します。
- **`langchain4j-community-hazelcast-enterprise`**（Hazelcast Enterprise が必要）— 
  `HazelcastEmbeddingStore`（`VectorCollection` によるベクトル検索）と
  `HazelcastCPMapChatMemoryStore`（CP Subsystem に支えられた強一貫性チャットメモリストア）を提供します。
  このモジュールは `langchain4j-community-hazelcast` を再エクスポートするため、Enterprise 利用者は
  単一依存関係で `IMap` ベースのストアも利用できます。

## Maven 依存関係

### オープンソース（チャットメモリストア）

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-hazelcast</artifactId>
    <version>${latest version here}</version>
</dependency>
```

Hazelcast 依存関係は `provided` スコープのため、実行対象のエディションを追加してください。デフォルトは
オープンソースの Community Edition です：

```xml
<dependency>
    <groupId>com.hazelcast</groupId>
    <artifactId>hazelcast</artifactId>
    <version>5.7.0</version>
</dependency>
```

### Hazelcast Enterprise（埋め込みストア + CP チャットメモリ）

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-hazelcast-enterprise</artifactId>
    <version>${latest version here}</version>
</dependency>
```

または BOM を使ってバージョンを一貫して管理します：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-community-bom</artifactId>
            <version>${latest version here}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

:::note
`HazelcastEmbeddingStore` と `HazelcastCPMapChatMemoryStore` には **Hazelcast Enterprise** が必要です。
`com.hazelcast:hazelcast-enterprise` は Maven Central にはありません — 
`langchain4j-community-hazelcast-enterprise` により推移的に取り込まれますが、Hazelcast release リポジトリと
有効な Enterprise ライセンスキーを追加する必要があります：

```xml
<repositories>
    <repository>
        <id>hazelcast-release</id>
        <name>Hazelcast Release Repository</name>
        <url>https://repository.hazelcast.com/release/</url>
    </repository>
</repositories>
```

ライセンスキーは `config.setLicenseKey(...)` または `HZ_LICENSEKEY` 環境変数で指定します。
`HazelcastCPMapChatMemoryStore` はさらに CP Subsystem の有効化が必要で、そうでない場合は即座に失敗します。
:::

## チャットメモリストア

`HazelcastChatMemoryStore`（オープンソース）は、各チャットメモリを JSON シリアライズされた
`ChatMessage` のリストとして Hazelcast `IMap` に保存します。渡す `HazelcastInstance` は
埋め込みメンバーでもシンクライアントでも構いません — builder は区別しません。

```java
// Embedded member
HazelcastInstance hz = Hazelcast.newHazelcastInstance(new Config());

ChatMemoryStore store = HazelcastChatMemoryStore.builder()
        .hazelcastInstance(hz)
        .name("chatMemory") // optional, defaults to "chatMemory"
        .build();
```

```java
// Client connecting to an external cluster
ClientConfig clientConfig = new ClientConfig();
clientConfig.getNetworkConfig().addAddress("hazelcast-host:5701");
HazelcastInstance hzClient = HazelcastClient.newHazelcastClient(clientConfig);

ChatMemoryStore store = HazelcastChatMemoryStore.builder()
        .hazelcastInstance(hzClient)
        .build();
```

事前設定済みの `IMap` を
`HazelcastChatMemoryStore.create(IMap<String, String>)` で直接ラップすることもできます。

### 強一貫性バリアント（Enterprise）

`HazelcastCPMapChatMemoryStore`（Enterprise）は、
[CP Subsystem](https://docs.hazelcast.com/hazelcast/latest/cp-subsystem/cp-subsystem) 内の `CPMap` をバックエンドとする代替実装です。これは
**線形化可能**（強一貫性、Raft ベース）であり、同一の `memoryId`
が同時に更新される場合の更新損失を回避します。インスタンス上で CP Subsystem を有効にする必要があります。

```java
Config config = new Config();
config.getCPSubsystemConfig().setCPMemberCount(3); // CP Subsystem must be enabled
HazelcastInstance hz = Hazelcast.newHazelcastInstance(config);

ChatMemoryStore store = HazelcastCPMapChatMemoryStore.builder()
        .hazelcastInstance(hz)
        .name("chatMemory")
        .build();
```

`IMap` ストアとのトレードオフ：`CPMap` は **パーティションされない**（各 CP
メンバーの RAM に収まる必要があり、デフォルト合計 100 MB）うえ、**TTL/エビクションがない**。多くの小さな会話に適しており、
非常に大規模なユーザー集団にわたる無制限の履歴には `IMap` ベースのストアを優先してください。

## 埋め込みストア

`HazelcastEmbeddingStore`（Enterprise）は Hazelcast `VectorCollection` をバックエンドとします。ベクトルインデックスの
次元は使用中の埋め込みモデルと一致する必要があり、メトリックのデフォルトは `COSINE` です。

```java
HazelcastInstance hz = Hazelcast.newHazelcastInstance(new Config());

EmbeddingStore<TextSegment> store = HazelcastEmbeddingStore.builder()
        .hazelcastInstance(hz)
        .collectionName("embeddings")   // optional, defaults to "embeddings"
        .dimension(384)                 // required, must match the embedding model
        .metric(Metric.COSINE)          // optional, defaults to COSINE
        .build();
```

事前設定済みの `VectorCollection` を
`HazelcastEmbeddingStore.create(VectorCollection<String, TextSegmentDocument>)` でラップすることもできます。`search(...)` が返す関連性スコアは
Hazelcast がすでに正規化した COSINE スコアであり、そのまま使用します。

### 制限事項

- `removeAll(Filter)` は **サポートされていません** — `VectorCollection` にサーバー側の述語削除がなく、
  `UnsupportedFeatureException` を投げます。ID による削除、`removeAll(Collection<String>)`、および
  `removeAll()` はサポートされています。
- 検索時のメタデータフィルタリングはサーバー側では **行われません**。`EmbeddingSearchRequest`
  にフィルタがある場合、取得後に **クライアント側で適用**（警告がログ出力）され、
  `maxResults` より少ない一致が返ることがあります。

## API

- `HazelcastChatMemoryStore` — `IMap` ベース（AP）、オープンソース
- `HazelcastCPMapChatMemoryStore` — `CPMap` ベース（CP、線形化可能）、Enterprise
- `HazelcastEmbeddingStore` — `VectorCollection` ベースのベクトルストア、Enterprise

## 例

- [HazelcastChatMemoryStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/hazelcast-example/src/main/java/HazelcastChatMemoryStoreExample.java)
- [HazelcastCPMapChatMemoryStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/hazelcast-example/src/main/java/HazelcastCPMapChatMemoryStoreExample.java)
- [HazelcastEmbeddingStoreExample](https://github.com/langchain4j/langchain4j-examples/blob/main/hazelcast-example/src/main/java/HazelcastEmbeddingStoreExample.java)
