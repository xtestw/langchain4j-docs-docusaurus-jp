---
sidebar_position: 8
---

# RAG（検索拡張生成）

LLMの知識は、学習されたデータに限定されます。

LLMにドメイン固有の知識や独自データを認識させたい場合は、次の方法があります：
- RAGを使用する（このセクションで説明します）
- 独自データでLLMをファインチューニングする
- [RAGとファインチューニングの両方を組み合わせる](https://gorilla.cs.berkeley.edu/blogs/9_raft.html)

## RAG とは？

簡単に言うと、RAGとは、LLMにプロンプトを送信する前に、データから関連情報の断片を見つけてプロンプトに注入する方法です。

これにより、LLMは（できれば）関連情報を取得し、その情報を使って回答できるようになり、幻覚（ハルシネーション）の可能性を減らすことができます。

関連情報の断片は、さまざまな
[情報検索](https://en.wikipedia.org/wiki/Information_retrieval) メソッドを使用して見つけることができます。
最も一般的なものは次のとおりです：
- 全文（キーワード）検索。この方法は、TF-IDFやBM25などの技術を使用して、
クエリ（例：ユーザーが尋ねている内容）内のキーワードをドキュメントのデータベースと照合してドキュメントを検索します。
各ドキュメント内のこれらのキーワードの頻度と関連性に基づいて結果をランク付けします。
- ベクトル検索（「セマンティック検索」とも呼ばれます）。
テキストドキュメントは、埋め込みモデルを使用して数値のベクトルに変換されます。
次に、クエリベクトルとドキュメントベクトル間のコサイン類似度
またはその他の類似度・距離尺度に基づいてドキュメントを検索・ランク付けし、
より深いセマンティックな意味を捉えます。
- ハイブリッド。複数の検索方法（例：全文+ベクトル）を組み合わせると、通常、検索の効果が向上します。

現在、このページは主にベクトル検索に焦点を当てています。
全文検索とハイブリッド検索は、現在、Azure AI Search統合とElasticsearchでのみサポートされています。
詳細については、`AzureAiSearchContentRetriever` と `ElasticsearchContentRetriever` を参照してください。
近い将来、RAGツールボックスに全文検索とハイブリッド検索を含める予定です。


## RAG のステージ

RAGプロセスは、インデックス作成と検索の2つの明確なステージに分かれています。
LangChain4jは、両方のステージのツールを提供します。

### インデックス作成

インデックス作成ステージでは、検索ステージ中に効率的な検索が可能になるように、ドキュメントが前処理されます。

このプロセスは、使用される情報検索方法によって異なります。
ベクトル検索の場合、通常、ドキュメントのクリーニング、追加データとメタデータの強化、
ドキュメントをより小さなセグメントに分割（チャンキングとも呼ばれる）、これらのセグメントの埋め込み、そして最後に埋め込みストア（ベクトルデータベースとも呼ばれる）への保存が含まれます。

インデックス作成ステージは通常オフラインで行われ、エンドユーザーが完了を待つ必要はありません。
これは、例えば、週末に社内ドキュメントを週に1回再インデックスするcronジョブによって実現できます。
インデックス作成を担当するコードは、インデックス作成タスクのみを処理する別のアプリケーションにすることもできます。

ただし、一部のシナリオでは、エンドユーザーが独自のドキュメントをアップロードしてLLMがアクセスできるようにしたい場合があります。
この場合、インデックス作成はオンラインで実行し、メインアプリケーションの一部にする必要があります。

インデックス作成ステージの簡略化された図は次のとおりです：
![](/img/rag-ingestion.png)


### 検索

検索ステージは通常オンラインで発生し、ユーザーがインデックスされたドキュメントを使用して回答すべき質問を送信したときに発生します。

このプロセスは、使用される情報検索方法によって異なります。
ベクトル検索の場合、通常、ユーザーのクエリ（質問）の埋め込みと、
埋め込みストアでの類似性検索の実行が含まれます。
関連するセグメント（元のドキュメントの一部）がプロンプトに注入され、LLMに送信されます。

検索ステージの簡略化された図は次のとおりです：
![](/img/rag-retrieval.png)


## LangChain4j の RAG の種類

LangChain4jは、RAGの3つの種類を提供します：
- [Easy RAG](/tutorials/rag/#easy-rag)：RAGを始める最も簡単な方法
- [Naive RAG](/tutorials/rag/#naive-rag)：ベクトル検索を使用したRAGの基本的な実装
- [Advanced RAG](/tutorials/rag/#advanced-rag)：クエリ変換、複数ソースからの検索、再ランキングなどの追加ステップを可能にするモジュール式RAGフレームワーク


## Easy RAG

LangChain4jには「Easy RAG」機能があり、RAGをできるだけ簡単に始められます。
埋め込みについて学んだり、ベクトルストアを選択したり、適切な埋め込みモデルを見つけたり、
ドキュメントの解析方法や分割方法を理解したりする必要はありません。
ドキュメントを指定するだけで、LangChain4jが魔法のように処理します。

カスタマイズ可能なRAGが必要な場合は、[次のセクション](/tutorials/rag#core-rag-apis)に進んでください。

Quarkusを使用している場合は、Easy RAGをさらに簡単に行う方法があります。
[Quarkusドキュメント](https://docs.quarkiverse.io/quarkus-langchain4j/dev/rag-easy-rag.html)をお読みください。

:::note
このような「Easy RAG」の品質は、もちろん、カスタマイズされたRAGセットアップよりも低くなります。
ただし、これはRAGについて学び始めたり、概念実証（PoC）を作成したりする最も簡単な方法です。
後で、Easy RAGからより高度なRAGへスムーズに移行し、さまざまな側面を調整およびカスタマイズできるようになります。
:::

1. `langchain4j-easy-rag` 依存関係をインポートします：
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-easy-rag</artifactId>
    <version>1.18.1-beta28</version>
</dependency>
```

2. ドキュメントを読み込みましょう：
```java
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation");
```
指定されたディレクトリからすべてのファイルを読み込みます。

<details>
<summary>内部では何が行われているのでしょうか？</summary>

多種多様なドキュメントタイプをサポートするApache Tikaライブラリを使用して、
ドキュメントタイプの検出と解析が行われます。
使用する`DocumentParser`を明示的に指定しなかったため、
`FileSystemDocumentLoader`は`langchain4j-easy-rag`依存関係からSPIを通じて提供される
`ApacheTikaDocumentParser`を読み込みます。
</details>

<details>
<summary>ドキュメントの読み込みをカスタマイズするには？</summary>

すべてのサブディレクトリからドキュメントを読み込みたい場合は、`loadDocumentsRecursively`メソッドを使用できます。
```java
List<Document> documents = FileSystemDocumentLoader.loadDocumentsRecursively("/home/langchain4j/documentation");
```
さらに、globや正規表現を使用してドキュメントをフィルタリングすることもできます。
```java
PathMatcher pathMatcher = FileSystems.getDefault().getPathMatcher("glob:*.pdf");
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j/documentation", pathMatcher);
```

:::note
`loadDocumentsRecursively` メソッドを使用する場合、glob では単一のアスタリスクではなく二重アスタリスクを使用する必要がある場合があります: `glob:**.pdf`。
:::
</details>

3. 次に、ドキュメントを前処理し、専用の埋め込みストア（ベクターデータベースとも呼ばれます）に保存する必要があります。
これは、ユーザーが質問したときに、関連する情報をすばやく見つけるために必要です。
当社がサポートする30以上の[埋め込みストア](/integrations/embedding-stores)のいずれかを使用できますが、
ここでは簡単にするために、インメモリのものを使用します。

```java
InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
EmbeddingStoreIngestor.ingest(documents, embeddingStore);
```

<details>
<summary>内部では何が起きているのでしょうか？</summary>

1. `EmbeddingStoreIngestor` は、SPIを通じて`langchain4j-easy-rag`依存関係から`DocumentSplitter`を読み込みます。
各`Document`は、それぞれ最大300トークン、30トークンのオーバーラップを持つ小さな断片（`TextSegment`）に分割されます。

2. `EmbeddingStoreIngestor` は、SPIを通じて`langchain4j-easy-rag`依存関係から`EmbeddingModel`を読み込みます。
各`TextSegment`は、`EmbeddingModel`を使用して`Embedding`に変換されます。

:::note
Easy RAGのデフォルトの埋め込みモデルとして、[bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)を選択しました。

このモデルは[MTEBリーダーボード](https://huggingface.co/spaces/mteb/leaderboard)で優れたスコアを達成しており、
量子化バージョンはわずか24メガバイトの容量しか占有しません。
そのため、[ONNX Runtime](https://onnxruntime.ai/)を使用してメモリに簡単に読み込み、同じプロセス内で実行できます。

そうです、外部サービスを一切使わずに、同じJVMプロセス内で完全にオフラインでテキストを埋め込みに変換できるのです。
LangChain4jは、いくつかの人気のある埋め込みモデルを
[そのまま利用できる形](/integrations/embedding-models/in-process)で提供しています。
:::

3. すべての`TextSegment`と`Embedding`のペアは、`EmbeddingStore`に保存されます。
</details>

4. 最後のステップは、LLMへのAPIとして機能する[AIサービス](/tutorials/ai-services)を作成することです。

```java
interface Assistant {

    String chat(String userMessage);
}

ChatModel chatModel = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
    .contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))
    .build();
```
ここでは、`Assistant`がユーザーの質問に回答するためにOpenAI LLMを使用し、会話内の最新10件のメッセージを記憶し、ドキュメントを含む`EmbeddingStore`から関連コンテンツを取得するように設定します。

5. そして、これでチャットを始める準備ができました！


```java
String answer = assistant.chat("How to do Easy RAG with LangChain4j?");
```


## コア RAG API

LangChain4jは、シンプルなものから高度なものまで、カスタムRAGパイプラインを簡単に構築できるようにするための豊富なAPIセットを提供しています。
このセクションでは、主要なドメインクラスとAPIについて説明します。

### Document

`Document`クラスは、単一のPDFファイルやWebページなど、ドキュメント全体を表します。
現時点では、`Document`はテキスト情報のみを表すことができますが、
将来のアップデートでは画像やテーブルもサポートする予定です。

<details>
<summary>便利なメソッド</summary>

- `Document.text()` は`Document`のテキストを返します
- `Document.metadata()` は`Document`の`Metadata`を返します（下記の「Metadata」セクションを参照）
- `Document.toTextSegment()` は`Document`を`TextSegment`に変換します（下記の「TextSegment」セクションを参照）
- `Document.from(String, Metadata)` はテキストと`Metadata`から`Document`を作成します
- `Document.from(String)` は空の`Metadata`を持つテキストから`Document`を作成します
</details>

### Metadata

各`Document`には`Metadata`が含まれています。
これは、ドキュメントの名前、ソース、最終更新日、所有者、
その他の関連する詳細情報など、`Document`に関するメタ情報を格納します。

`Metadata`はキーと値のマップとして格納され、キーは`String`型で、
値は`String`、`Integer`、`Long`、`Float`、`Double`、`UUID`のいずれかの型になります。

`Metadata`はいくつかの理由で役立ちます：
- LLMへのプロンプトに`Document`のコンテンツを含める際に、
メタデータエントリも含めることで、LLMに考慮すべき追加情報を提供できます。
例えば、`Document`の名前とソースを提供することで、LLMのコンテンツ理解を向上させることができます。
- プロンプトに含める関連コンテンツを検索する際に、
`Metadata`エントリでフィルタリングできます。
例えば、セマンティック検索を特定の所有者に属する`Document`のみに絞り込むことができます。
- `Document`のソースが更新された場合（例えば、ドキュメントの特定のページ）、
メタデータエントリ（例えば、「id」、「source」など）によって対応する`Document`を簡単に見つけ出し、
`EmbeddingStore`内のものも更新して同期を保つことができます。

<details>
<summary>便利なメソッド</summary>

- `Metadata.from(Map)` は`Map`から`Metadata`を作成します
- `Metadata.put(String key, String value)` / `put(String, int)` などは、`Metadata`にエントリを追加します
- `Metadata.putAll(Map)` は`Metadata`に複数のエントリを追加します
- `Metadata.getString(String key)` / `getInteger(String key)` などは、`Metadata`エントリの値を返し、必要な型にキャストします
- `Metadata.containsKey(String key)` は`Metadata`に指定されたキーのエントリが含まれているかを確認します
- `Metadata.remove(String key)` はキーによって`Metadata`からエントリを削除します
- `Metadata.copy()` は`Metadata`のコピーを返します
- `Metadata.toMap()` は`Metadata`を`Map`に変換します
- `Metadata.merge(Metadata)` は現在の`Metadata`を別の`Metadata`とマージします
</details>

### Document Loader

`String`から`Document`を作成することもできますが、より簡単な方法は、ライブラリに含まれているドキュメントローダーのいずれかを使用することです：
- `langchain4j`モジュールの`FileSystemDocumentLoader`
- `langchain4j`モジュールの`ClassPathDocumentLoader`
- `langchain4j`モジュールの`UrlDocumentLoader`
- `langchain4j-document-loader-amazon-s3`モジュールの`AmazonS3DocumentLoader`
- `langchain4j-document-loader-azure-storage-blob`モジュールの`AzureBlobStorageDocumentLoader`
- `langchain4j-document-loader-github`モジュールの`GitHubDocumentLoader`
- `langchain4j-document-loader-google-cloud-storage`モジュールの`GoogleCloudStorageDocumentLoader`
- `langchain4j-document-loader-selenium`モジュールの`SeleniumDocumentLoader`
- `langchain4j-document-loader-playwright`モジュールの`PlaywrightDocumentLoader`
- `langchain4j-document-loader-tencent-cos`モジュールの`TencentCosDocumentLoader`

### Document Parser

`Document`は、PDF、DOC、TXTなど、さまざまな形式のファイルを表すことができます。
これらの各形式を解析するために、ライブラリに含まれている複数の実装を持つ`DocumentParser`インターフェースがあります：
- `langchain4j`モジュールの`TextDocumentParser`。プレーンテキスト形式（TXT、HTML、MDなど）のファイルを解析できます
- `langchain4j-document-parser-apache-pdfbox`モジュールの`ApachePdfBoxDocumentParser`。PDFファイルを解析できます
- `langchain4j-document-parser-apache-poi`モジュールの`ApachePoiDocumentParser`。MS Officeファイル形式
（DOC、DOCX、PPT、PPTX、XLS、XLSXなど）を解析できます
- `langchain4j-document-parser-apache-tika`モジュールの`ApacheTikaDocumentParser`。
ほぼすべての既存ファイル形式を自動的に検出して解析できます
- `langchain4j-document-parser-docling`モジュールの`DoclingDocumentParser`。
  [Docling Java](https://docling-project.github.io/docling-java/current/)と[Docling](https://docling.ai)を使用してドキュメントを処理します
- `langchain4j-document-parser-markdown`モジュールの`MarkdownDocumentParser`。
  マークダウン形式のファイルを解析できます
- `langchain4j-document-parser-yaml`モジュールの`YamlDocumentParser`。
  YAML形式のファイルを解析できます

ファイルシステムから1つまたは複数の`Document`をロードする方法の例は次のとおりです：
```java
// Load a single document
Document document = FileSystemDocumentLoader.loadDocument("/home/langchain4j/file.txt", new TextDocumentParser());

// Load all documents from a directory
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j", new TextDocumentParser());

// Load all *.txt documents from a directory
PathMatcher pathMatcher = FileSystems.getDefault().getPathMatcher("glob:*.txt");
List<Document> documents = FileSystemDocumentLoader.loadDocuments("/home/langchain4j", pathMatcher, new TextDocumentParser());

// Load all documents from a directory and its subdirectories
List<Document> documents = FileSystemDocumentLoader.loadDocumentsRecursively("/home/langchain4j", new TextDocumentParser());
```

`DocumentParser`を明示的に指定せずにドキュメントを読み込むこともできます。
この場合、デフォルトの`DocumentParser`が使用されます。

デフォルトのパーサーはSPIを通じて読み込まれます（例：`langchain4j-document-parser-apache-tika`や`langchain4j-easy-rag`がインポートされている場合）。
SPIを通じて`DocumentParser`が見つからない場合は、フォールバックとして`TextDocumentParser`が使用されます。


### Document Transformer

`DocumentTransformer`の実装は、以下のようなさまざまなドキュメント変換を実行できます：
- クリーニング：`Document`のテキストから不要なノイズを除去します。これにより、トークンを節約し、ノイズによる干渉を減らすことができます。
- フィルタリング：特定の`Document`を検索対象から完全に除外します。
- エンリッチメント：検索結果を向上させる可能性がある追加情報を`Document`に付加します。
- 要約：`Document`を要約し、その短い要約を`Metadata`に保存して、後で各`TextSegment`（後述）に含めることで、検索を改善できる可能性があります。
- など。

この段階で、`Metadata`エントリの追加、変更、削除も行えます。

現在、標準で提供されている実装は、`langchain4j-document-transformer-jsoup`モジュールの`HtmlToTextDocumentTransformer`のみです。
これは、生のHTMLから必要なテキストコンテンツとメタデータエントリを抽出できます。

万能な解決策はないため、独自のデータに合わせてカスタマイズした`DocumentTransformer`を独自に実装することをお勧めします。


### Graph Transformer

`GraphTransformer`は、非構造化`Document`オブジェクトを、ノードやリレーションシップなどの**セマンティックグラフ要素**を抽出して構造化`GraphDocument`に変換するインターフェースです。

生のテキストを構造化されたセマンティックグラフに変換するのに最適です。

`GraphTransformer`は、生のドキュメントを`GraphDocument`に変換します。これには以下が含まれます：

* テキスト内のエンティティや概念を表す**ノード**（`GraphNode`）のセット。
* それらのエンティティがどのように接続されているかを表す**リレーションシップ**（`GraphEdge`）のセット。
* ソースとしての元の`Document`。

デフォルトの実装は`LLMGraphTransformer`で、言語モデル（例：OpenAI）を使用して、プロンプトエンジニアリングにより自然言語からグラフ情報を抽出します。

#### 主な利点

* **エンティティとリレーションシップの抽出**：主要な概念とその意味的なつながりを特定します。
* **グラフ表現**：出力はナレッジグラフやグラフデータベースへの統合にすぐに使用できます。
* **モデル駆動型パース**：大規模言語モデルを使用して、非構造化テキストから構造を推論します。

#### Maven依存関係

```xml
<dependency>
  <groupId>dev.langchain4j</groupId>
  <artifactId>langchain4j-community-llm-graph-transformer</artifactId>
  <version>${latest version here}</version>
</dependency>
```

#### 使用例

```java
import dev.langchain4j.data.document.Document;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.community.data.document.graph.GraphDocument;
import dev.langchain4j.community.data.document.graph.GraphNode;
import dev.langchain4j.community.data.document.graph.GraphEdge;
import dev.langchain4j.community.data.document.transformer.graph.GraphTransformer;
import dev.langchain4j.community.data.document.transformer.graph.llm.LLMGraphTransformer;

import java.time.Duration;
import java.util.Set;

public class GraphTransformerExample {
    public static void main(String[] args) {
        // Create a GraphTransformer backed by an LLM
        GraphTransformer transformer = new LLMGraphTransformer(
            OpenAiChatModel.builder()
                .apiKey(System.getenv("OPENAI_API_KEY"))
                .timeout(Duration.ofSeconds(60))
                .build()
        );

        // Input document
        Document document = Document.from("Barack Obama was born in Hawaii and served as the 44th President of the United States.");

        // Transform the document
        GraphDocument graphDocument = transformer.transform(document);

        // Access nodes and relationships
        Set<GraphNode> nodes = graphDocument.nodes();
        Set<GraphEdge> relationships = graphDocument.relationships();

        nodes.forEach(System.out::println);
        relationships.forEach(System.out::println);
    }
}
```

#### 出力例

```
GraphNode(name=Barack Obama, type=Person)
GraphNode(name=Hawaii, type=Location)
GraphEdge(from=Barack Obama, predicate=was born in, to=Hawaii)

GraphEdge(from=Barack Obama, predicate=served as, to=President of the United States)
```



### テキストセグメント

`Document`の読み込みが完了したら、それをより小さなセグメント（チャンク）に分割（チャンキング）します。

LangChain4jのドメインモデルには、`Document`のセグメントを表す`TextSegment`クラスがあります。
名前が示すように、`TextSegment`はテキスト情報のみを表すことができます。

<details>
<summary>分割すべきか、分割しないべきか？</summary>

プロンプトにナレッジベース全体ではなく、関連する少数のセグメントのみを含めたい理由はいくつかあります：
- LLMにはコンテキストウィンドウに制限があるため、ナレッジベース全体が収まらない可能性があります
- プロンプトに多くの情報を提供するほど、LLMが処理して応答するのに時間がかかります
- プロンプトに多くの情報を提供するほど、コストがかかります
- プロンプト内の無関係な情報はLLMの注意をそらし、幻覚（ハルシネーション）の可能性を高める可能性があります
- プロンプトに多くの情報を提供するほど、LLMがどの情報に基づいて応答したかを説明することが難しくなります

これらの懸念は、ナレッジベースをより小さく、より扱いやすいセグメントに分割することで対処できます。
それらのセグメントはどのくらいの大きさにすべきでしょうか？それは良い質問です。いつものように、状況によります。

現在、広く使用されている2つのアプローチがあります：
1. 各ドキュメント（例：PDFファイル、Webページなど）は原子的で分割不可能です。

RAGパイプラインの検索中に、最も関連性の高いN個のドキュメントが取得され、プロンプトに注入されます。
ドキュメントはかなり長くなる可能性があるため、この場合、おそらく長いコンテキストを持つLLMを使用する必要があります。
このアプローチは、詳細を見逃す余裕がない場合など、完全なドキュメントの取得が重要な場合に適しています。
- 利点：コンテキストが失われることはありません。
- 欠点：
  - より多くのトークンが消費されます。
  - ドキュメントに複数のセクションやトピックが含まれる場合があり、そのすべてがクエリに関連するとは限りません。
  - さまざまなサイズの完全なドキュメントが単一の固定長ベクトルに圧縮されるため、ベクトル検索の品質が低下します。

2. ドキュメントは、章、段落、場合によっては文などのより小さなセグメントに分割されます。
RAGパイプラインの検索中に、最も関連性の高いN個のセグメントが取得され、プロンプトに注入されます。
課題は、各セグメントがLLMが理解するのに十分なコンテキストと情報を提供することを保証することです。

コンテキストが不足すると、LLMが与えられたセグメントを誤解し、幻覚を引き起こす可能性があります。
一般的な戦略は、ドキュメントをオーバーラップ付きのセグメントに分割することですが、これで問題が完全に解決するわけではありません。
ここで役立つ高度なテクニックがいくつかあります。例えば、「センテンスウィンドウ検索」、「自動マージ検索」、「親ドキュメント検索」などです。

ここでは詳細には触れませんが、基本的にこれらの方法は、取得されたセグメントの周囲のより多くのコンテキストを取得し、取得されたセグメントの前後の追加情報をLLMに提供します。
- 利点：
  - ベクトル検索の品質が向上します。
  - トークン消費量が削減されます。
- 欠点：一部のコンテキストが失われる可能性があります。

</details>

<details>
<summary>便利なメソッド</summary>

- `TextSegment.text()`は`TextSegment`のテキストを返します
- `TextSegment.metadata()`は`TextSegment`の`Metadata`を返します
- `TextSegment.from(String, Metadata)`はテキストと`Metadata`から`TextSegment`を作成します
- `TextSegment.from(String)`は空の`Metadata`を持つテキストから`TextSegment`を作成します
</details>

### ドキュメントスプリッター

LangChain4jには、すぐに使用できるいくつかの実装を備えた`DocumentSplitter`インターフェースがあります：
- `DocumentByParagraphSplitter`
- `DocumentByLineSplitter`
- `DocumentBySentenceSplitter`
- `DocumentByWordSplitter`
- `DocumentByCharacterSplitter`
- `DocumentByRegexSplitter`
- 再帰的：`DocumentSplitters.recursive(...)`

これらはすべて次のように動作します：
1. `DocumentSplitter`をインスタンス化し、`TextSegment`の望ましいサイズと、オプションで文字またはトークン単位のオーバーラップを指定します。

2. `DocumentSplitter`の`split(Document)`または`splitAll(List<Document>)`メソッドを呼び出します。
3. `DocumentSplitter`は、指定された`Document`をより小さな単位に分割します。その性質はスプリッターによって異なります。例えば、`DocumentByParagraphSplitter`はドキュメントを段落（2つ以上の連続する改行文字で定義）に分割し、`DocumentBySentenceSplitter`はOpenNLPライブラリの文検出器を使用してドキュメントを文に分割します。
4. `DocumentSplitter`は、これらのより小さな単位（段落、文、単語など）を`TextSegment`に結合し、ステップ1で設定された制限を超えない範囲で、できるだけ多くの単位を単一の`TextSegment`に含めようとします。一部の単位がまだ大きすぎて`TextSegment`に収まらない場合は、サブスプリッターを呼び出します。これは、収まらない単位をより細かい単位に分割できる別の`DocumentSplitter`です。

すべての`Metadata`エントリは`Document`から各`TextSegment`にコピーされます。
一意のメタデータエントリ「index」が各テキストセグメントに追加されます。
最初の`TextSegment`には`index=0`が含まれ、2番目には`index=1`が含まれ、以降同様に続きます。


### テキストセグメントトランスフォーマー

`TextSegmentTransformer`は`DocumentTransformer`（上記で説明）に似ていますが、`TextSegment`を変換します。

`DocumentTransformer`と同様に、万能の解決策はないため、独自のデータに合わせてカスタマイズした`TextSegmentTransformer`を実装することをお勧めします。

検索品質の向上に非常に効果的なテクニックの1つは、各`TextSegment`に`Document`のタイトルまたは短い要約を含めることです。


### 埋め込み（Embedding）

`Embedding`クラスは、埋め込まれたコンテンツ（通常は`TextSegment`などのテキスト）の「意味的意味」を表す数値ベクトルをカプセル化します。

ベクトル埋め込みの詳細については、以下を参照してください：
- https://www.elastic.co/what-is/vector-embedding
- https://www.pinecone.io/learn/vector-embeddings/
- https://cloud.google.com/blog/topics/developers-practitioners/meet-ais-multitool-vector-embeddings

<details>
<summary>便利なメソッド</summary>

- `Embedding.dimension()`は埋め込みベクトルの次元（その長さ）を返します
- `CosineSimilarity.between(Embedding, Embedding)`は2つの`Embedding`間のコサイン類似度を計算します
- `Embedding.normalize()`は埋め込みベクトルを正規化します（インプレース）
</details>


### 埋め込みモデル

`EmbeddingModel`インターフェースは、テキストを`Embedding`に変換する特別なタイプのモデルを表します。

現在サポートされている埋め込みモデルは、[こちら](/category/embedding-models)にあります。

<details>
<summary>便利なメソッド</summary>

- `EmbeddingModel.embed(String)`は指定されたテキストを埋め込みます
- `EmbeddingModel.embed(TextSegment)`は指定された`TextSegment`を埋め込みます
- `EmbeddingModel.embedAll(List<TextSegment>)`は指定されたすべての`TextSegment`を埋め込みます
- `EmbeddingModel.dimension()`はこのモデルによって生成される`Embedding`の次元を返します
</details>

#### リクエスト/レスポンスAPIと呼び出しごとのパラメータ

上記の便利なメソッドに加えて、`EmbeddingModel`は`EmbeddingRequest`を受け入れ、`EmbeddingResponse`を返します。これにより、**呼び出しごとのパラメータ**を渡すことができます：






```java
EmbeddingResponse response = embeddingModel.embed(EmbeddingRequest.builder()
    .input("What is the capital of France?")
    .inputType(EmbeddingInputType.QUERY) // query vs document, see the section below
    .dimensions(256)                     // reduce output dimensionality (on models that support it)
    .build());

List<Embedding> embeddings = response.embeddings();
```

呼び出しごとのパラメータは厳密にオプトイン方式です。各プロバイダーは、`supportedParameters()` を通じてサポート内容を宣言します。
リクエストがモデルでサポートされていないパラメータを使用した場合、`UnsupportedFeatureException` が即座にスローされ、静かに無視されることはありません。詳細は
[クエリ埋め込みとドキュメント埋め込み](#query-vs-document-embeddings-opt-in) も参照してください。

#### マルチモーダル埋め込み

一部のモデルは、画像（およびテキストと画像が混在した入力）を同じベクトル空間に埋め込みます。`Content`
パーツから入力を構築します。これをサポートするモデル（Cohere Embed v4、Voyage multimodal、Google Gemini Embedding 2、Amazon Titan
Multimodal、Jina CLIP など）では、パーツが単一の埋め込みに融合されます。


```java
EmbeddingResponse response = embeddingModel.embed(EmbeddingRequest.builder()
    .input(TextContent.from("a photo of a cat"), ImageContent.from("https://example.com/cat.png"))
    .build());
```

モデルは、`supportedContentTypes()` を介してサポートするモダリティを宣言します。テキストのみのモデルに画像を渡すと、`UnsupportedFeatureException` で即座に失敗します。`EmbeddingModel` のオブザーバビリティ（リスナー）については、[オブザーバビリティ](/tutorials/observability) チュートリアルで説明されています。


### 埋め込みストア

`EmbeddingStore` インターフェースは、`Embedding` のストア（ベクトルデータベースとも呼ばれます）を表します。
これにより、類似した（埋め込み空間内で近い）`Embedding` の保存と効率的な検索が可能になります。

現在サポートされている埋め込みストアは、[こちら](/integrations/embedding-stores) にあります。

`EmbeddingStore` は、`Embedding` のみ、または対応する `TextSegment` と一緒に保存できます：
- ID によって `Embedding` のみを保存できます。元の埋め込みデータは別の場所に保存し、ID を使用して関連付けることができます。
- `Embedding` と、埋め込まれた元のデータ（通常は `TextSegment`）の両方を保存できます。

<details>
<summary>便利なメソッド</summary>

- `EmbeddingStore.add(Embedding)` は、指定された `Embedding` をストアに追加し、ランダムな ID を返します
- `EmbeddingStore.add(String id, Embedding)` は、指定された ID を持つ `Embedding` をストアに追加します
- `EmbeddingStore.add(Embedding, TextSegment)` は、関連付けられた `TextSegment` を持つ `Embedding` をストアに追加し、ランダムな ID を返します
- `EmbeddingStore.addAll(List<Embedding>)` は、指定された `Embedding` のリストをストアに追加し、ランダムな ID のリストを返します
- `EmbeddingStore.addAll(List<Embedding>, List<TextSegment>)` は、関連付けられた `TextSegment` を持つ `Embedding` のリストをストアに追加し、ランダムな ID のリストを返します
- `EmbeddingStore.addAll(List<String> ids, List<Embedding>, List<TextSegment>)` は、関連付けられた ID と `TextSegment` を持つ `Embedding` のリストをストアに追加します
- `EmbeddingStore.search(EmbeddingSearchRequest)` は、最も類似した `Embedding` を検索します
- `EmbeddingStore.remove(String id)` は、ID によって単一の `Embedding` をストアから削除します
- `EmbeddingStore.removeAll(Collection<String> ids)` は、指定されたコレクションに ID が存在するすべての `Embedding` をストアから削除します
- `EmbeddingStore.removeAll(Filter)` は、指定された `Filter` に一致するすべての `Embedding` をストアから削除します
- `EmbeddingStore.removeAll()` は、すべての `Embedding` をストアから削除します
</details>


#### EmbeddingSearchRequest

`EmbeddingSearchRequest` は、`EmbeddingStore` 内を検索するためのリクエストを表します。
以下の属性があります：
- `Embedding queryEmbedding`: 参照として使用される埋め込み。
- `int maxResults`: 返す結果の最大数。オプションのパラメータです。デフォルト：3。
- `double minScore`: 最小スコア（0 から 1 まで、両端を含む）。スコアが `minScore` 以上の埋め込みのみが返されます。オプションのパラメータです。デフォルト：0。
- `Filter filter`: 検索中に `Metadata` に適用されるフィルター。`Metadata` が `Filter` に一致する `TextSegment` のみが返されます。

#### Filter

`Filter` を使用すると、ベクトル検索を実行する際に `Metadata` エントリによるフィルタリングが可能になります。

現在、以下の `Filter` タイプ/操作がサポートされています：
- `IsEqualTo`
- `IsNotEqualTo`
- `IsGreaterThan`
- `IsGreaterThanOrEqualTo`
- `IsLessThan`
- `IsLessThanOrEqualTo`
- `IsIn`
- `IsNotIn`
- `ContainsString`
- `And`
- `Not`
- `Or`

:::note
すべての埋め込みストアが `Metadata` によるフィルタリングをサポートしているわけではありません。
「Metadata によるフィルタリング」列については、[こちら](https://docs.langchain4j.dev/integrations/embedding-stores/) を参照してください。

`Metadata` によるフィルタリングをサポートしているストアでも、すべての `Filter` タイプ/操作をサポートしているわけではありません。
たとえば、`ContainsString` は現在、Milvus、PgVector、Qdrant でのみサポートされています。
:::

`Filter` の詳細については、[こちら](https://github.com/langchain4j/langchain4j/pull/610) を参照してください。


#### EmbeddingSearchResult

`EmbeddingSearchResult` は、`EmbeddingStore` 内の検索結果を表します。
`EmbeddingMatch` のリストが含まれています。


#### Embedding Match

`EmbeddingMatch` は、関連性スコア、ID、および元の埋め込みデータ（通常は `TextSegment`）とともに、一致した `Embedding` を表します。


### 埋め込みストアインジェスター
`EmbeddingStoreIngestor` は、取り込みパイプラインを表し、`Document` を `EmbeddingStore` に取り込む役割を担います。

最も単純な構成では、`EmbeddingStoreIngestor` は、指定された `EmbeddingModel` を使用して提供された `Document` を埋め込み、それらの `Embedding` とともに指定された `EmbeddingStore` に保存します：
```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
        .embeddingModel(embeddingModel)
        .embeddingStore(embeddingStore)
        .build();

ingestor.ingest(document1);
ingestor.ingest(document2, document3);
IngestionResult ingestionResult = ingestor.ingest(List.of(document4, document5, document6));
```

`EmbeddingStoreIngestor` のすべての `ingest()` メソッドは `IngestionResult` を返します。
`IngestionResult` には有用な情報が含まれており、その中には `TokenUsage` もあり、埋め込みに使用されたトークン数を示します。

オプションとして、`EmbeddingStoreIngestor` は指定された `DocumentTransformer` を使用して `Document` を変換できます。
これは、埋め込み前に `Document` をクリーンアップ、拡充、またはフォーマットしたい場合に役立ちます。

オプションとして、`EmbeddingStoreIngestor` は指定された `DocumentSplitter` を使用して `Document` を `TextSegment` に分割できます。
これは、`Document` が大きく、類似性検索の品質を向上させ、LLM に送信するプロンプトのサイズとコストを削減するために、より小さな `TextSegment` に分割したい場合に役立ちます。

オプションとして、`EmbeddingStoreIngestor` は指定された `TextSegmentTransformer` を使用して `TextSegment` を変換できます。
これは、埋め込み前に `TextSegment` をクリーンアップ、拡充、またはフォーマットしたい場合に役立ちます。

例:


```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()

    // adding userId metadata entry to each Document to be able to filter by it later
    .documentTransformer(document -> {
        document.metadata().put("userId", "12345");
        return document;
    })

    // splitting each Document into TextSegments of 1000 tokens each, with a 200-token overlap
    .documentSplitter(DocumentSplitters.recursive(1000, 200, new OpenAiTokenCountEstimator("gpt-4o-mini")))

    // adding a name of the Document to each TextSegment to improve the quality of search
    .textSegmentTransformer(textSegment -> TextSegment.from(
            textSegment.metadata().getString("file_name") + "\n" + textSegment.text(),
            textSegment.metadata()
    ))

    .embeddingModel(embeddingModel)
    .embeddingStore(embeddingStore)
    .build();
```

#### クエリ埋め込みとドキュメント埋め込み（オプトイン）

一部の埋め込みモデル（例：Cohere Embed v4、Voyage、Google）では、ドキュメントとクエリを異なる方法で埋め込むと、検索品質が向上します。`EmbeddingStoreIngestor` では入力タイプを `DOCUMENT`（インデックス化するセグメント用）に、`EmbeddingStoreContentRetriever` では `QUERY`（クエリ用、[Embedding Store Content Retriever](#embedding-store-content-retriever) を参照）に宣言することで、オプトインできます。




```java
EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
    .embeddingModel(embeddingModel)
    .embeddingStore(embeddingStore)
    .embeddingInputType(EmbeddingInputType.DOCUMENT)
    .build();
```

`embeddingInputType`が設定されていない場合、入力タイプは送信されません。設定されている場合、選択した`EmbeddingModel`が入力タイプのパラメータをサポートしている必要があります（その`supportedParameters()`を参照）。サポートされていない場合、埋め込みは`UnsupportedFeatureException`で即座に失敗します。


## Naive RAG

ドキュメントが取り込まれたら（前のセクションを参照）、`EmbeddingStoreContentRetriever`を作成してナイーブRAG機能を有効にできます。

[AIサービス](/tutorials/ai-services)を使用する場合、ナイーブRAGは次のように設定できます：



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

[Naive RAGの例](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_2_naive/Naive_RAG_Example.java)


## Advanced RAG

高度なRAGは、LangChain4jを使用して以下の主要コンポーネントで実装できます：
- `QueryTransformer`
- `QueryRouter`
- `ContentRetriever`
- `ContentAggregator`
- `ContentInjector`

次の図は、これらのコンポーネントがどのように連携するかを示しています：
![](/img/advanced-rag.png)

プロセスは以下の通りです：
1. ユーザーが`UserMessage`を生成し、それが`Query`に変換されます
2. `QueryTransformer`が`Query`を1つまたは複数の`Query`に変換します
3. 各`Query`は`QueryRouter`によって1つまたは複数の`ContentRetriever`にルーティングされます
4. 各`ContentRetriever`が各`Query`に関連する`Content`を取得します
5. `ContentAggregator`が取得したすべての`Content`を単一の最終的なランキングリストに結合します
6. この`Content`のリストが元の`UserMessage`に注入されます
7. 最後に、元のクエリと注入された関連コンテンツを含む`UserMessage`がLLMに送信されます

詳細については、各コンポーネントのJavadocを参照してください。

### 検索オーグメンター

`RetrievalAugmentor`はRAGパイプラインへのエントリーポイントです。

さまざまなソースから取得された関連`Content`で`ChatMessage`を拡張する役割を担います。

`RetrievalAugmentor`のインスタンスは、[AIサービス](/tutorials/ai-services)の作成時に指定できます。
```java
Assistant assistant = AiServices.builder(Assistant.class)
    ...
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```
AIサービスが呼び出されるたびに、指定された`RetrievalAugmentor`が呼び出され、現在の`UserMessage`を拡張します。

`RetrievalAugmentor`のデフォルト実装（後述）を使用することも、カスタム実装を作成することもできます。

### デフォルトのRetrievalAugmentor

LangChain4jは、`RetrievalAugmentor`インターフェースのすぐに使える実装である`DefaultRetrievalAugmentor`を提供しています。これは、ほとんどのRAGユースケースに適しているはずです。
この実装は、[こちらの記事](https://blog.langchain.dev/deconstructing-rag)と[こちらの論文](https://arxiv.org/abs/2312.10997)に着想を得ています。
コンセプトをより深く理解するために、これらのリソースを確認することをお勧めします。

### Query

`Query`は、RAGパイプラインにおけるユーザークエリを表します。
クエリのテキストとクエリメタデータが含まれます。

#### クエリメタデータ

`Query`内の`Metadata`には、RAGパイプラインのさまざまなコンポーネントで役立つ可能性のある情報が含まれています。例えば、以下のとおりです。
- `Metadata.userMessage()` - 拡張される元の`UserMessage`
- `Metadata.chatMemoryId()` - `@MemoryId`アノテーションが付けられたメソッドパラメータの値。詳細は[こちら](/tutorials/ai-services/#chat-memory)。ユーザーを識別し、取得中にアクセス制限やフィルタを適用するために使用できます。
- `Metadata.chatMemory()` - これまでのすべての`ChatMessage`。`Query`が行われたコンテキストを理解するのに役立ちます。
- `Metadata.invocationParameters()` - AIサービスを呼び出す際に指定できる`InvocationParameters`が含まれます。




```java
interface Assistant {
    String chat(@UserMessage String userMessage, InvocationParameters parameters);
}

InvocationParameters parameters = InvocationParameters.from(Map.of("userId", "12345"));
String response = assistant.chat("Hello", parameters);
```

`InvocationParameters` は、他のAIサービスコンポーネント内でもアクセスできます。例えば、以下のようなものがあります：
- [`@Tool`アノテーション付きメソッド](/tutorials/tools#invocationparameters)
- [`ToolProvider`](/tutorials/tools#specifying-tools-dynamically)：`ToolProviderRequest` 内
- [`ToolArgumentsErrorHandler`](/tutorials/tools#handling-tool-arguments-errors)
  および [`ToolExecutionErrorHandler`](https://docs.langchain4j.dev/tutorials/tools#handling-tool-execution-errors)：
  `ToolErrorContext` 内

パラメータは、変更可能でスレッドセーフな `Map` に格納されます。

データは、AIサービスの1回の呼び出し中に、`InvocationParameters` 内でAIサービスコンポーネント間を渡すことができます
（例えば、あるRAGコンポーネントから別のRAGコンポーネントへ、またはRAGコンポーネントからツールへ）。

### クエリトランスフォーマー

`QueryTransformer` は、指定された `Query` を1つまたは複数の `Query` に変換します。
その目的は、元の `Query` を変更または拡張することで、検索品質を向上させることです。

検索を改善するための既知のアプローチには、以下のようなものがあります：
- クエリ圧縮
- クエリ拡張
- クエリ書き換え
- ステップバックプロンプティング
- 仮説文書埋め込み（HyDE）

詳細は[こちら](https://blog.langchain.dev/query-transformations/)をご覧ください。

LangChain4jには、`RepeatingQueryTransformer` を提供するオプションのコミunity [Prompt Repetition](/integrations/prompt-repetition/) モジュールもあります。これは、コンテンツ取得前に検索クエリを繰り返し、モデルに送信される最終的な拡張プロンプトではなく、クエリ自体を変換するために使用する必要があります。

#### デフォルトクエリトランスフォーマー

`DefaultQueryTransformer` は、`DefaultRetrievalAugmentor` で使用されるデフォルトの実装です。
`Query` に変更を加えず、そのまま通過させるだけです。

#### 圧縮クエリトランスフォーマー

`CompressingQueryTransformer` は、LLMを使用して、指定された `Query` と以前の会話を、スタンドアロンの `Query` に圧縮します。
これは、ユーザーが以前の質問や回答の情報を参照するフォローアップ質問をする場合に役立ちます。

以下に例を示します：
```
User: Tell me about John Doe
AI: John Doe was a ...
User: Where did he live?
```
クエリ「Where did he live?」だけでは、必要な情報を取得できません。
ジョン・ドウへの明示的な言及がないため、`he`が誰を指しているのか不明瞭だからです。

`CompressingQueryTransformer`を使用すると、LLMが会話全体を読み取り、
「Where did he live?」を「Where did John Doe live?」に変換します。

#### Expanding Query Transformer
`ExpandingQueryTransformer`は、LLMを使用して指定された`Query`を複数の`Query`に展開します。
LLMが`Query`をさまざまな方法で言い換えたり再構成したりできるため、
より関連性の高いコンテンツを取得するのに役立ちます。

### Content
`Content`は、ユーザーの`Query`に関連するコンテンツを表します。
現在はテキストコンテンツ（つまり`TextSegment`）に限定されていますが、
将来的には他のモダリティ（画像、音声、動画など）もサポートする可能性があります。

### Content Retriever
`ContentRetriever`は、指定された`Query`を使用して、基盤となるデータソースから`Content`を取得します。
基盤となるデータソースは、実質的に何でも可能です：
- 埋め込みストア
- 全文検索エンジン
- ベクトル検索と全文検索のハイブリッド
- Web検索エンジン
- ナレッジグラフ
- SQLデータベース
- など

`ContentRetriever`によって返される`Content`のリストは、関連性の高い順（最高から最低）に並べられます。

#### Embedding Store Content Retriever
`EmbeddingStoreContentRetriever`は、`EmbeddingModel`を使用して`Query`を埋め込み、
`EmbeddingStore`から関連する`Content`を取得します。

以下に例を示します：
```java
EmbeddingStore embeddingStore = ...
EmbeddingModel embeddingModel = ...

ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(embeddingStore)
    .embeddingModel(embeddingModel)
    .maxResults(3)
     // maxResults can also be specified dynamically depending on the query
    .dynamicMaxResults(query -> 3)
    .minScore(0.75)
     // minScore can also be specified dynamically depending on the query
    .dynamicMinScore(query -> 0.75)
    .filter(metadataKey("userId").isEqualTo("12345"))
    // filter can also be specified dynamically depending on the query
    .dynamicFilter(query -> {
        String userId = query.metadata().invocationParameters().get("userId");
        return metadataKey("userId").isEqualTo(userId);
    })
    .build();

interface Assistant {
    String chat(@UserMessage String userMessage, InvocationParameters parameters);
}

InvocationParameters parameters = InvocationParameters.from(Map.of("userId", "12345"));
String response = assistant.chat("Hello", parameters);
```

クエリを`input_type=query`で埋め込むには（インジェスターの`DOCUMENT`とペアリングします。[クエリとドキュメントの埋め込み](#query-vs-document-embeddings-opt-in)を参照）、リトリーバーで入力タイプを設定します：


```java
ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
    .embeddingStore(embeddingStore)
    .embeddingModel(embeddingModel)
    .embeddingInputType(EmbeddingInputType.QUERY)
    .build();
```

デフォルトは変更なし（入力タイプは送信されません）。`EmbeddingModel` は `input_type` パラメータをサポートしている必要があります。

#### Web検索コンテンツレトリーバー
`WebSearchContentRetriever` は、`WebSearchEngine` を使用してウェブから関連する `Content` を取得します。

サポートされているすべての `WebSearchEngine` 統合は、[こちら](/category/web-search-engines) にあります。

以下に例を示します：
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
完全な例は[こちら](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_08_Advanced_RAG_Web_Search_Example.java)にあります。

#### SQLデータベースコンテンツレトリーバー
`SqlDatabaseContentRetriever`は、`ContentRetriever`の実験的な実装であり、
`langchain4j-experimental-sql`モジュールにあります。

これは、`DataSource`とLLMを使用して、指定された自然言語の`Query`に対して
SQLクエリを生成および実行します。

詳細については、`SqlDatabaseContentRetriever`のjavadocを参照してください。

[例](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_10_Advanced_RAG_SQL_Database_Retreiver_Example.java)はこちらです。

#### Azure AI Searchコンテンツレトリーバー
`AzureAiSearchContentRetriever`は、
[Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search)との統合です。
全文検索、ベクトル検索、ハイブリッド検索、および再ランキングをサポートしています。
これは、`langchain4j-azure-ai-search`モジュールにあります。
詳細については、`AzureAiSearchContentRetriever`のJavadocを参照してください。

#### Neo4jコンテンツレトリーバー
`Neo4jContentRetriever`は、[Neo4j](https://neo4j.com/)グラフデータベースとの統合です。
自然言語クエリをNeo4j Cypherクエリに変換し、
これらのクエリをNeo4jで実行して関連情報を取得します。
これは、`langchain4j-community-neo4j-retriever`モジュールにあります。

#### Elasticsearchコンテンツレトリーバー
`ElasticsearchContentRetriever`は、
[Elasticsearch](https://www.elastic.co/elasticsearch)との統合です。
全文検索、ベクトル検索、ハイブリッド検索をサポートしています。
これは、`langchain4j-elasticsearch`モジュールにあります。
詳細については、`ElasticsearchContentRetriever`のJavadocを参照してください。

### クエリルーター
`QueryRouter`は、`Query`を適切な`ContentRetriever`にルーティングする役割を担います。

#### デフォルトクエリルーター
`DefaultQueryRouter`は、`DefaultRetrievalAugmentor`で使用されるデフォルトの実装です。
各`Query`を設定されたすべての`ContentRetriever`にルーティングします。

#### 言語モデルクエリルーター
`LanguageModelQueryRouter`は、LLMを使用して指定された`Query`のルーティング先を決定します。

### コンテンツアグリゲーター
`ContentAggregator`は、以下の複数のランク付けされた`Content`リストを集約する役割を担います：
- 複数の`Query`
- 複数の`ContentRetriever`
- 両方

#### デフォルトコンテンツアグリゲーター
`DefaultContentAggregator`は、`ContentAggregator`のデフォルト実装であり、
2段階のReciprocal Rank Fusion（RRF）を実行します。
詳細については、[`DefaultContentAggregator` Javadoc](https://javadoc.io/doc/dev.langchain4j/langchain4j-core/latest/dev/langchain4j/rag/content/aggregator/DefaultContentAggregator.html)を参照してください。

#### 再ランキングコンテンツアグリゲーター
`ReRankingContentAggregator`は、Cohereなどの`ScoringModel`を使用して再ランキングを実行します。
サポートされているスコアリング（再ランキング）モデルの完全なリストは
[こちら](https://docs.langchain4j.dev/category/scoring-reranking-models)にあります。
詳細については、[`ReRankingContentAggregator` Javadoc](https://javadoc.io/doc/dev.langchain4j/langchain4j-core/latest/dev/langchain4j/rag/content/aggregator/ReRankingContentAggregator.html)を参照してください。

### コンテンツインジェクター

`ContentInjector`は、`ContentAggregator`によって返された`Content`を`UserMessage`に注入する役割を担います。

#### デフォルトコンテンツインジェクター

`DefaultContentInjector`は、`ContentInjector`のデフォルト実装であり、単純に`Content`を
`UserMessage`の末尾にプレフィックス`Answer using the following information:`を付けて追加します。

`Content`を`UserMessage`に注入する方法は、次の3つの方法でカスタマイズできます：
- デフォルトの`PromptTemplate`をオーバーライドする：
```java
RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
    .contentInjector(DefaultContentInjector.builder()
        .promptTemplate(PromptTemplate.from("{{userMessage}}\n{{contents}}"))
        .build())
    .build();
```
`PromptTemplate`には`{{userMessage}}`と`{{contents}}`の変数が必ず含まれている必要があることにご注意ください。
- `DefaultContentInjector`を拡張し、`format`メソッドのいずれかをオーバーライドする
- カスタム`ContentInjector`を実装する

`DefaultContentInjector`は、取得した`Content.textSegment()`から`Metadata`エントリの注入もサポートしています。
```java
DefaultContentInjector.builder()
    .metadataKeysToInclude(List.of("source"))
    .build()
```
この場合、`TextSegment.text()` の先頭には「content: 」というプレフィックスが付加され、
`Metadata` の各値にはキーがプレフィックスとして付加されます。
最終的な `UserMessage` は次のようになります：
```
How can I cancel my reservation?

Answer using the following information:
content: To cancel a reservation, go to ...
source: ./cancellation_procedure.html

content: Cancellation is allowed for ...
source: ./cancellation_policy.html
```

### 並列化

`Query`が1件かつ`ContentRetriever`が1つの場合、
`DefaultRetrievalAugmentor`はクエリルーティングとコンテンツ取得を同じスレッドで実行します。
それ以外の場合は、`Executor`を使用して処理を並列化します。
デフォルトでは、変更された（`keepAliveTime`が60秒ではなく1秒の）`Executors.newCachedThreadPool()`
が使用されますが、`DefaultRetrievalAugmentor`を作成する際にカスタムの`Executor`インスタンスを提供することもできます。
```java
DefaultRetrievalAugmentor.builder()
        ...
        .executor(executor)
        .build;
```


## ソースへのアクセス

[AIサービス](/tutorials/ai-services)を使用する際に、
メッセージを拡張するために取得されたソース（`Content`）にアクセスしたい場合は、
戻り値の型を`Result`クラスでラップすることで簡単に実現できます。
```java
interface Assistant {

    Result<String> chat(String userMessage);
}

Result<String> result = assistant.chat("How to do Easy RAG with LangChain4j?");

String answer = result.content();
List<Content> sources = result.sources();
```

ストリーミング時には、`onRetrieved()`メソッドを使用して`Consumer<List<Content>>`を指定できます。
```java
interface Assistant {

    TokenStream chat(String userMessage);
}

assistant.chat("How to do Easy RAG with LangChain4j?")
    .onRetrieved((List<Content> sources) -> ...)
    .onPartialResponse(...)
    .onCompleteResponse(...)
    .onError(...)
    .start();
```

## チャットメモリに保存される内容の制御

[AIサービス](/tutorials/ai-services)で`RetrievalAugmentor`を使用する場合、
**拡張された**ユーザーメッセージ（取得した`Content`が挿入されたもの）と
**元の**ユーザーメッセージのどちらをチャットメモリに保存するかを制御できます。

この動作は、`AiServices`ビルダーの`storeRetrievedContentInChatMemory`オプションで設定します。

### 設定

- `true`（デフォルト）  
  **拡張された**`UserMessage`（元のクエリと取得したコンテンツ）を
  チャットメモリに保存します。  
  同じ拡張メッセージがLLMにも送信されます。

- `false`  
  **元の**`UserMessage`（取得したコンテンツを含まない）のみを
  チャットメモリに保存します。  
  推論中は拡張メッセージが引き続きLLMに送信されます。

元のユーザーメッセージのみを保存すると、チャット履歴を簡潔に保ち、
ユーザーの実際の入力に沿った内容にすることができます。
その一方で、回答生成時にはLLMに取得したコンテキストを提供できます。

### 例


```java
interface Assistant {

    String chat(String userMessage);
}

ChatModel chatModel = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName(GPT_4_O_MINI)
    .build();

MessageWindowChatMemory chatMemory =
    MessageWindowChatMemory.withMaxMessages(10);

RetrievalAugmentor retrievalAugmentor =
    DefaultRetrievalAugmentor.builder()
        .contentRetriever(
            EmbeddingStoreContentRetriever.from(embeddingStore, embeddingModel))
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .chatMemory(chatMemory)
    .retrievalAugmentor(retrievalAugmentor)
    // Store only the original user message in chat memory
    .storeRetrievedContentInChatMemory(false)
    .build();
```


## 例

- [Easy RAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_1_easy/Easy_RAG_Example.java)
- [Naive RAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_2_naive/Naive_RAG_Example.java)
- [クエリ圧縮を用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_01_Advanced_RAG_with_Query_Compression_Example.java)
- [クエリルーティングを用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_02_Advanced_RAG_with_Query_Routing_Example.java)
- [再ランキングを用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_03_Advanced_RAG_with_ReRanking_Example.java)
- [メタデータを含む高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_04_Advanced_RAG_with_Metadata_Example.java)
- [メタデータフィルタリングを用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_05_Advanced_RAG_with_Metadata_Filtering_Examples.java)
- [複数のリトリーバーを用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_07_Advanced_RAG_Multiple_Retrievers_Example.java)
- [Web検索を用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_08_Advanced_RAG_Web_Search_Example.java)
- [SQLデータベースを用いた高度なRAG](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_10_Advanced_RAG_SQL_Database_Retreiver_Example.java)
- [検索のスキップ](https://github.com/langchain4j/langchain4j-examples/blob/main/rag-examples/src/main/java/_3_advanced/_06_Advanced_RAG_Skip_Retrieval_Example.java)
- [RAG + ツール](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)
- [ドキュメントの読み込み](https://github.com/langchain4j/langchain4j-examples/blob/main/other-examples/src/main/java/DocumentLoaderExamples.java)
