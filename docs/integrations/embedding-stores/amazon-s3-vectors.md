---
sidebar_position: 29
---

# Amazon S3 Vectors

Amazon S3 Vectors Embedding Store は [Amazon S3 Vectors](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors.html) と統合します。これは、大規模なベクトル embedding の保存とクエリ向けに設計された Amazon S3 内の専用ベクトルストレージ機能です。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-s3-vectors</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## API

- `S3VectorsEmbeddingStore`

## 機能

- メタデータ付きで embedding を保存
- コサイン距離またはユークリッド距離によるベクトル類似度検索
- メタデータフィールドによる検索結果のフィルタリング
- 最初の embedding 挿入時にインデックスを自動作成
- 標準の AWS 認証情報プロバイダーをサポート

## 使い方

### 基本設定

```java
S3VectorsEmbeddingStore embeddingStore = S3VectorsEmbeddingStore.builder()
    .vectorBucketName("my-vector-bucket")       // S3 Vectors bucket name (required)
    .indexName("my-index")                       // Index name within the bucket (required)
    .region("us-west-2")                         // AWS region (default: us-east-1)
    .distanceMetric(DistanceMetric.COSINE)       // Distance metric (default: COSINE)
    .createIndexIfNotExists(true)                // Auto-create index (default: true)
    .timeout(Duration.ofSeconds(60))             // API call timeout (default: 30 seconds)
    .credentialsProvider(myCredentialsProvider)  // Custom AWS credentials
    .build();
```

### 既存の S3VectorsClient を使用する

すでに構成済みの S3VectorsClient がある場合は、ビルダーに直接渡すことができます：

```java
S3VectorsClient customClient = S3VectorsClient.builder()
    .region(Region.US_WEST_2)
    .credentialsProvider(myCredentialsProvider)
    .build();

S3VectorsEmbeddingStore embeddingStore = S3VectorsEmbeddingStore.builder()
    .s3VectorsClient(customClient)
    .vectorBucketName("my-vector-bucket")
    .indexName("my-index")
    .build();
```

## 距離メトリクス

S3 Vectors embedding store は 2 種類の距離メトリクスをサポートします。距離値は自動的に [0, 1] の範囲の関連性スコアに変換され、1 が最も関連性の高い一致を表します。

### コサイン距離（デフォルト）

**適している用途：** テキスト embedding、意味的類似度検索

- ベクトル間の角度のコサインを測定
- 関連性スコアへの変換：`score = (1 - distance + 1) / 2`
- 結果はベクトルの大きさに依存しない

```java
.distanceMetric(DistanceMetric.COSINE)  // Default, recommended for text embeddings
```

### ユークリッド距離

**適している用途：** 方向と大きさの両方が重要な場合

- ベクトル間の直線距離を測定
- 範囲：[0, ∞)
- 関連性スコアへの変換：`score = 1 / (1 + distance)`

```java
.distanceMetric(DistanceMetric.EUCLIDEAN)
```

## フィルタリング

S3 Vectors embedding store は、メタデータフィールドによる検索結果のフィルタリングをサポートします。

### サポートされるフィルター操作

- `isEqualTo`：等価比較
- `isNotEqualTo`：非等価比較
- `isGreaterThan`：より大きい比較
- `isGreaterThanOrEqualTo`：以上比較
- `isLessThan`：より小さい比較
- `isLessThanOrEqualTo`：以下比較
- `isIn`：IN 演算子（複数値）
- `isNotIn`：NOT IN 演算子
- `And`：論理積
- `Or`：論理和
- `Not`：論理否定

## 実装の詳細

### 認証情報

デフォルトでは、store は `DefaultCredentialsProvider` を使用し、標準の AWS 認証情報解決チェーン（環境変数、システムプロパティ、認証情報ファイル、EC2 インスタンスプロファイルなど）に従います。ビルダー経由でカスタムの `AwsCredentialsProvider` を提供できます。

### インデックス作成

`createIndexIfNotExists` が `true`（デフォルト）の場合、最初の embedding 挿入時にインデックスが自動作成されます。インデックスの次元と距離メトリクスは、追加された最初の embedding と設定された距離メトリクスに基づいて設定されます。

### リソースのクリーンアップ

`S3VectorsEmbeddingStore` は `AutoCloseable` を実装しています。store の使用が終わったら、`close()` を呼び出して基盤の S3VectorsClient リソースを解放するか、try-with-resources を使用してください。

## 制限事項

- **最大結果数**：S3 Vectors はクエリあたりの検索結果を 100 件に制限します（topK 範囲：1-100）
- **フィルターによる削除**：`removeAll(Filter)` はサポートされていません。代わりに `removeAll(Collection<String> ids)` を使用してください
- **全削除**：`removeAll()` はインデックス全体を削除します

## 例

- [S3VectorsEmbeddingStoreIT](https://github.com/langchain4j/langchain4j-community/blob/main/embedding-stores/langchain4j-community-s3-vectors/src/test/java/dev/langchain4j/community/store/embedding/s3/S3VectorsEmbeddingStoreIT.java)
