---
sidebar_position: 9
---

# Helidon

[Helidon](https://helidon.io/)はLangChain4j統合モジュールを提供し、Helidonのプログラミングモデルとスタイルを活用しながらAI駆動アプリケーションの構築を簡素化します。

HelidonのLangChain4j統合は、LangChain4jライブラリを手動で追加する代わりに以下の利点を提供します：

- Helidon Injectとの統合
    - 設定に基づいて選択されたLangChain4jコンポーネントを自動的に作成し、Helidonサービスレジストリに登録します。
- 設定よりも規約
    - 一般的なユースケースに対して適切なデフォルト値を提供することで、手動設定を減らし、設定を簡素化します。
- 宣言的AIサービス
    - 宣言的プログラミングモデル内でLangChain4jのAIサービスをサポートし、クリーンで管理しやすいコード構造を可能にします。
- CDIとの統合
    - Helidon InjectからCDIへのブリッジを使用して、Helidon MP（MicroProfile）アプリケーションなどのCDI環境でLangChain4jコンポーネントを使用できます。

これらの機能により、LangChain4jをHelidonアプリケーションに組み込む複雑さが大幅に軽減されます。

LangChain4j統合機能の詳細な説明と使用方法については、[Helidonドキュメント](https://helidon.io/docs/latest/se/integrations/langchain4j/langchain4j)を参照してください。
