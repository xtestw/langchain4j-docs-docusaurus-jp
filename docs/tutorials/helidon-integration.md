---
sidebar_position: 29
---

# Helidon 統合

[Helidon](https://helidon.io/)はLangChain4j統合モジュールを提供しており、Helidonのプログラミングモデルとスタイルを活用しながらAI駆動アプリケーションの構築を簡素化します。

LangChain4j統合機能の詳細な説明と使用方法は[こちら](https://helidon.io/docs/latest/se/integrations/langchain4j/langchain4j)で確認できます。

## サポートされているバージョン

HelidonのLangChain4j統合にはJava 21とHelidon 4.2が必要です。

## 例

私たちはいくつかのサンプルアプリケーションを作成しました。これらのサンプルはHelidonアプリケーションでLangChain4jを使用するすべての側面を示しています。

### コーヒーショップアシスタント
コーヒーショップアシスタントは、コーヒーショップ向けのAI駆動アシスタントの構築方法を紹介するデモアプリケーションです。このアシスタントはメニューに関する質問に答え、推奨事項を提供し、注文を作成できます。JSONファイルから初期化された埋め込みストアを利用しています。

主な特徴：
- OpenAIチャットモデルとの統合
- 埋め込みモデル、埋め込みストア、インジェスター、コンテンツリトリーバーの活用
- 依存性注入のためのHelidon Inject
- JSONファイルからの埋め込みストアの初期化
- 対話を強化するためのコールバック関数のサポート

詳細はこちら：
- [Helidon SE用コーヒーショップアシスタント](https://github.com/helidon-io/helidon-examples/tree/helidon-4.x/examples/integrations/langchain4j/coffee-shop-assistant-se)
- [Helidon MP用コーヒーショップアシスタント](https://github.com/helidon-io/helidon-examples/tree/helidon-4.x/examples/integrations/langchain4j/coffee-shop-assistant-mp)

### ハンズオンラボ

コーヒーショップアシスタントの構築方法についてのステップバイステップの指示を含むハンズオンラボも提供しています：

[HOL：HelidonとLangChain4jを使用したAI駆動アプリケーションの構築](https://github.com/helidon-io/helidon-labs/tree/main/hols/langchain4j)


