---
sidebar_position: 33
---

# カスタマイズ可能なHTTPクライアント

一部のLangChain4jモジュール（現在はOpenAIとOllama）は、LLMプロバイダーAPIの呼び出しに使用するHTTPクライアントのカスタマイズをサポートしています。

`langchain4j-http-client`モジュールは`HttpClient` SPIを実装しており、これらのモジュールがLLMプロバイダーのREST APIを呼び出すために使用します。
つまり、基盤となるHTTPクライアントをカスタマイズでき、
`HttpClient` SPIを実装することで他の任意のHTTPクライアントも統合できます。

現在、次の組み込み実装があります：
- `langchain4j-http-client-jdk`モジュールの`JdkHttpClient`。
サポートされているモジュール（例：`langchain4j-open-ai`）を使用する場合、デフォルトで使用されます。
- `langchain4j-http-client-spring-restclient`/`langchain4j-http-client-spring-boot4-restclient`モジュールの`SpringRestClient`。
サポートされているモジュールのSpring Bootスターター（例：`langchain4j-open-ai-spring-boot-starter`/`langchain4j-open-ai-spring-boot4-starter`）を使用する場合、デフォルトで使用されます。
- `langchain4j-http-client-apache`モジュールの`ApacheHttpClient`。
- `langchain4j-http-client-okhttp`モジュールの`OkHttpClient`。

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

## Apacheの`HttpClient`のカスタマイズ

```java
org.apache.hc.client5.http.impl.classic.HttpClientBuilder httpClientBuilder = org.apache.hc.client5.http.impl.classic.HttpClientBuilder.create();

ApacheHttpClientBuilder apacheHttpClientBuilder = ApacheHttpClient.builder()
        .httpClientBuilder(httpClientBuilder);

OpenAiChatModel model = OpenAiChatModel.builder()
        .httpClientBuilder(apacheHttpClientBuilder)
        .apiKey(System.getenv("OPENAI_API_KEY"))
        .modelName("gpt-4o-mini")
        .build();
```
