---
sidebar_position: 32
---

# カスタマイズ可能なHTTPクライアント

一部のLangChain4jモジュール（現在はOpenAIとOllama）は、LLMプロバイダーAPIを呼び出すために使用されるHTTPクライアントのカスタマイズをサポートしています。

`langchain4j-http-client`モジュールは`HttpClient` SPIを実装しており、これらのモジュールがLLMプロバイダーのREST APIを呼び出すために使用されます。
これは、基盤となるHTTPクライアントをカスタマイズでき、
`HttpClient` SPIを実装することで他のHTTPクライアントも統合できることを意味します。

現在、2つの組み込み実装があります：
- `langchain4j-http-client-jdk`モジュールの`JdkHttpClient`。
サポートされているモジュール（例：`langchain4j-open-ai`）が使用される場合、デフォルトで使用されます。
- `langchain4j-http-client-spring-restclient`の`SpringRestClient`。
サポートされているモジュールのSpring Bootスターター（例：`langchain4j-open-ai-spring-boot-starter`）が使用される場合、デフォルトで使用されます。

## JDKの`HttpClient`のカスタマイズ

```java
HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
        .sslContext(...);

JdkHttpClientBuilder jdkHttpClientBuilder = JdkHttpClient.builder()
        .httpClientBuilder(httpClientBuilder);

OpenAiChatModel model = OpenAiChatModel.builder()
        .httpClientBuilder(jdkHttpClientBuilder)
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```

## Springの`RestClient`のカスタマイズ

```java
RestClient.Builder restClientBuilder = RestClient.builder()
        .requestFactory(new HttpComponentsClientHttpRequestFactory());

SpringRestClientBuilder springRestClientBuilder = SpringRestClient.builder()
        .restClientBuilder(restClientBuilder)
        .streamingRequestExecutor(new VirtualThreadTaskExecutor());

OpenAiChatModel model = OpenAiChatModel.builder()
        .httpClientBuilder(springRestClientBuilder)
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```
