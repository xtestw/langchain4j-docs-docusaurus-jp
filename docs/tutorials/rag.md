---
sidebar_position: 8
---

# RAG（検索拡張生成）

LLMの知識はトレーニングされたデータに限定されています。
LLMにドメイン固有の知識や独自データを認識させたい場合、以下の方法があります：
- このセクションで説明するRAGを使用する
- 自分のデータでLLMをファインチューニングする
- [RAGとファインチューニングの両方を組み合わせる](https://gorilla.cs.berkeley.edu/blogs/9_raft.html)


## RAGとは？
簡単に言えば、RAGはLLMに送信する前に、プロンプトにデータから関連情報を見つけて挿入する方法です。
これによりLLMは（うまくいけば）関連情報を取得し、その情報を使用して回答できるようになり、
幻覚の可能性を減らすことができます。

関連情報はさまざまな[情報検索](https://en.wikipedia.org/wiki/Information_retrieval)方法で見つけることができます。
最も一般的なものは：
- 全文（キーワード）検索。この方法はTF-IDFやBM25などの技術を使用して、
クエリ（ユーザーが尋ねていること）のキーワードをドキュメントデータベースと照合して検索します。
各ドキュメント内のキーワードの頻度と関連性に基づいて結果をランク付けします。
- ベクトル検索（「意味検索」とも呼ばれる）。
テキストドキュメントは埋め込みモデルを使用して数値のベクトルに変換されます。
クエリベクトルとドキュメントベクトル間のコサイン類似度や
その他の類似度/距離測定に基づいてドキュメントを検索しランク付けし、
より深い意味を捉えます。
- ハイブリッド。複数の検索方法（全文+ベクトルなど）を組み合わせると、通常は検索の効果が向上します。

現在、このページは主にベクトル検索に焦点を当てています。
全文検索とハイブリッド検索は現在、Azure AI Search統合でのみサポートされています。
詳細は`AzureAiSearchContentRetriever`を参照してください。
近い将来、全文検索とハイブリッド検索を含むRAGツールボックスを拡張する予定です。


## RAGの段階
RAGプロセスは、インデックス作成と検索という2つの明確な段階に分かれています。
LangChain4jは両方の段階のためのツールを提供しています。

### インデックス作成

インデックス作成段階では、検索段階で効率的な検索を可能にするようにドキュメントが前処理されます。

このプロセスは使用される情報検索方法によって異なります。
ベクトル検索の場合、通常はドキュメントのクリーニング、追加データとメタデータによる強化、
小さなセグメント（チャンキングとも呼ばれる）への分割、これらのセグメントの埋め込み、
最後に埋め込みストア（ベクトルデータベースとも呼ばれる）への保存が含まれます。

インデックス作成段階は通常オフラインで行われ、エンドユーザーがその完了を待つ必要はありません。
これは例えば、週末に社内ドキュメントを週に一度再インデックス化するcronジョブを通じて実現できます。
インデックス作成を担当するコードは、インデックス作成タスクのみを処理する別のアプリケーションにすることもできます。

ただし、一部のシナリオでは、エンドユーザーがLLMがアクセスできるようにカスタムドキュメントをアップロードしたい場合があります。
この場合、インデックス作成はオンラインで行われ、メインアプリケーションの一部である必要があります。

以下はインデックス作成段階の簡略化された図です：
[![](/img/rag-ingestion.png)](/tutorials/rag)


### 検索

検索段階は通常、ユーザーがインデックス付きドキュメントを使用して回答すべき質問を送信したときに、オンラインで行われます。

このプロセスは使用される情報検索方法によって異なります。
ベクトル検索の場合、通常はユーザーのクエリ（質問）を埋め込み、
埋め込みストアで類似性検索を実行します。
関連するセグメント（元のドキュメントの一部）がプロンプトに挿入され、LLMに送信されます。

以下は検索段階の簡略化された図です：
[![](/img/rag-retrieval.png)](/tutorials/rag)


## LangChain4jのRAGフレーバー

LangChain4jは3つのRAGフレーバーを提供しています：
- [Easy RAG](/tutorials/rag/#easy-rag)：RAGを始める最も簡単な方法
- [Naive RAG](/tutorials/rag/#naive-rag)：ベクトル検索を使用したRAGの基本的な実装
- [Advanced RAG](/tutorials/rag/#advanced-rag)：クエリ変換、複数ソースからの検索、再ランキングなどの追加ステップを可能にするモジュラーRAGフレームワーク


## Easy RAG
LangChain4jには、RAGを始めるのをできるだけ簡単にする「Easy RAG」機能があります。
埋め込みについて学んだり、ベクトルストアを選んだり、適切な埋め込みモデルを見つけたり、
ドキュメントの解析や分割方法を理解したりする必要はありません。
ドキュメントを指定するだけで、LangChain4jが魔法をかけます。

カスタマイズ可能なRAGが必要な場合は、[次のセクション](/tutorials/rag#rag-apis)にスキップしてください。

Quarkusを使用している場合は、さらに簡単にEasy RAGを行う方法があります。
[Quarkusのドキュメント](https://docs.quarkiverse.io/quarkus-langchain4j/dev/easy-rag.html)をお読みください。

:::note
もちろん、このような「Easy RAG」の品質は、調整されたRAGセットアップよりも低くなります。
しかし、これはRAGについて学び始めたり、概念実証を作成したりする最も簡単な方法です。
後で、Easy RAGからより高度なRAGへスムーズに移行し、
より多くの側面を調整およびカスタマイズすることができます。
:::

1. `langchain4j-easy-rag`依存関係をインポートします：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-easy-rag</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

2. ドキュメントを読み込みましょう：
```java
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation");
```
これにより、指定されたディレクトリからすべてのファイルが読み込まれます。

<details>
<summary>内部で何が起きているのか？</summary>

幅広いドキュメントタイプをサポートするApache Tikaライブラリが、
ドキュメントタイプを検出して解析するために使用されます。
どの`DocumentParser`を使用するかを明示的に指定しなかったため、
`FileSystemDocumentLoader`はSPIを通じて`langchain4j-easy-rag`依存関係によって提供される
`ApacheTikaDocumentParser`を読み込みます。
</details>

<details>
<summary>ドキュメントの読み込みをカスタマイズする方法は？</summary>

すべてのサブディレクトリからドキュメントを読み込みたい場合は、`loadDocumentsRecursively`メソッドを使用できます：
```java
List<Document> documents = FileSystemDocumentLoader.loadDocumentsRecursively("/home/langchain4j/documentation");
```
さらに、globまたは正規表現を使用してドキュメントをフィルタリングできます：
```java
PathMatcher pathMatcher = FileSystems.getDefault().getPathMatcher("glob:*.pdf");
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation", pathMatcher);
```

:::note
`loadDocumentsRecursively`メソッドを使用する場合、globで二重アスタリスク（単一ではなく）を使用することをお勧めします：`glob:**.pdf`。
:::
</details>

3. 次に、ドキュメントを前処理し、特殊な埋め込みストア（ベクトルデータベースとも呼ばれる）に保存する必要があります。
これは、ユーザーが質問したときに関連情報をすばやく見つけるために必要です。
15以上の[サポートされている埋め込みストア](/integrations/embedding-stores)のいずれかを使用できますが、
簡単にするためにインメモリのものを使用します：
```java
InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
EmbeddingStoreIngestor.ingest(documents, embeddingStore);
```

<details>
<summary>内部で何が起きているのか？</summary>

1. `EmbeddingStoreIngestor`はSPIを通じて`langchain4j-easy-rag`依存関係から`DocumentSplitter`を読み込みます。
各`Document`は、それぞれが300トークン以下で30トークンのオーバーラップを持つ小さな部分（`TextSegment`）に分割されます。

2. `EmbeddingStoreIngestor`はSPIを通じて`langchain4j-easy-rag`依存関係から`EmbeddingModel`を読み込みます。
各`TextSegment`は`EmbeddingModel`を使用して`Embedding`に変換されます。

:::note
Easy RAGのデフォルト埋め込みモデルとして[bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)を選択しました。
[MTEBリーダーボード](https://huggingface.co/spaces/mteb/leaderboard)で印象的なスコアを達成し、
その量子化バージョンはわずか24メガバイトのスペースしか占めません。
したがって、[ONNXランタイム](https://onnxruntime.ai/)を使用して、
簡単にメモリにロードし、同じプロセスで実行できます。

そうです、テキストを埋め込みに変換することは、外部サービスなしで、
同じJVMプロセス内で完全にオフラインで行うことができます。
LangChain4jは5つの人気のある埋め込みモデルを
[すぐに使える形で](https://github.com/langchain4j/langchain4j-embeddings)提供しています。
:::

3. すべての`TextSegment`-`Embedding`ペアが`EmbeddingStore`に保存されます。
</details>

4. 最後のステップは、LLMへのAPIとして機能する[AIサービス](/tutorials/ai-services)を作成することです：
```java
interface Assistant {

    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(ChatModel) // 任意のLLM
    .contentRetriever(EmbeddingStoreContentRetriever.builder()
        .embeddingStore(embeddingStore)
        .embeddingModel(EmbeddingModel) // 任意の埋め込みモデル
        .maxResults(3)
        .build())
    .build();

String answer = assistant.chat("LangChain4jのRAGについて教えてください");
```

<details>
<summary>内部で何が起きているのか？</summary>

1. `assistant.chat("LangChain4jのRAGについて教えてください")`が呼び出されると、
`EmbeddingStoreContentRetriever`は`EmbeddingModel`を使用してクエリを埋め込みます。

2. `EmbeddingStoreContentRetriever`は埋め込みストアで類似性検索を実行し、
クエリに最も関連する3つの`TextSegment`を取得します。

3. これらの`TextSegment`はプロンプトに挿入され、LLMに送信されます。

4. LLMは提供された情報を使用して回答を生成します。
</details>

<details>
<summary>Easy RAGの制限は？</summary>

Easy RAGは、RAGを始めるための最も簡単な方法ですが、いくつかの制限があります：
- 英語のみをサポートしています。
- 埋め込みモデルはJVMプロセス内で実行されるため、大きなドキュメントコレクションには適していません。
- 埋め込みストアはインメモリであるため、アプリケーションの再起動時にすべてのデータが失われます。
- ドキュメントの分割方法をカスタマイズすることはできません。
- 検索結果の数をカスタマイズすることはできません。
- 検索結果のフィルタリングはできません。
- 検索結果の再ランキングはできません。
- 検索結果の後処理はできません。
- 複数のソースからの検索はできません。
- クエリの変換はできません。
- 検索結果の最小類似度スコアを設定することはできません。
- 検索結果の最大数を動的に設定することはできません。
- 検索結果のフィルタを動的に設定することはできません。
- 検索結果の最小類似度スコアを動的に設定することはできません。
- 検索結果の再ランキングを動的に設定することはできません。
- 検索結果の後処理を動的に設定することはできません。
- 複数のソースからの検索を動的に設定することはできません。
- クエリの変換を動的に設定することはできません。
- 検索結果の最小類似度スコアを動的に設定することはできません。
</details>

## RAG APIs

LangChain4jは、RAGの実装に使用できる一連のAPIを提供しています。
これらのAPIは、RAGの各段階（インデックス作成と検索）に対応しています。

### Document
`Document`クラスは、テキストとメタデータを含むドキュメントを表します。
メタデータは、ドキュメントに関する追加情報を提供するキーと値のペアのマップです。
例えば、ファイル名、作成日、著者、タイトルなどです。

<details>
<summary>便利なメソッド</summary>

- `Document.text()`は`Document`のテキストを返します
- `Document.metadata()`は`Document`の`Metadata`を返します
- `Document.from(String, Metadata)`はテキストと`Metadata`から`Document`を作成します
- `Document.from(String)`はテキストから空の`Metadata`を持つ`Document`を作成します
</details>

### Document Loader
`DocumentLoader`インターフェースは、さまざまなソースからドキュメントを読み込むための抽象化を提供します。
LangChain4jには、いくつかの組み込み実装があります：
- `FileSystemDocumentLoader`
- `UrlDocumentLoader`
- `S3DocumentLoader`

<details>
<summary>便利なメソッド</summary>

- `DocumentLoader.loadDocument()`は単一の`Document`を読み込みます
- `DocumentLoader.loadDocuments()`は複数の`Document`を読み込みます
</details>

### Document Parser
`DocumentParser`インターフェースは、さまざまな形式のドキュメントを解析するための抽象化を提供します。
LangChain4jには、いくつかの組み込み実装があります：
- `TextDocumentParser`
- `ApacheTikaDocumentParser`
- `MsOfficeDocumentParser`
- `PdfBoxDocumentParser`

<details>
<summary>便利なメソッド</summary>

- `DocumentParser.parse(InputStream, Metadata)`は入力ストリームとメタデータから`Document`を解析します
</details>

### Document Transformer
`DocumentTransformer`は`Document`を変換します。
これは、ドキュメントをクリーニングしたり、追加情報で強化したりするのに役立ちます。

一般的なソリューションはないため、独自の`DocumentTransformer`を実装することをお勧めします。
これは、特定のデータに合わせてカスタマイズする必要があります。

### Text Segment
`TextSegment`クラスは、テキストとメタデータを含むテキストセグメントを表します。
これは`Document`に似ていますが、通常はより小さなテキスト単位を表します。
`TextSegment`は通常、`Document`を分割することで作成されます。

<details>
<summary>なぜドキュメントを分割するのですか？</summary>

ドキュメントを分割する主な理由は2つあります：
1. LLMのコンテキストウィンドウ（プロンプトに入れることができるトークンの最大数）は限られています。
ドキュメント全体がコンテキストウィンドウに収まらない場合、分割する必要があります。
2. ベクトル検索は、ドキュメント全体よりも小さなセグメントで機能します。
ドキュメントを小さなセグメントに分割することで、ベクトル検索の品質が向上します。

ただし、ドキュメントを分割すると、コンテキストが失われる可能性があります。
例えば、セグメントが「彼は賢い」である場合、「彼」が誰を指しているのかわかりません。

一般的な戦略は、オーバーラップを持つセグメントにドキュメントを分割することですが、これは問題を完全に解決するものではありません。
「文章ウィンドウ検索」、「自動マージ検索」、「親ドキュメント検索」などのいくつかの高度な技術がここで役立ちます。
ここでは詳細に触れませんが、基本的にこれらの方法は、検索されたセグメントの前後に追加の情報を取得し、
LLMに検索されたセグメントの前後の追加コンテキストを提供するのに役立ちます。
- 長所：
  - ベクトル検索の品質が向上します。
  - トークン消費が減少します。
- 短所：一部のコンテキストが失われる可能性があります。

</details>

<details>
<summary>便利なメソッド</summary>

- `TextSegment.text()`は`TextSegment`のテキストを返します
- `TextSegment.metadata()`は`TextSegment`の`Metadata`を返します
- `TextSegment.from(String, Metadata)`はテキストと`Metadata`から`TextSegment`を作成します
- `TextSegment.from(String)`はテキストから空の`Metadata`を持つ`TextSegment`を作成します
</details>

### Document Splitter
LangChain4jには、いくつかの組み込み実装を持つ`DocumentSplitter`インターフェースがあります：
- `DocumentByParagraphSplitter`
- `DocumentByLineSplitter`
- `DocumentBySentenceSplitter`
- `DocumentByWordSplitter`
- `DocumentByCharacterSplitter`
- `DocumentByRegexSplitter`
- 再帰的：`DocumentSplitters.recursive(...)`

これらはすべて次のように機能します：
1. `DocumentSplitter`をインスタンス化し、希望する`TextSegment`のサイズと、
オプションで文字またはトークンでのオーバーラップを指定します。
2. `DocumentSplitter`の`split(Document)`または`splitAll(List<Document>)`メソッドを呼び出します。
3. `DocumentSplitter`は与えられた`Document`をより小さな単位に分割します。
その性質はスプリッターによって異なります。例えば、`DocumentByParagraphSplitter`は
ドキュメントを段落（2つ以上の連続した改行文字で定義）に分割し、
`DocumentBySentenceSplitter`はOpenNLPライブラリの文検出器を使用して
ドキュメントを文に分割するなどです。
4. `DocumentSplitter`はこれらの小さな単位（段落、文、単語など）を`TextSegment`に結合し、
ステップ1で設定された制限を超えることなく、できるだけ多くの単位を1つの`TextSegment`に含めようとします。
一部の単位がまだ大きすぎて`TextSegment`に収まらない場合、サブスプリッターを呼び出します。
これは、収まらない単位をより細かい単位に分割できる別の`DocumentSplitter`です。
すべての`Metadata`エントリは`Document`から各`TextSegment`にコピーされます。
各テキストセグメントには一意のメタデータエントリ「index」が追加されます。
最初の`TextSegment`には`index=0`、2番目には`index=1`などが含まれます。


### Text Segment Transformer
`TextSegmentTransformer`は`DocumentTransformer`（上記で説明）と似ていますが、`TextSegment`を変換します。

`DocumentTransformer`と同様に、万能なソリューションはないため、
独自のデータに合わせた独自の`TextSegmentTransformer`を実装することをお勧めします。

検索を改善するためによく機能する1つの技術は、各`TextSegment`に`Document`のタイトルや短い要約を含めることです。


### Embedding
`Embedding`クラスは、埋め込まれたコンテンツ（通常は`TextSegment`などのテキスト）の
「意味的な意味」を表す数値ベクトルをカプセル化します。

ベクトル埋め込みについての詳細はこちらをご覧ください：
- https://www.elastic.co/what-is/vector-embedding
- https://www.pinecone.io/learn/vector-embeddings/
- https://cloud.google.com/blog/topics/developers-practitioners/meet-ais-multitool-vector-embeddings

<details>
<summary>便利なメソッド</summary>

- `Embedding.dimension()`は埋め込みベクトルの次元（長さ）を返します
- `CosineSimilarity.between(Embedding, Embedding)`は2つの`Embedding`間のコサイン類似度を計算します
- `Embedding.normalize()`は埋め込みベクトルを正規化します（その場で）
</details>


### Embedding Model
`EmbeddingModel`インターフェースは、テキストを`Embedding`に変換する特殊なタイプのモデルを表します。

現在サポートされている埋め込みモデルは[こちら](/category/embedding-models)で確認できます。

<details>
<summary>便利なメソッド</summary>

- `EmbeddingModel.embed(String)`は与えられたテキストを埋め込みます
- `EmbeddingModel.embed(TextSegment)`は与えられた`TextSegment`を埋め込みます
- `EmbeddingModel.embedAll(List<TextSegment>)`は与えられたすべての`TextSegment`を埋め込みます
- `EmbeddingModel.dimension()`はこのモデルによって生成される`Embedding`の次元を返します
</details>

### Embedding Store
`EmbeddingStore`インターフェースは、`TextSegment`と`Embedding`のペアを保存および検索するためのストレージを表します。

現在サポートされている埋め込みストアは[こちら](/integrations/embedding-stores)で確認できます。

<details>
<summary>便利なメソッド</summary>

- `EmbeddingStore.add(Embedding, TextSegment)`は`Embedding`と`TextSegment`のペアを追加します
- `EmbeddingStore.addAll(List<Embedding>, List<TextSegment>)`は`Embedding`と`TextSegment`のペアのリストを追加します
- `EmbeddingStore.findRelevant(Embedding, int)`は与えられた`Embedding`に最も関連する`TextSegment`を見つけます
- `EmbeddingStore.findRelevant(Embedding, int, double)`は与えられた`Embedding`に最も関連する`TextSegment`を見つけ、最小スコアでフィルタリングします
- `EmbeddingStore.findRelevant(Embedding, int, Metadata)`は与えられた`Embedding`に最も関連する`TextSegment`を見つけ、メタデータでフィルタリングします
- `EmbeddingStore.findRelevant(Embedding, int, double, Metadata)`は与えられた`Embedding`に最も関連する`TextSegment`を見つけ、最小スコアとメタデータでフィルタリングします
</details>

### Embedding Store Ingestor
`EmbeddingStoreIngestor`は、`Document`を`TextSegment`に分割し、それらを埋め込み、`EmbeddingStore`に保存するユーティリティクラスです。

<details>
<summary>便利なメソッド</summary>

- `EmbeddingStoreIngestor.ingest(List<Document>, EmbeddingStore, DocumentSplitter, EmbeddingModel)`は`Document`を`TextSegment`に分割し、それらを埋め込み、`EmbeddingStore`に保存します
- `EmbeddingStoreIngestor.ingest(List<Document>, EmbeddingStore, DocumentSplitter, DocumentTransformer, EmbeddingModel)`は`Document`を変換し、`TextSegment`に分割し、それらを埋め込み、`EmbeddingStore`に保存します
- `EmbeddingStoreIngestor.ingest(List<Document>, EmbeddingStore, DocumentSplitter, DocumentTransformer, TextSegmentTransformer, EmbeddingModel)`は`Document`を変換し、`TextSegment`に分割し、それらを変換し、埋め込み、`EmbeddingStore`に保存します
</details>


####  EmbeddingSearchRequest
`EmbeddingSearchRequest`は`EmbeddingStore`での検索リクエストを表します。
以下の属性があります：
- `Embedding queryEmbedding`：参照として使用される埋め込み。
- `int maxResults`：返す結果の最大数。これはオプションのパラメータです。デフォルト：3。
- `double minScore`：0から1（含む）の範囲の最小スコア。スコア >= `minScore`の埋め込みのみが返されます。これはオプションのパラメータです。デフォルト：0。
- `Filter filter`：検索中に`Metadata`に適用されるフィルター。`Filter`に一致する`Metadata`を持つ`TextSegment`のみが返されます。

#### Filter
`Filter`はベクトル検索を実行する際に`Metadata`エントリによるフィルタリングを可能にします。

現在、以下の`Filter`タイプ/操作がサポートされています：
-  `IsEqualTo`
-  `IsNotEqualTo`
-  `IsGreaterThan`
-  `IsGreaterThanOrEqualTo`
-  `IsLessThan`
-  `IsLessThanOrEqualTo`
-  `IsIn`
-  `IsNotIn`
-  `ContainsString`
-  `And`
-  `Not`
-  `Or`

:::note
すべての埋め込みストアが`Metadata`によるフィルタリングをサポートしているわけではありません。
[こちら](https://docs.langchain4j.dev/integrations/embedding-stores/)の「Filtering by Metadata」列を参照してください。

`Metadata`によるフィルタリングをサポートするストアでも、すべての可能な`Filter`タイプ/操作をサポートしているわけではありません。
例えば、`ContainsString`は現在、Milvus、PgVector、Qdrantでのみサポートされています。
:::

`Filter`についての詳細は[こちら](https://github.com/langchain4j/langchain4j/pull/610)で確認できます。

#### EmbeddingSearchResult
`EmbeddingSearchResult`は`EmbeddingStore`での検索結果を表します。
`EmbeddingMatch`のリストが含まれています。

#### Embedding Match
`EmbeddingMatch`は、関連性スコア、ID、および元の埋め込みデータ（通常は`TextSegment`）と共にマッチした`Embedding`を表します。

### Embedding Store Ingestor
`EmbeddingStoreIngestor`は取り込みパイプラインを表し、`Document`を`EmbeddingStore`に取り込む責任があります。

最も単純な構成では、`EmbeddingStoreIngestor`は指定された`EmbeddingModel`を使用して提供された`Document`を埋め込み、
それらを`Embedding`と共に指定された`EmbeddingStore`に格納します：

```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
        .embeddingModel(embeddingModel)
        .embeddingStore(embeddingStore)
        .build();

ingestor.ingest(document1);
ingestor.ingest(document2, document3);
IngestionResult ingestionResult = ingestor.ingest(List.of(document4, document5, document6));
```

`EmbeddingStoreIngestor`のすべての`ingest()`メソッドは`IngestionResult`を返します。
`IngestionResult`には、埋め込みに使用されたトークン数を示す`TokenUsage`など、有用な情報が含まれています。

オプションで、`EmbeddingStoreIngestor`は指定された`DocumentTransformer`を使用して`Document`を変換できます。
これは、埋め込む前に`Document`をクリーニング、強化、またはフォーマットしたい場合に便利です。

オプションで、`EmbeddingStoreIngestor`は指定された`DocumentSplitter`を使用して`Document`を`TextSegment`に分割できます。
これは、`Document`が大きく、類似性検索の品質を向上させ、LLMに送信されるプロンプトのサイズとコストを削減するために、
より小さな`TextSegment`に分割したい場合に便利です。

オプションで、`EmbeddingStoreIngestor`は指定された`TextSegmentTransformer`を使用して`TextSegment`を変換できます。
これは、埋め込む前に`TextSegment`をクリーニング、強化、またはフォーマットしたい場合に便利です。

例：
```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()

    // 後でフィルタリングできるように、各DocumentにユーザーIDメタデータエントリを追加
    .documentTransformer(document -> {
        document.metadata().put("userId", "12345");
        return document;
    })

    // 各Documentを1000トークンの TextSegmentに分割し、200トークンのオーバーラップを持たせる
    .documentSplitter(DocumentSplitters.recursive(1000, 200, new OpenAiTokenCountEstimator("gpt-4o-mini")))

    // 検索品質を向上させるために、各TextSegmentにDocumentの名前を追加
    .textSegmentTransformer(textSegment -> TextSegment.from(
            textSegment.metadata().getString("file_name") + "\n" + textSegment.text(),
            textSegment.metadata()
    ))

    .embeddingModel(embeddingModel)
    .embeddingStore(embeddingStore)
    .build();
```

## ナイーブRAG

ドキュメントが取り込まれたら（前のセクションを参照）、
`EmbeddingStoreContentRetriever`を作成してナイーブRAG機能を有効にできます。

[AIサービス](/tutorials/ai-services)を使用する場合、ナイーブRAGは次のように構成できます：
```java
ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(embeddingStore)
    .embeddingModel(embeddingModel)
    .maxResults(5)
    .minScore(0.75)
    .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(model)
    .contentRetriever(contentRetriever)
    .build();
```

[ナイーブRAGの例](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_2_naive/Naive_RAG_Example.java)

## 高度なRAG

LangChain4jでは、以下のコアコンポーネントを使用して高度なRAGを実装できます：
- `QueryTransformer`
- `QueryRouter`
- `ContentRetriever`
- `ContentAggregator`
- `ContentInjector`

以下の図は、これらのコンポーネントがどのように連携するかを示しています：
[![](/img/advanced-rag.png)](/tutorials/rag)

プロセスは次のとおりです：
1. ユーザーが`UserMessage`を生成し、それが`Query`に変換されます
2. `QueryTransformer`が`Query`を1つまたは複数の`Query`に変換します
3. 各`Query`は`QueryRouter`によって1つ以上の`ContentRetriever`にルーティングされます
4. 各`ContentRetriever`が各`Query`に関連する`Content`を取得します
5. `ContentAggregator`がすべての取得された`Content`を単一の最終ランク付きリストに結合します
6. この`Content`のリストが元の`UserMessage`に注入されます
7. 最後に、元のクエリと注入された関連コンテンツを含む`UserMessage`がLLMに送信されます

各コンポーネントの詳細については、それぞれのJavadocを参照してください。

### Retrieval Augmentor

`RetrievalAugmentor`はRAGパイプラインへのエントリーポイントです。
様々なソースから取得された関連`Content`で`ChatMessage`を拡張する責任があります。

`RetrievalAugmentor`のインスタンスは、[AIサービス](/tutorials/ai-services)の作成時に指定できます：
```java
Assistant assistant = AiServices.builder(Assistant.class)
    ...
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```
AIサービスが呼び出されるたびに、指定された`RetrievalAugmentor`が
現在の`UserMessage`を拡張するために呼び出されます。

`RetrievalAugmentor`のデフォルト実装（以下で説明）を使用するか、
カスタム実装を作成することができます。

### Default Retrieval Augmentor

LangChain4jは`RetrievalAugmentor`インターフェースの標準実装として
`DefaultRetrievalAugmentor`を提供しており、これはほとんどのRAGユースケースに適しています。
これは[この記事](https://blog.langchain.dev/deconstructing-rag)と
[この論文](https://arxiv.org/abs/2312.10997)にインスパイアされています。
コンセプトをより良く理解するために、これらのリソースを確認することをお勧めします。

### Query
`Query`はRAGパイプラインにおけるユーザークエリを表します。
クエリのテキストとクエリメタデータが含まれています。

#### Query Metadata
`Query`内の`Metadata`には、RAGパイプラインの様々なコンポーネントで役立つ情報が含まれています。例えば：
- `Metadata.userMessage()` - 拡張されるべき元の`UserMessage`
- `Metadata.chatMemoryId()` - `@MemoryId`アノテーションが付いたメソッドパラメータの値。詳細は[こちら](/tutorials/ai-services/#chat-memory)。これはユーザーを識別し、取得中にアクセス制限やフィルターを適用するために使用できます。
- `Metadata.chatMemory()` - 以前のすべての`ChatMessage`。これは`Query`が尋ねられたコンテキストを理解するのに役立ちます。

### Query Transformer
`QueryTransformer`は与えられた`Query`を1つまたは複数の`Query`に変換します。
目的は、元の`Query`を修正または拡張することで取得品質を向上させることです。

取得を改善するための既知のアプローチには以下があります：
- クエリ圧縮
- クエリ拡張
- クエリ書き換え
- ステップバックプロンプティング
- 仮想文書埋め込み（HyDE）

詳細は[こちら](https://blog.langchain.dev/query-transformations/)で確認できます。

#### Default Query Transformer
`DefaultQueryTransformer`は`DefaultRetrievalAugmentor`で使用されるデフォルト実装です。
これは`Query`に変更を加えず、そのまま渡します。

#### Compressing Query Transformer
`CompressingQueryTransformer`はLLMを使用して、与えられた`Query`と
以前の会話を単独の`Query`に圧縮します。
これは、ユーザーが以前の質問や回答の情報を参照するフォローアップ質問をする可能性がある場合に役立ちます。

例：
```
ユーザー：ジョン・ドーについて教えてください
AI：ジョン・ドーは...
ユーザー：彼はどこに住んでいましたか？
```
「彼はどこに住んでいましたか？」というクエリだけでは、
ジョン・ドーへの明示的な参照がなく、「彼」が誰を指すのか不明確なため、
必要な情報を取得できません。

`CompressingQueryTransformer`を使用すると、LLMは会話全体を読み取り、
「彼はどこに住んでいましたか？」を「ジョン・ドーはどこに住んでいましたか？」に変換します。

#### Expanding Query Transformer
`ExpandingQueryTransformer`はLLMを使用して、与えられた`Query`を複数の`Query`に拡張します。
これはLLMが`Query`を様々な方法で言い換えたり再構成したりできるため、
より関連性の高いコンテンツを取得するのに役立ちます。

### Content
`Content`はユーザーの`Query`に関連するコンテンツを表します。
現在はテキストコンテンツ（つまり`TextSegment`）に限定されていますが、
将来的には他のモダリティ（画像、音声、動画など）もサポートする可能性があります。

### Content Retriever
`ContentRetriever`は与えられた`Query`を使用して、基礎となるデータソースから`Content`を取得します。
基礎となるデータソースは事実上何でもよいです：
- 埋め込みストア
- 全文検索エンジン
- ベクトルと全文検索のハイブリッド
- ウェブ検索エンジン
- ナレッジグラフ
- SQLデータベース
- など

`ContentRetriever`によって返される`Content`のリストは、関連性の高い順（最高から最低）に並べられています。

#### Embedding Store Content Retriever
`EmbeddingStoreContentRetriever`は`EmbeddingModel`を使用して`Query`を埋め込み、
`EmbeddingStore`から関連する`Content`を取得します。

例：
```java
EmbeddingStore embeddingStore = ...
EmbeddingModel embeddingModel = ...

ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(embeddingStore)
    .embeddingModel(embeddingModel)
    .maxResults(3)
     // maxResultsはクエリに応じて動的に指定することもできます
    .dynamicMaxResults(query -> 3)
    .minScore(0.75)
     // minScoreはクエリに応じて動的に指定することもできます
    .dynamicMinScore(query -> 0.75)
    .filter(metadataKey("userId").isEqualTo("12345"))
    // filterはクエリに応じて動的に指定することもできます
    .dynamicFilter(query -> {
        String userId = getUserId(query.metadata().chatMemoryId());
        return metadataKey("userId").isEqualTo(userId);
    })
    .build();
```

#### Web Search Content Retriever
`WebSearchContentRetriever`は`WebSearchEngine`を使用してウェブから関連する`Content`を取得します。

サポートされているすべての`WebSearchEngine`統合は[こちら](/category/web-search-engines)で確認できます。

例：
```java
WebSearchEngine googleSearchEngine = GoogleCustomWebSearchEngine.builder()
        .apiKey(System.getenv("GOOGLE_API_KEY"))
        .csi(System.getenv("GOOGLE_SEARCH_ENGINE_ID"))
        .build();

ContentRetriever contentRetriever = WebSearchContentRetriever.builder()
        .webSearchEngine(googleSearchEngine)
        .maxResults(3)
        .build();
```
完全な例は[こちら](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_08_Advanced_RAG_Web_Search_Example.java)で確認できます。

#### SQL Database Content Retriever
`SqlDatabaseContentRetriever`は`langchain4j-experimental-sql`モジュールにある
`ContentRetriever`の実験的な実装です。

これは`DataSource`とLLMを使用して、与えられた自然言語の`Query`に対して
SQLクエリを生成して実行します。

詳細については`SqlDatabaseContentRetriever`のjavadocを参照してください。

[例はこちら](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_10_Advanced_RAG_SQL_Database_Retreiver_Example.java)。

#### Azure AI Search Content Retriever
`AzureAiSearchContentRetriever`は[Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search)との統合です。
全文検索、ベクトル検索、ハイブリッド検索、およびリランキングをサポートしています。
`langchain4j-azure-ai-search`モジュールにあります。
詳細については`AzureAiSearchContentRetriever`のJavadocを参照してください。

#### Neo4j Content Retriever
`Neo4jContentRetriever`は[Neo4j](https://neo4j.com/)グラフデータベースとの統合です。
自然言語クエリをNeo4j Cypherクエリに変換し、
これらのクエリをNeo4jで実行することで関連情報を取得します。
`langchain4j-community-neo4j-retriever`モジュールにあります。

### Query Router
`QueryRouter`は`Query`を適切な`ContentRetriever`にルーティングする責任があります。

#### Default Query Router
`DefaultQueryRouter`は`DefaultRetrievalAugmentor`で使用されるデフォルト実装です。
各`Query`をすべての設定された`ContentRetriever`にルーティングします。

#### Language Model Query Router
`LanguageModelQueryRouter`はLLMを使用して、与えられた`Query`をどこにルーティングするかを決定します。

### Content Aggregator
`ContentAggregator`は以下からの複数のランク付けされた`Content`リストを集約する責任があります：
- 複数の`Query`
- 複数の`ContentRetriever`
- 両方

#### Default Content Aggregator
`DefaultContentAggregator`は`ContentAggregator`のデフォルト実装で、
2段階の相互ランク融合（RRF）を実行します。
詳細については`DefaultContentAggregator`のJavadocを参照してください。

#### Re-Ranking Content Aggregator
`ReRankingContentAggregator`はCohereなどの`ScoringModel`を使用してリランキングを実行します。
サポートされているスコアリング（リランキング）モデルの完全なリストは
[こちら](https://docs.langchain4j.dev/category/scoring-reranking-models)で確認できます。
詳細については`ReRankingContentAggregator`のJavadocを参照してください。

### Content Injector

`ContentInjector`は`ContentAggregator`によって返された`Content`を`UserMessage`に注入する責任があります。

#### Default Content Injector

`DefaultContentInjector`は`ContentInjector`のデフォルト実装で、
`Content`を「Answer using the following information:」というプレフィックスと共に
`UserMessage`の末尾に単純に追加します。

`Content`が`UserMessage`にどのように注入されるかを3つの方法でカスタマイズできます：
- デフォルトの`PromptTemplate`をオーバーライドする：
```java
RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
    .contentInjector(DefaultContentInjector.builder()
        .promptTemplate(PromptTemplate.from("{{userMessage}}\n{{contents}}"))
        .build())
    .build();
```
`PromptTemplate`には`{{userMessage}}`と`{{contents}}`変数が含まれている必要があることに注意してください。
- `DefaultContentInjector`を拡張して`format`メソッドの1つをオーバーライドする
- カスタム`ContentInjector`を実装する

`DefaultContentInjector`は取得された`Content.textSegment()`から`Metadata`エントリの注入もサポートしています：
```java
DefaultContentInjector.builder()
    .metadataKeysToInclude(List.of("source"))
    .build()
```
この場合、`TextSegment.text()`には「content: 」プレフィックスが付加され、
`Metadata`の各値にはキーがプレフィックスとして付加されます。
最終的な`UserMessage`は次のようになります：
```
予約をキャンセルするにはどうすればよいですか？

以下の情報を使用して回答してください：
content: 予約をキャンセルするには、...に進みます
source: ./cancellation_procedure.html

content: キャンセルは...の場合に許可されます
source: ./cancellation_policy.html
```

### 並列化

単一の`Query`と単一の`ContentRetriever`しかない場合、
`DefaultRetrievalAugmentor`はクエリルーティングとコンテンツ取得を同じスレッドで実行します。
それ以外の場合は、処理を並列化するために`Executor`が使用されます。
デフォルトでは、修正された（`keepAliveTime`が60秒ではなく1秒の）`Executors.newCachedThreadPool()`
が使用されますが、`DefaultRetrievalAugmentor`を作成するときにカスタム`Executor`インスタンスを提供できます：
```java
DefaultRetrievalAugmentor.builder()
        ...
        .executor(executor)
        .build;
```

## ソースへのアクセス

[AIサービス](/tutorials/ai-services)を使用する際に、
ソース（メッセージの拡張に使用された取得された`Content`）にアクセスしたい場合、
戻り値の型を`Result`クラスでラップすることで簡単に行えます：
```java
interface Assistant {

    Result<String> chat(String userMessage);
}

Result<String> result = assistant.chat("LangChain4jで簡単なRAGを行うには？");

String answer = result.content();
List<Content> sources = result.sources();
```

ストリーミング時には、`onRetrieved()`メソッドを使用して`Consumer<List<Content>>`を指定できます：
```java
interface Assistant {

    TokenStream chat(String userMessage);
}

assistant.chat("LangChain4jで簡単なRAGを行うには？")
    .onRetrieved((List<Content> sources) -> ...)
    .onPartialResponse(...)
    .onCompleteResponse(...)
    .onError(...)
    .start();
```

## 例

- [簡単なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_1_easy/Easy_RAG_Example.java)
- [ナイーブRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_2_naive/Naive_RAG_Example.java)
- [クエリ圧縮を使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_01_Advanced_RAG_with_Query_Compression_Example.java)
- [クエリルーティングを使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_02_Advanced_RAG_with_Query_Routing_Example.java)
- [リランキングを使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_03_Advanced_RAG_with_ReRanking_Example.java)
- [メタデータを含む高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_04_Advanced_RAG_with_Metadata_Example.java)
- [メタデータフィルタリングを使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_05_Advanced_RAG_with_Metadata_Filtering_Examples.java)
- [複数のリトリーバーを使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_07_Advanced_RAG_Multiple_Retrievers_Example.java)
- [ウェブ検索を使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_08_Advanced_RAG_Web_Search_Example.java)
- [SQLデータベースを使用した高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_10_Advanced_RAG_SQL_Database_Retreiver_Example.java)
- [取得のスキップ](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_06_Advanced_RAG_Skip_Retrieval_Example.java)
- [RAG + ツール](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)
- [ドキュメントの読み込み](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/DocumentLoaderExamples.java)
