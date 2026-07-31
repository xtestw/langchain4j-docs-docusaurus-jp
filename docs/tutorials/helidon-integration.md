---
sidebar_position: 29
---

# Helidon 統合

[Helidon](https://helidon.io/) は、Helidon のプログラミングモデルとスタイルを活かしつつ、AI 駆動アプリケーションの構築を簡素化する LangChain4j 統合モジュールを提供しています。

LangChain4j 統合機能の詳細な説明と使い方は[こちら](https://helidon.io/docs/latest/se/integrations/langchain4j/langchain4j)にあります。

## サポートされるバージョン

Helidon の LangChain4j 統合には Java 21 と Helidon 4.2 が必要です。

## 例

探索できるサンプルアプリケーションをいくつか用意しています。これらのサンプルは、Helidon アプリケーションで LangChain4j を使う各方面を示します。

### Coffee Shop Assistant
Coffee Shop Assistant は、コーヒーショップ向けの AI アシスタント構築を示すデモアプリケーションです。このアシスタントはメニューに関する質問への回答、おすすめの提示、注文の作成ができます。JSON ファイルから初期化された埋め込みストアを利用します。

主な機能：
- OpenAI チャットモデルとの統合
- 埋め込みモデル、埋め込みストア、ingestor、コンテンツリトリーバーの利用
- 依存性注入のための Helidon Inject
- JSON ファイルからの埋め込みストア初期化
- 対話を強化するコールバック関数のサポート

確認する：
- [Helidon SE 向け Coffee Shop Assistant](https://github.com/helidon-io/helidon-examples/tree/helidon-4.x/examples/integrations/langchain4j/coffee-shop-assistant-se)
- [Helidon MP 向け Coffee Shop Assistant](https://github.com/helidon-io/helidon-examples/tree/helidon-4.x/examples/integrations/langchain4j/coffee-shop-assistant-mp)

### Hands-on Lab

Coffee Shop Assistant の構築手順を示す Hands-on Lab も提供しています：

[HOL: Helidon と LangChain4j で AI 駆動アプリケーションを構築する](https://github.com/helidon-io/helidon-labs/tree/main/hols/langchain4j)
