---
sidebar_position: 1
title: はじめに
---

# はじめに

ようこそ！

LangChain4jの目標は、LLMをJavaアプリケーションに統合するプロセスを簡素化することです。

具体的には以下の方法で実現します：
1. **統一API：**
   LLMプロバイダー（OpenAIやGoogle Vertex AIなど）や埋め込み（ベクトル）ストア（PineconeやMilvusなど）は
   独自APIを使用しています。LangChain4jは統一APIを提供し、各特定APIを学習・実装する必要性を排除します。
   異なるLLMや埋め込みストアを試すには、コードを書き直すことなく、それらの間で簡単に切り替えることができます。
   LangChain4jは現在、[15以上の人気LLMプロバイダー](/integrations/language-models/)と
   [20以上の埋め込みストア](/integrations/embedding-stores/)をサポートしています。
2. **包括的なツールキット：**
   2023年初頭以来、コミュニティは多数のLLM駆動アプリケーションを構築し、
   共通の抽象化、パターン、テクニックを特定してきました。LangChain4jはこれらを即座に使用できるパッケージに洗練しました。
   私たちのツールキットには、低レベルのプロンプトテンプレート、チャットメモリ管理、関数呼び出しから、
   エージェントやRAGなどの高レベルパターンまでのツールが含まれています。
   各抽象化に対して、インターフェースと一般的なテクニックに基づく複数の即座に使用可能な実装を提供します。
   チャットボットを構築する場合でも、データ取り込みから検索までの完全なパイプラインを含むRAGを開発する場合でも、
   LangChain4jは多くの選択肢を提供します。
3. **豊富な例：**
   これらの[例](https://github.com/langchain4j/langchain4j-examples)は、様々なLLM駆動アプリケーションの作成を
   始める方法を示し、インスピレーションを提供し、すぐに構築を開始できるようにします。

LangChain4jは2023年初頭のChatGPTブーム時に開発が始まりました。
多数のPythonやJavaScriptのLLMライブラリやフレームワークに比べて、Javaの対応物が不足していることに気づき、
私たちはこの問題を解決する必要がありました！
名前に「LangChain」が含まれていますが、このプロジェクトはLangChain、Haystack、
LlamaIndex、より広いコミュニティからのアイデアと概念の融合に、私たち自身のイノベーションを加えたものです。

私たちはコミュニティの発展を積極的に監視し、新しいテクニックや統合を迅速に取り入れることを目指し、
最新の状態を維持できるようにしています。
このライブラリは積極的に開発中です。一部の機能はまだ開発中ですが、
コア機能はすでに整っており、今すぐLLM駆動アプリケーションの構築を始めることができます！

より簡単に統合できるよう、LangChain4jには
[Quarkus](/tutorials/quarkus-integration)、[Spring Boot](/tutorials/spring-boot-integration)、[Helidon](/tutorials/helidon-integration)との統合も含まれています。


## LangChain4jの機能
- [15以上のLLMプロバイダー](/integrations/language-models)との統合
- [20以上の埋め込み（ベクトル）ストア](/integrations/embedding-stores)との統合
- [15以上の埋め込みモデル](/category/embedding-models)との統合
- [5つの画像生成モデル](/category/image-models)との統合
- [2つのスコアリング（リランキング）モデル](/category/scoring-reranking-models)との統合
- モデレーションモデル（OpenAI）との統合
- 入力としてのテキストと画像のサポート（マルチモーダル）
- [AIサービス](/tutorials/ai-services)（高度なLLM API）
- プロンプトテンプレート
- 永続的およびメモリ内の[チャットメモリ](/tutorials/chat-memory)アルゴリズムの実装：メッセージウィンドウとトークンウィンドウ
- LLMからの[レスポンスストリーミング](/tutorials/response-streaming)
- 一般的なJava型とカスタムPOJOのための出力パーサー
- [ツール（関数呼び出し）](/tutorials/tools)
- 動的ツール（動的に生成されたLLMコードの実行）
- [RAG（検索拡張生成）](/tutorials/rag)：
  - 取り込み：
    - 複数のソース（ファイルシステム、URL、GitHub、Azure Blob Storage、Amazon S3など）から様々な種類のドキュメント（TXT、PDF、DOC、PPT、XLSなど）をインポート
    - 様々な分割アルゴリズムを使用してドキュメントをより小さな段落に分割
    - ドキュメントと段落の後処理
    - 埋め込みモデルを使用して段落を埋め込み
    - 埋め込み（ベクトル）ストアに埋め込みを保存
  - 検索（シンプルおよび高度）：
    - クエリ変換（拡張、圧縮）
    - クエリルーティング
    - ベクトルストアおよび/または任意のカスタムソースからの検索
    - リランキング
    - 逆ランク融合
    - RAGプロセスの各ステップのカスタマイズ
- テキスト分類
- トークン化とトークン数推定のためのツール
- [Kotlin拡張](/tutorials/kotlin)：Kotlinのコルーチン機能を使用した非同期ノンブロッキングチャット対話処理。

## 2つの抽象化レベル
LangChain4jは2つの抽象化レベルで動作します：
- 低レベル。このレベルでは、最大の自由度と
[ChatModel](/tutorials/chat-and-language-models)、`UserMessage`、`AiMessage`、`EmbeddingStore`、`Embedding`などの
すべての低レベルコンポーネントへのアクセス権を持ちます。
これらはLLM駆動アプリケーションの「プリミティブ」です。
それらをどのように組み合わせるかを完全に制御できますが、より多くの接着コードを書く必要があります。
- 高レベル。このレベルでは、[AIサービス](/tutorials/ai-services)などの高レベルAPIを使用してLLMと対話し、
すべての複雑さとボイラープレートコードを隠します。
宣言的な方法で行動を調整・微調整する柔軟性はまだあります。

[![](/img/langchain4j-components.png)](/intro)


## LangChain4jライブラリ構造
LangChain4jはモジュラー設計を採用しており、以下を含みます：
- `langchain4j-core`モジュール：`ChatModel`や`EmbeddingStore`などのコア抽象化とそのAPIを定義します。
- メインの`langchain4j`モジュール：ドキュメントローダー、[チャットメモリ](/tutorials/chat-memory)実装、[AIサービス](/tutorials/ai-services)などの高レベル機能を含む有用なツールを含みます。
- 多数の`langchain4j-{integration}`モジュール：各モジュールは様々なLLMプロバイダーと埋め込みストアとの統合をLangChain4jに提供します。
  `langchain4j-{integration}`モジュールを独立して使用できます。追加機能を得るには、メインの`langchain4j`依存関係をインポートするだけです。


## LangChain4jリポジトリ
- [メインリポジトリ](https://github.com/langchain4j/langchain4j)
- [Quarkus拡張](https://github.com/quarkiverse/quarkus-langchain4j)
- [Spring Boot統合](https://github.com/langchain4j/langchain4j-spring)
- [コミュニティ統合](https://github.com/langchain4j/langchain4j-community)
- [サンプル](https://github.com/langchain4j/langchain4j-examples)
- [コミュニティリソース](https://github.com/langchain4j/langchain4j-community-resources)
- [プロセス内埋め込み](https://github.com/langchain4j/langchain4j-embeddings)


## ユースケース
なぜこれらが必要なのかと疑問に思うかもしれません。
以下はいくつかの例です：

- カスタムAI駆動チャットボットを実装したい場合、それはあなたのデータにアクセスし、あなたが望む方法で行動します：
  - カスタマーサポートチャットボットは以下が可能です：
    - 顧客の質問に丁寧に回答する
    - 注文を受け付ける/変更する/キャンセルする
  - 教育アシスタントは以下が可能です：
    - 様々な科目を教える
    - 不明確な部分を説明する
    - ユーザーの理解/知識を評価する
- 大量の非構造化データ（ファイル、ウェブページなど）を処理し、そこから構造化情報を抽出したい場合。
  例えば：
  - 顧客レビューやサポートチャット履歴から洞察を抽出する
  - 競合他社のウェブサイトから興味深い情報を抽出する
  - 求職者の履歴書から洞察を抽出する
- 情報を生成したい場合、例えば：
  - 各顧客に合わせたメール
  - アプリ/ウェブサイト用のコンテンツ：
    - ブログ記事
    - ストーリー
- 情報を変換したい場合、例えば：
  - 要約
  - 校正と書き直し
  - 翻訳

## コミュニティ統合
LangChain4jは[コミュニティリポジトリ](https://github.com/langchain4j/langchain4j-community)でいくつかの統合を維持しています。
これらはメインリポジトリの統合と同じ機能をサポートしています。
両者の唯一の違いは、コミュニティ統合が異なるアーティファクトとパッケージ名を持つことです（つまり、アーティファクトとパッケージ名に`community`プレフィックスがあります）。
コミュニティは一部の統合のメンテナンス作業を分離し、メインリポジトリの保守を容易にするために作成されました。
