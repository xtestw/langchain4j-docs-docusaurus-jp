---
sidebar_position: 3
---

# Azure AI Search

https://azure.microsoft.com/en-us/products/ai-services/ai-search/


## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-azure-ai-search</artifactId>
    <version>1.0.0-beta4</version>
</dependency>
```

## API

- `AzureAiSearchEmbeddingStore` - ベクトル検索をサポート
- `AzureAiSearchContentRetriever` - ベクトル検索、全文検索、ハイブリッド検索、再ランキングをサポート


## 例

- [AzureAiSearchEmbeddingStoreIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-azure-ai-search/src/test/java/dev/langchain4j/store/embedding/azure/search/AzureAiSearchEmbeddingStoreIT.java)
- [AzureAiSearchContentRetrieverIT](https://github.com/langchain4j/langchain4j/blob/main/langchain4j-azure-ai-search/src/test/java/dev/langchain4j/rag/content/retriever/azure/search/AzureAiSearchContentRetrieverIT.java)
