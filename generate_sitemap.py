#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import datetime
import argparse
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

class SitemapGenerator:
    def __init__(self, base_url, output_file="static/sitemap.xml", exclude_paths=None):
        self.base_url = base_url.rstrip('/')
        self.output_file = output_file
        self.exclude_paths = exclude_paths or []
        self.urls = set()
        self.visited = set()
    
    def is_valid_url(self, url):
        """检查URL是否有效且属于同一域名"""
        parsed_base = urlparse(self.base_url)
        parsed_url = urlparse(url)
        
        # 检查是否为同一域名
        if parsed_base.netloc != parsed_url.netloc:
            return False
        
        # 检查是否为排除路径
        for path in self.exclude_paths:
            if parsed_url.path.startswith(path):
                return False
        
        # 排除锚点链接和查询参数
        if '#' in url:
            return False
            
        return True
    
    def crawl(self, url, max_depth=10, current_depth=0):
        """爬取网站并收集所有URL"""
        if current_depth > max_depth or url in self.visited:
            return
        
        self.visited.add(url)
        print(f"爬取: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                print(f"错误: 无法访问 {url}, 状态码: {response.status_code}")
                return
                
            # 添加当前URL到集合
            self.urls.add(url)
            
            # 解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找所有链接
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # 处理相对URL
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(url, href)
                
                # 确保URL属于同一域名
                if self.is_valid_url(href) and href not in self.visited:
                    self.crawl(href, max_depth, current_depth + 1)
                    
        except Exception as e:
            print(f"爬取 {url} 时出错: {e}")
    
    def generate(self, max_depth=10):
        """生成sitemap.xml文件"""
        self.crawl(self.base_url, max_depth)
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        
        # 生成XML
        now = datetime.datetime.now().strftime("%Y-%m-%d")
        
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
            
            for url in sorted(self.urls):
                f.write('  <url>\n')
                f.write(f'    <loc>{url}</loc>\n')
                f.write(f'    <lastmod>{now}</lastmod>\n')
                f.write('    <changefreq>weekly</changefreq>\n')
                f.write('    <priority>0.8</priority>\n')
                f.write('  </url>\n')
                
            f.write('</urlset>')
        
        print(f"\n成功生成 sitemap! 共包含 {len(self.urls)} 个URL")
        print(f"Sitemap 保存在: {os.path.abspath(self.output_file)}")

def main():
    parser = argparse.ArgumentParser(description='生成网站的 Sitemap XML 文件')
    parser.add_argument('-u', '--url', default='https://docs-jp.langchain4j.info', 
                        help='网站的基础URL (默认: https://docs-jp.langchain4j.info)')
    parser.add_argument('-o', '--output', default='static/sitemap.xml', 
                        help='输出文件名 (默认: static/sitemap.xml)')
    parser.add_argument('-d', '--depth', type=int, default=5, 
                        help='爬取深度 (默认: 5)')
    parser.add_argument('-e', '--exclude', nargs='+', 
                        help='要排除的路径前缀列表')
    
    args = parser.parse_args()
    
    generator = SitemapGenerator(args.url, args.output, args.exclude)
    generator.generate(args.depth)

if __name__ == "__main__":
    main() 