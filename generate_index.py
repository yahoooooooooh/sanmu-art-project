import os
import json
import re

# 配置项
articles_dir = 'articles'
images_dir = 'images'
data_dir = 'data'
article_index_file = os.path.join(data_dir, 'article_index.json')
image_index_file = os.path.join(data_dir, 'image_index.json')

def sanitize_for_id(text, fallback_prefix="item"):
    """
    将文本转换为适合做 HTML ID 的字符串。
    保留中文、字母、数字、下划线和短横线。
    将其他特殊字符和空格替换为短横线。
    """
    # 1. 替换掉大部分不希望出现在ID中的特殊字符，但保留一些有意义的，如括号（稍后处理）
    # 保留字母（包括中文）、数字、下划线、短横线、空格
    text_no_special_chars = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
    
    # 2. 将空格和连续的破折号/下划线替换为单个破折号
    sanitized = re.sub(r'[\s_]+', '-', text_no_special_chars)
    sanitized = re.sub(r'-+', '-', sanitized) # 合并多个连续的短横线
    
    # 3. 转换为小写并去除首尾可能存在的短横线
    sanitized = sanitized.lower().strip('-')
    
    # 4. 如果处理后为空，或者太短，则基于原始文本生成一个更安全的哈希或者使用前缀+数字
    if not sanitized:
        # 可以考虑使用更复杂的哈希，但为了简单，这里用原始文本的非字母数字字符替换版
        safer_text = re.sub(r'\W+', '', text, flags=re.UNICODE) # 去掉所有非字母数字
        if not safer_text: # 如果还是空的
            return f"{fallback_prefix}-unknown"
        return f"{fallback_prefix}-{safer_text[:20].lower()}" # 取前20个字符，小写
        
    return sanitized

def generate_article_index():
    """扫描 articles 目录生成文章索引"""
    articles = []
    used_article_ids = set() # 跟踪已使用的文章ID以确保唯一性
    
    if not os.path.exists(articles_dir):
        print(f"警告: 文章目录 '{articles_dir}' 不存在。")
        return articles

    for filename in os.listdir(articles_dir):
        if filename.endswith('.md'):
            raw_id_source = os.path.splitext(filename)[0]
            base_id = sanitize_for_id(raw_id_source, fallback_prefix="article")
            
            article_id = base_id
            counter = 1
            while article_id in used_article_ids: # 确保ID唯一
                article_id = f"{base_id}-{counter}"
                counter += 1
            used_article_ids.add(article_id)

            title_from_file = None
            file_path = os.path.join(articles_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as md_file:
                    first_line = md_file.readline().strip()
                    if first_line.startswith('#') and len(first_line) > 1:
                        title_from_file = first_line.lstrip('# ').strip()
                    elif first_line:
                        title_from_file = first_line
            except Exception as e:
                print(f"读取文件 {filename} 标题时出错: {e}")

            if title_from_file:
                title = title_from_file
            else:
                title = raw_id_source.replace('_', ' ').replace('-', ' ').title()
                print(f"提示: 未能从文件 '{filename}' 的第一行提取到标题，将使用文件名生成标题: '{title}'")

            articles.append({
                'id': article_id,
                'title': title,
                'filename': filename
            })
    
    articles.sort(key=lambda x: x['title'])

    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    with open(article_index_file, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=4)
    
    print(f"文章索引已生成: {article_index_file}")
    if not articles:
        print(f"提示: '{articles_dir}' 目录中没有找到 .md 文件。")
    return articles

def generate_image_index():
    """扫描 images 目录生成图片索引"""
    images_data = []
    used_image_ids = set() # 跟踪已使用的图片ID以确保唯一性

    if not os.path.exists(images_dir):
        print(f"警告: 图片目录 '{images_dir}' 不存在。")
        return images_data

    supported_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    
    # 先读取所有文件名，以便排序后处理，确保ID生成的顺序稳定性（如果需要）
    filenames = sorted([f for f in os.listdir(images_dir) if f.lower().endswith(supported_extensions)])

    for filename in filenames:
        image_title = os.path.splitext(filename)[0] # 图片标题就是去掉后缀的文件名
        
        base_id = sanitize_for_id(image_title, fallback_prefix="image")
        
        image_id = base_id
        counter = 1
        # 确保ID唯一
        while image_id in used_image_ids or not image_id: # ID不能为空且必须唯一
            if not image_id : # 如果 sanitize_for_id 返回空（理论上新版不会轻易返回空）
                 base_id = f"image-fallback-{len(images_data) + 1}" # 提供一个更明确的fallback
                 image_id = base_id
            else:
                image_id = f"{base_id}-{counter}"
            counter += 1
        used_image_ids.add(image_id)

        images_data.append({
            'id': image_id,
            'title': image_title,
            'filename': filename,
            'path': os.path.join(images_dir, filename).replace('\\', '/')
        })
            
    # images_data.sort(key=lambda x: x['title']) # 已在获取filenames时排序，若需要基于处理后的title排序可放开

    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    with open(image_index_file, 'w', encoding='utf-8') as f:
        json.dump(images_data, f, ensure_ascii=False, indent=4)
        
    print(f"图片索引已生成: {image_index_file}")
    if not images_data:
        print(f"提示: '{images_dir}' 目录中没有找到支持的图片文件。")
    return images_data

if __name__ == '__main__':
    print("开始生成索引文件...")
    generate_article_index()
    generate_image_index()
    print("索引文件生成完毕。")
