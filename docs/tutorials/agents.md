---
sidebar_position: 7
---

# エージェント

:::note
「エージェント」は非常に広い用語で、複数の定義があることに注意してください。
:::

## 推奨読み物

- [効果的なエージェントの構築](https://www.anthropic.com/research/building-effective-agents) by Anthropic

## エージェント

基本的な「エージェント的」機能のほとんどは、高レベルの[AIサービス](/tutorials/ai-services)
と[ツール](/tutorials/tools#high-level-tool-api) APIを使用して構築できます。

より柔軟性が必要な場合は、低レベルの
[ChatModel](/tutorials/chat-and-language-models)、
[ToolSpecification](/tutorials/tools#low-level-tool-api)
および[ChatMemory](/tutorials/chat-memory) APIを使用できます。

## マルチエージェント

LangChain4jは、マルチエージェントシステムを構築するための
[AutoGen](https://github.com/microsoft/autogen)
や[CrewAI](https://www.crewai.com/)のような「エージェント」の_高レベル_抽象化をサポートしていません。

ただし、低レベルの
[ChatModel](/tutorials/chat-and-language-models)、
[ToolSpecification](/tutorials/tools#low-level-tool-api)
および[ChatMemory](/tutorials/chat-memory) APIを使用して、マルチエージェントシステムを構築することは可能です。

## 例

- [カスタマーサポートエージェント](https://github.com/langchain4j/langchain4j-examples/blob/main/customer-support-agent-example/src/test/java/dev/langchain4j/example/CustomerSupportAgentIT.java)
