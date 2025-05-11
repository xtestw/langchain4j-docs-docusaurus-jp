const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LangChain4j 中文文档",
  "url": "https://docs.langchain4j.info/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://docs.langchain4j.info/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "description": "LangChain4j 中文文档是一个强大的 Java 框架官方中文指南，帮助开发者轻松集成大语言模型到 Java 应用中。",
  "inLanguage": "zh-Hans"
};

document.addEventListener('DOMContentLoaded', function() {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(structuredData);
  document.head.appendChild(script);
}); 