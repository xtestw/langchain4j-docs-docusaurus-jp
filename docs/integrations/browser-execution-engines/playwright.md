---
sidebar_position: 1
---

# Playwright
`BrowserExecutionEngine` は、ユーザー操作に応じてブラウザ上でアクションを実行するためのブラウザ実行エンジンを表します。
`PlaywrightBrowserExecutionEngine` は <a href="https://playwright.dev/java/">Playwright Java API</a> を使ってブラウザ操作を行う `BrowserExecutionEngine` の実装です。
`BrowserUseTool` は `BrowserExecutionEngine` を使ってブラウザ操作を実行し、**Browser-Use** Agent に役立ちます。自然言語でブラウザを制御できます。例えば：
* `open page 'https://docs.langchain4j.dev/', and summary the page text`

## Maven依存関係

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-browser-execution-engine-playwright</artifactId>
    <version>${latest version here}</version>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-tool-browser-use</artifactId>
    <version>${latest version here}</version>
</dependency>
```


## API

- `BrowserExecutionEngine`
- `PlaywrightBrowserExecutionEngine`
- `BrowserUseTool`


## 例

```java
        Playwright playwright = Playwright.create();
        BrowserType.LaunchOptions options = new BrowserType.LaunchOptions()
                .setHeadless(false)
                .setChannel("chrome")
                .setChromiumSandbox(true)
                .setSlowMo(500);
        Browser browser = playwright.chromium().launch(options);

        Assistant assistant = AiServices.builder(Assistant.class)
                .chatModel(model)
                .tools(BrowserUseTool.from(PlaywrightBrowserExecutionEngine.builder().browser(browser).build()))
                .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
                .build();

        String question = "open page 'https://docs.langchain4j.dev/', and summary the page text";
        System.out.println(assistant.chat(question));
```

- [PlaywrightBrowserExecutionEngineIT](https://github.com/langchain4j/langchain4j-community/blob/main/browser-execution-engines/langchain4j-community-browser-execution-engine-playwright/src/test/java/dev/langchain4j/community/browser/playwright/PlaywrightBrowserExecutionEngineIT.java)
- [BrowserUseToolIT](https://github.com/langchain4j/langchain4j-community/blob/main/tools/langchain4j-community-tool-browser-use/src/test/java/dev/langchain4j/community/tool/browseruse/BrowserUseToolIT.java)
