import os
import requests
import json
import time
from pathlib import Path

# Cursor API 配置
CURSOR_API_KEY = "YOUR_CURSOR_API_KEY"  # 替换为你的 Cursor API 密钥
API_ENDPOINT = "https://api.cursor.sh/v1/chat/completions"

# 设置要翻译的目录
ROOT_DIR = "."  # 当前目录，可以修改为你的文档根目录

def translate_content(content):
    """使用 Cursor API 将内容翻译成中文"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CURSOR_API_KEY}"
    }
    
    payload = {
        "model": "claude-3-opus-20240229",  # 或其他支持的模型
        "messages": [
            {
                "role": "system",
                "content": "你是一个专业的翻译助手。请将以下Markdown文档从英文翻译成中文，保持所有的Markdown格式和代码块不变。"
            },
            {
                "role": "user",
                "content": f"请将以下Markdown内容翻译成中文，保持所有的格式和代码块不变:\n\n{content}"
            }
        ],
        "temperature": 0.3
    }
    
    try:
        response = requests.post(API_ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"翻译时出错: {e}")
        return None

def process_md_file(file_path):
    """处理单个Markdown文件"""
    print(f"正在处理文件: {file_path}")
    
    # 读取文件内容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查文件是否已经是中文
    # 这是一个简单的检测，可能需要更复杂的逻辑
    if any('\u4e00' <= char <= '\u9fff' for char in content[:1000]):
        print(f"文件 {file_path} 似乎已经包含中文，跳过")
        return
    
    # 翻译内容
    translated_content = translate_content(content)
    
    if translated_content:
        # 创建备份
        backup_path = f"{file_path}.bak"
        os.rename(file_path, backup_path)
        
        # 写入翻译后的内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        
        print(f"文件 {file_path} 已翻译并保存，原文件备份为 {backup_path}")
        
        # 避免API限制，添加延迟
        time.sleep(2)
    else:
        print(f"文件 {file_path} 翻译失败")

def find_md_files(directory):
    """递归查找所有Markdown文件"""
    md_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md') and not file.endswith('.bak'):
                md_files.append(os.path.join(root, file))
    return md_files

def main():
    # 查找所有Markdown文件
    md_files = find_md_files(ROOT_DIR)
    print(f"找到 {len(md_files)} 个Markdown文件")
    
    # 处理每个文件
    for file_path in md_files:
        process_md_file(file_path)
        
    print("所有文件处理完成")

if __name__ == "__main__":
    main() 