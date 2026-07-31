---
sidebar_position: 1
---

# Prompt Repetition

`langchain4j-community-prompt-repetition` は、LangChain4j の 2 つの統合ポイント向けに、すぐに使えるプロンプト反復（prompt repetition）統合を提供するオプションのコミュニティモジュールです：

- AI Services の入力ガードレール（input guardrails）
- RAG クエリ変換

論文 [Prompt Repetition Improves Non-Reasoning LLMs](https://arxiv.org/html/2512.14982v1) に着想を得ており、同論文は一連の非推論ワークロードでの改善を報告しています。LangChain4j では、このモジュールがフレームワークネイティブのコンポーネント経由でコアの反復入力変換を公開し、実運用向けの保守的なデフォルトを追加します。

このモジュールは実験的であり、効果はワークロードに依存します。広く展開する前に、自身のプロンプト、モデル、タスクで検証してください。

## 概要

プロンプト反復は、テキストを次の形に書き換えます：

```text
Q -> Q\nQ
```

LangChain4j では、次の 2 箇所に適用できます：

- 非 RAG の AI Services 呼び出しの前に、`PromptRepeatingInputGuardrail` を使用
- 高度な RAG パイプラインの検索前に、`RepeatingQueryTransformer` を使用

RAG では、反復は検索クエリのみに適用し、モデルへ送る最終的な拡張プロンプトには適用しないでください。

## Maven依存関係

すでにコミュニティモジュールを使っている場合は、コミュニティ BOM のインポートを推奨します：

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

次に prompt repetition モジュールを追加します：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-prompt-repetition</artifactId>
</dependency>
```

モジュールを直接宣言することもできます：

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-prompt-repetition</artifactId>
    <version>${latest version here}</version>
</dependency>
```

## コンポーネント

このモジュールは 3 つの主な API を提供します：

- `PromptRepeatingInputGuardrail` は、モデル呼び出し前に対象となる単一テキストのユーザー入力を反復します
- `RepeatingQueryTransformer` は、高度な RAG パイプラインで検索クエリを反復します
- `PromptRepetitionPolicy` は、両方の統合で共有される反復ルールを含みます

これらの API はすべて `@Experimental` とマークされています。

## 非 RAG での使い方

非 RAG の AI Services 呼び出しでは、`PromptRepeatingInputGuardrail` を `AiServices` ビルダーに取り付けます：

```java
PromptRepetitionPolicy policy = PromptRepetitionPolicy.builder()
        .mode(PromptRepetitionMode.AUTO)
        .maxChars(8_000)
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .inputGuardrails(new PromptRepeatingInputGuardrail(policy))
        .build();
```

モデル呼び出し前にユーザー入力を書き換えたい場合で、拡張済み RAG プロンプトを扱っていないときは、これが推奨される統合ポイントです。

## RAG での使い方

RAG では、検索クエリのみを反復します：

```java
PromptRepetitionPolicy policy = PromptRepetitionPolicy.builder()
        .mode(PromptRepetitionMode.AUTO)
        .maxChars(8_000)
        .build();

RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
        .queryTransformer(new RepeatingQueryTransformer(policy))
        .build();
```

これにより変換を検索段階に留め、取得済みコンテンツが既に注入された後の最終プロンプトの重複を避けられます。

## モード

`PromptRepetitionPolicy` は 3 つのモードをサポートします：

- `NEVER`：反復を無効化
- `ALWAYS`：対象となる入力を反復
- `AUTO`：既に反復されたテキスト、非常に長い入力、明示的な推論を求めているように見えるプロンプトをスキップする保守的なモード

評価を始めるには `AUTO` が最も安全な出発点です。

## 安全性と制約

- `PromptRepeatingInputGuardrail` は対象となる単一テキストのユーザー入力のみを書き換えます
- マルチモーダルリクエストの主な統合ポイントとしては意図されていません
- デフォルトでは、RAG 拡張が既に行われている場合、ガードレールはリクエストをスキップします
- RAG 設定では、最終的な拡張プロンプトではなく検索クエリを反復するために `RepeatingQueryTransformer` を使用してください
- このモジュールは実験的なため、API と動作は将来のバージョンで変更される可能性があります

## いつ使うか

LangChain4j でプロンプト反復をすぐ適用したいときにこのモジュールを使い、万能のデフォルトプロンプト方針としては使わないでください。

- `PromptRepetitionMode.AUTO` から始める
- まずは非推論または低推論ワークロードを優先する
- 自身のプロンプト、モデル、タスクで A/B テストして評価する
- 緩和する明確な理由がない限り、デフォルトの安全制約を維持する
- 改善は保証ではなくワークロード依存として扱う
