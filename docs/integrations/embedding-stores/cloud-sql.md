# Google Cloud SQL for PostgreSQL

[Cloud SQL](https://cloud.google.com/sql/docs/postgres)は、高性能、シームレスな統合、印象的なスケーラビリティを提供する完全管理型のリレーショナルデータベースサービスです。Cloud SQLはPostgreSQLと100%互換性があります。Cloud SQLのLangchain統合を活用して、データベースアプリケーションをAI駆動のエクスペリエンスに拡張しましょう。

このモジュールはCloud SQL for PostgreSQLデータベースによってバックアップされた`EmbeddingStore`を実装しています。

## 始める前に

このライブラリを使用するには、まず以下の手順を実行する必要があります：

1. [Cloud Platformプロジェクトを選択または作成します。](https://console.cloud.google.com/project)
2. [プロジェクトの課金を有効にします。](https://cloud.google.com/billing/docs/how-to/modify-project#enable_billing_for_a_project)
3. [CloudSQL APIを有効にします。](https://console.cloud.google.com/flows/enableapi?apiid=sql.googleapis.com)
4. [認証を設定します。](https://googleapis.dev/python/google-api-core/latest/auth.html)

### Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artificatId>langchain4j-community-cloud-sql-pg</artificatId>
    <version>1.0.0-beta4</version>
</dependency>
```

## PostgresEmbeddingStoreの使用方法

ベクトルストアを使用してテキスト埋め込みデータを保存し、ベクトル検索を実行します。`PostgresEmbeddingStore`のインスタンスは、提供された`Builder`を設定することで作成でき、以下が必要です：

- `PostgresEngine`インスタンス
- テーブル名
- スキーマ名（オプション、デフォルト：「public」）
- コンテンツ列（オプション、デフォルト：「content」）
- 埋め込み列（オプション、デフォルト：「embedding」）
- ID列（オプション、デフォルト：「langchain_id」）
- メタデータ列名（オプション）
- 追加のメタデータJSON列（オプション、デフォルト：「langchain_metadata」）
- 無視するメタデータ列名（オプション）
- 距離戦略（オプション、デフォルト：DistanceStrategy.COSINE_DISTANCE）
- クエリオプション（オプション）

使用例：
```java
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.engine.EmbeddingStoreConfig;
import dev.langchain4j.engine.PostgresEngine;
import dev.langchain4j.engine.MetadataColumn;
import dev.langchain4j.store.embedding.cloudsql.PostgresEmbeddingStore;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

PostgresEngine engine = new PostgresEngine.Builder()
    .projectId("")
    .region("")
    .instance("")
    .database("")
    .build();

PostgresEmbeddingStore store = new PostgresEmbeddingStore.Builder(engine, TABLE_NAME)
    .build();

List<String> testTexts = Arrays.asList("cat", "dog", "car", "truck");
List<Embedding> embeddings = new ArrayList<>();
List<TextSegment> textSegments = new ArrayList<>();
EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

for (String text : testTexts) {
    Map<String, Object> metaMap = new HashMap<>();
    metaMap.put("my_metadata", "string");
    Metadata metadata = new Metadata(metaMap);
    textSegments.add(new TextSegment(text, metadata));
    embeddings.add(MyEmbeddingModel.embed(text).content());
}
List<String> ids = store.addAll(embeddings, textSegments);
// "cat"を検索
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
        .queryEmbedding(embeddings.get(0))
        .maxResults(10)
        .minScore(0.9)
        .build();
List<EmbeddingMatch<TextSegment>> result = store.search(request).matches();
// "cat"を削除
store.removeAll(singletonList(result.get(0).embeddingId()));
```
