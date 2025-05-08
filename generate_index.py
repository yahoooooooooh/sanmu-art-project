import os
import json

# 配置项
articles_dir = 'articles'
images_dir = 'images'
data_dir = 'data'
article_index_file = os.path.join(data_dir, 'article_index.json')
image_index_file = os.path.join(data_dir, 'image_index.json')

def generate_article_index():
    """扫描 articles 目录生成文章索引"""
    articles = []
    if not os.path.exists(articles_dir):
        print(f"警告: 文章目录 '{articles_dir}' 不存在。")
        return articles

    for filename in os.listdir(articles_dir):
        if filename.endswith('.md'):
            article_id = os.path.splitext(filename)[0] # 使用文件名（无后缀）作为ID
            
            # 尝试从文件第一行读取标题
            title_from_file = None
            file_path = os.path.join(articles_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as md_file:
                    first_line = md_file.readline().strip()
                    # 假设标题行以 '#' 开头，并且后面有内容
                    if first_line.startswith('#') and len(first_line) > 1:
                        # 去掉 '#' 和开头的空格
                        title_from_file = first_line.lstrip('# ').strip()
                    elif first_line: # 如果第一行不是#开头，但有内容，也作为备选 (如果不想这样，可以注释掉这部分)
                        title_from_file = first_line
            except Exception as e:
                print(f"读取文件 {filename} 标题时出错: {e}")

            # 如果未能从文件读取到标题，则使用文件名作为后备标题
            if title_from_file:
                title = title_from_file
            else:
                # 后备方案：使用格式化后的文件名作为标题
                title = article_id.replace('_', ' ').replace('-', ' ').title() 
                print(f"提示: 未能从文件 '{filename}' 的第一行提取到标题，将使用文件名生成标题: '{title}'")


            articles.append({
                'id': article_id,
                'title': title,
                'filename': filename
            })
    
    articles.sort(key=lambda x: x['id']) # 按ID排序

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
    images = []
    if not os.path.exists(images_dir):
        print(f"警告: 图片目录 '{images_dir}' 不存在。")
        return images

    supported_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    for filename in os.listdir(images_dir):
        if filename.lower().endswith(supported_extensions):
            image_id = os.path.splitext(filename)[0]
            images.append({
                'id': image_id,
                'filename': filename,
                'path': os.path.join(images_dir, filename).replace('\\', '/') # 确保路径使用正斜杠
            })
            
    images.sort(key=lambda x: x['id']) # 按ID排序

    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    with open(image_index_file, 'w', encoding='utf-8') as f:
        json.dump(images, f, ensure_ascii=False, indent=4)
        
    print(f"图片索引已生成: {image_index_file}")
    if not images:
        print(f"提示: '{images_dir}' 目录中没有找到支持的图片文件。")
    return images

if __name__ == '__main__':
    print("开始生成索引文件...")
    generate_article_index()
    generate_image_index()
    print("索引文件生成完毕。")