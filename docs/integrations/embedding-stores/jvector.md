---
sidebar_position: 32
---

# JVector

https://github.com/jbellis/jvector

JVector は、グラフベースのインデックスを使用して高性能な近似最近傍（ANN）検索を提供する、純 Java の組み込みベクトル検索エンジンです。DiskANN と HNSW アルゴリズム族を融合し、精度とパフォーマンスのトレードオフを設定可能な高速類似度検索を提供します。

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-jvector</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

注意：これはコミュニティ統合モジュールです。プロジェクト構成に langchain4j-community リポジトリを追加する必要がある場合があります。

## API

- `JVectorEmbeddingStore`

## 機能

- **純 Java 実装**：ネイティブ依存関係は不要で、Java が動作する場所ならどこでも実行可能
- **グラフベースのインデックス**：Vamana アルゴリズム付きの HNSW 階層を使用した高性能 ANN 検索
- **デフォルトはインメモリ**：高速検索、オプションでディスク永続化
- **設定可能なパフォーマンス**：`maxDegree` や `beamWidth` などのパラメータで精度/速度のトレードオフを調整
- **複数の類似度関数**：DOT_PRODUCT（デフォルト）、COSINE、EUCLIDEAN 距離メトリクスをサポート
- **スレッドセーフ**：ノンブロッキング同時実行制御により安全な同時アクセスが可能
- **ディスク永続化**：インデックスのオプションの保存/読み込み機能
- **動的更新**：インデックス作成後も embedding の追加と削除が可能

## 基本的な使い方

### インメモリストア

シンプルなインメモリ embedding store を作成：

```java
EmbeddingStore<TextSegment> store = JVectorEmbeddingStore.builder()
    .dimension(384)                    // Must match your embedding model's dimension
    .build();
```

### 永続化ストア

ディスク永続化付きの embedding store を作成：

```java
EmbeddingStore<TextSegment> store = JVectorEmbeddingStore.builder()
    .dimension(384)
    .persistencePath("/path/to/index") // Base path for index files
    .build();

// Add embeddings...
store.add(embedding, textSegment);

// Save to disk
((JVectorEmbeddingStore) store).save();
```

`persistencePath` を指定して store を作成すると、その場所にファイルが存在する場合、インデックスが自動的にディスクから読み込まれます。

## 設定オプション

JVector はパフォーマンスを調整するための複数のビルダーオプションを提供します：

```java
EmbeddingStore<TextSegment> store = JVectorEmbeddingStore.builder()
    .dimension(384)                    // Required: embedding dimension
    .maxDegree(16)                     // Graph connectivity (default: 16)
    .beamWidth(100)                    // Index construction quality (default: 100)
    .neighborOverflow(1.2f)            // Overflow during construction (default: 1.2)
    .alpha(1.2f)                       // Diversity parameter (default: 1.2)
    .similarityFunction(VectorSimilarityFunction.DOT_PRODUCT) // Default
    .persistencePath("/path/to/index") // Optional: enable persistence
    .build();
```

### パラメータのガイドライン

- **dimension**：embedding モデルの出力次元と一致させる必要があります（必須）
- **maxDegree**：ノードあたりのグラフ接続数を制御します。値を大きくすると再現率が向上しますが、メモリ使用量が増えます。推奨：16（デフォルト）
- **beamWidth**：インデックス構築の品質を制御します。値を大きくするとより良いインデックスが構築されますが、時間がかかります。推奨：100（デフォルト）
- **neighborOverflow**：インメモリインデックスでは 1.2（デフォルト）、ディスクベースインデックスでは 1.5 を推奨
- **alpha**：エッジ距離と多様性のトレードオフを制御します。高次元ベクトルでは 1.2（デフォルト）、低次元（2D/3D）ベクトルでは 2.0 を推奨
- **similarityFunction**：
  - `DOT_PRODUCT` - 正規化ベクトルに対して最速（デフォルト）
  - `COSINE` - コサイン類似度用
  - `EUCLIDEAN` - ユークリッド距離用

## 永続化

JVector はインデックスのディスクへの保存と読み込みをサポートします：

```java
// Create store with persistence enabled
JVectorEmbeddingStore store = JVectorEmbeddingStore.builder()
    .dimension(384)
    .persistencePath("/path/to/index")
    .build();

// Add embeddings
store.add(embeddings, textSegments);

// Save to disk (creates .graph and .metadata files)
store.save();

// Later: Load automatically when creating with same path
JVectorEmbeddingStore loadedStore = JVectorEmbeddingStore.builder()
    .dimension(384)
    .persistencePath("/path/to/index")
    .build();
// All previous embeddings and index structure are restored
```

永続化では 2 つのファイルが作成されます：
- `{path}.graph` - ベクトルを含むグラフインデックス構造
- `{path}.metadata` - Embedding ID、テキストセグメント、メタデータ

## 現在の制限事項

- **メタデータフィルタリングなし**：JVector は検索操作中にメタデータで検索結果をフィルタリングすることをサポートしていません。すべてのフィルタリングは検索後に行う必要があります。
- **変更時のインデックス再構築**：embedding の追加または削除によりインデックスが無効になり、次回の検索時に再構築されます。最高のパフォーマンスを得るには、可能な限り追加をバッチ処理してください。
- **次元は一致必須**：すべての embedding は、store 作成時に指定された次元と同じである必要があります。

## パフォーマンス特性

JVector は次の用途向けに最適化されています：
- **高速類似度検索**：検索は対数時間計算量
- **線形スケーラビリティ**：インデックス構築は CPU コア数に比例してスケール
- **メモリ効率**：インメモリインデックスのみ、オプションでディスク永続化
- **高再現率**：グラフベースのアプローチは適切なチューニングで通常 >98% の再現率を達成

理想的なユースケース：
- 外部依存関係なしでベクトル検索が必要な組み込みアプリケーション
- 開発およびテスト環境
- インデックスを完全に制御したい本番デプロイメント
- 別途データベースを使わずにディスク永続化が必要なアプリケーション

## 例

- サンプルコードは [JVector ソースリポジトリ](https://github.com/jbellis/jvector/tree/main/jvector-examples) にあります
- LangChain4j 固有の統合例については、[langchain4j-community-jvector モジュール](https://github.com/langchain4j/langchain4j-community/tree/main/embedding-stores/langchain4j-community-jvector/src/test/java) のテストファイルを確認してください
