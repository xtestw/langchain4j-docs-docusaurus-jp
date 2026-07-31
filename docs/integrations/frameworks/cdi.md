---
sidebar_position: 9
---

# LangChain4J CDI

[LangChain4J CDI](https://github.com/langchain4j/langchain4j-cdi) は、AI サービスを Jakarta EE および MicroProfile アプリケーションに直接注入します。

## ドキュメント

完全なドキュメントは **[langchain4j.github.io/langchain4j-cdi](https://langchain4j.github.io/langchain4j-cdi/)** で利用できます。

## 機能

- **AI Service Injection** — `@RegisterAIService` を使って AI サービスを CDI bean として宣言
- **Agentic Topologies** — マルチエージェントワークフロー向けの 11 のトポロジー別アノテーション（`@RegisterSimpleAgent`、`@RegisterSequenceAgent`、`@RegisterLoopAgent` など）
- **MCP Server** — CDI bean を Model Context Protocol サーバーとして公開
- **Configuration via Properties** — MicroProfile Config またはカスタム SPI で LLM コンポーネントを設定
- **Fault Tolerance** — `@Retry`、`@Timeout`、`@CircuitBreaker`、`@Fallback` による耐障害性
- **Telemetry** — AI 操作向けの OpenTelemetry ベースの可観測性
- **Expression Language** — アノテーション内の `${...}`（MicroProfile Config）および `#{...}`（Jakarta EL）式を解決
- **Guardrails** — AI サービス連携の入出力検証

## サポートされるランタイム

| Runtime | Extension Type |
|---------|---------------|
| Quarkus | Build-compatible |
| Helidon | Both |
| WildFly | Portable |
| Payara | Portable |
| GlassFish | Portable |
| Liberty | Portable |

LangChain4j CDI 機能の詳細な説明と使い方については、[LangChain4J CDI ドキュメント](https://langchain4j.github.io/langchain4j-cdi/)を参照してください。
