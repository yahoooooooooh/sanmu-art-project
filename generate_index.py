import os
import json
import re

# 配置项
articles_dir = 'articles'
images_dir = 'images'
data_dir = 'data'
article_index_file = os.path.join(data_dir, 'article_index.json')
image_index_file = os.path.join(data_dir, 'image_index.json')

# 图片分类常量
IMAGE_CATEGORIES = {
    "TRADITIONAL_TECHNIQUE": "传统技艺",
    "TRADITIONAL_WORK": "传统作品",
    "INNOVATIVE_WORK": "创新作品",
    "CULTURAL_CREATIVE": "文创",
    "AI_PLUS_HANDICRAFT": "AI+手艺",
    "OTHER": "其他"
}

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

def determine_image_category(filename):
    """
    根据文件名判断图片分类。
    """
    fn_lower = filename.lower()

    # AI+手艺 (顺序很重要，特定规则优先)
    if "ai绘制荷叶.jpg" == fn_lower:
        return IMAGE_CATEGORIES["AI_PLUS_HANDICRAFT"]
    if "荷叶头像框.png" == fn_lower: # 这是手绘后的成果
        return IMAGE_CATEGORIES["AI_PLUS_HANDICRAFT"]
    # AI生成的原始头像框素材
    if "头像框.jpg" in fn_lower and \
       (fn_lower.startswith('0') or fn_lower.startswith('1')) and \
       len(fn_lower.split('.')[0]) <= 3: # 修正：split_ 改为 split
        return IMAGE_CATEGORIES["AI_PLUS_HANDICRAFT"]
    
    # 传统技艺
    # 文件名如：1扑灰.png, 2画灰（高清）.png
    if any(keyword in filename for keyword in ["扑灰", "画灰", "粉手", "上色", "涮花", "开眉眼", "落款成画"]):
        # 更精确一点，避免文件名中恰好包含这些词但不是技艺本身
        if filename.startswith(tuple(str(i) for i in range(1,8))) or "（高清）" in filename:
             return IMAGE_CATEGORIES["TRADITIONAL_TECHNIQUE"]

    # 创新作品
    # 文件名如：鹅次元虎意年画01.jpg, 刘墉拒绝贿赂效果图.png
    if "鹅次元虎意年画" in filename or "刘墉拒绝贿赂效果图" in filename:
        return IMAGE_CATEGORIES["INNOVATIVE_WORK"]

    # 文创
    # 文件名如：文创小产品01.jpg, 文创——鼠标垫.jpg, 小夜灯高清化.png, 台灯.png
    if "文创小产品" in filename or "文创——鼠标垫" in filename or "小夜灯高清化" in filename or "台灯" in filename:
        return IMAGE_CATEGORIES["CULTURAL_CREATIVE"]
    
    # 传统作品 (基于已知的文件名列表)
    traditional_works_filenames = [
        "四条屏.jpg", "玉带福春.jpg", "《五子献寿》（又名《千祥百福》）.jpg",
        "《三星高照》.jpg", "《福禄寿喜》 年画.jpg", "渔乐图.jpg", "四美图.png",
        "四季有余图.png", "福禄寿喜.png"
    ]
    if filename in traditional_works_filenames:
        return IMAGE_CATEGORIES["TRADITIONAL_WORK"]

    return IMAGE_CATEGORIES["OTHER"] # 默认分类

def generate_image_index():
    """扫描 images 目录生成图片索引"""
    images_data = []
    used_image_ids = set() # 跟踪已使用的图片ID以确保唯一性

    if not os.path.exists(images_dir):
        print(f"警告: 图片目录 '{images_dir}' 不存在。")
        return images_data

    supported_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    
    filenames = sorted([f for f in os.listdir(images_dir) if f.lower().endswith(supported_extensions)])

    for filename in filenames:
        image_title = os.path.splitext(filename)[0] 
        
        base_id = sanitize_for_id(image_title, fallback_prefix="image")
        
        image_id = base_id
        counter = 1
        while image_id in used_image_ids or not image_id: 
            if not image_id : 
                 base_id = f"image-fallback-{len(images_data) + 1}"
                 image_id = base_id
            else:
                image_id = f"{base_id}-{counter}"
            counter += 1
        used_image_ids.add(image_id)

        category = determine_image_category(filename) # 新增：获取分类

        images_data.append({
            'id': image_id,
            'title': image_title,
            'filename': filename,
            'path': os.path.join(images_dir, filename).replace('\\\\', '/'),
            'category': category  # 新增：分类字段
        })
            
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
