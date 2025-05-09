import os
import json
import re

# 配置项
articles_dir = 'articles'
images_dir = 'images'
data_dir = 'data'
article_index_file = os.path.join(data_dir, 'article_index.json')
image_index_file = os.path.join(data_dir, 'image_index.json')

# 图片分类 KEY 常量
IMAGE_CATEGORY_KEYS = {
    "TRADITIONAL_TECHNIQUE": "TRADITIONAL_TECHNIQUE",
    "TRADITIONAL_WORK": "TRADITIONAL_WORK",
    "INNOVATIVE_WORK": "INNOVATIVE_WORK",
    "CULTURAL_CREATIVE": "CULTURAL_CREATIVE",
    "AI_PLUS_HANDICRAFT": "AI_PLUS_HANDICRAFT",
    "OTHER": "OTHER"
}

def sanitize_for_id(text, fallback_prefix="item"):
    """
    将文本转换为适合做 HTML ID 的字符串。
    """
    text_no_special_chars = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
    sanitized = re.sub(r'[\s_]+', '-', text_no_special_chars)
    sanitized = re.sub(r'-+', '-', sanitized) 
    sanitized = sanitized.lower().strip('-')
    if not sanitized:
        safer_text = re.sub(r'\W+', '', text, flags=re.UNICODE)
        if not safer_text: # 如果还是空的
            return f"{fallback_prefix}-unknown-{os.urandom(4).hex()}" # 添加随机十六进制以确保唯一性
        return f"{fallback_prefix}-{safer_text[:20].lower()}"
    return sanitized

def extract_title_from_md(file_path):
    """从 Markdown 文件的第一行提取标题 (H1)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as md_file:
            first_line = md_file.readline().strip()
            if first_line.startswith('#') and len(first_line) > 1:
                return first_line.lstrip('# ').strip()
    except Exception as e:
        print(f"读取文件 {os.path.basename(file_path)} 标题时出错: {e}")
    return None

def generate_article_index():
    """扫描 articles 目录生成多语言文章索引"""
    articles_data = {} 
    if not os.path.exists(articles_dir):
        print(f"警告: 文章目录 '{articles_dir}' 不存在。")
        return []

    file_pattern = re.compile(r"^(.*?)(?:\.(zh|en|ja))?\.md$", re.IGNORECASE)

    for filename in os.listdir(articles_dir):
        if not filename.endswith('.md'):
            continue
        match = file_pattern.match(filename)
        if not match:
            print(f"跳过不匹配格式的文件: {filename}")
            continue
        base_name_raw = match.group(1)
        lang_code = match.group(2) 
        current_lang = lang_code if lang_code else 'zh'
        base_id_candidate = sanitize_for_id(base_name_raw, fallback_prefix="article")
        if not base_id_candidate:
            print(f"警告: 无法为 {base_name_raw} 生成有效的基础ID。跳过 {filename}.")
            continue
        article_id = base_id_candidate
        file_path = os.path.join(articles_dir, filename)
        title = extract_title_from_md(file_path)
        if not title:
            title = base_name_raw.replace('_', ' ').replace('-', ' ').capitalize()
            print(f"提示: 未能从文件 '{filename}' 的第一行提取到标题，将使用文件名生成标题: '{title}' for lang '{current_lang}'")
        if article_id not in articles_data:
            articles_data[article_id] = {
                'id': article_id,
                'titles': {},
                'filenames': {}
            }
        if current_lang not in articles_data[article_id]['titles'] or lang_code is not None:
             articles_data[article_id]['titles'][current_lang] = title
             articles_data[article_id]['filenames'][current_lang] = filename
    articles_list = list(articles_data.values())
    articles_list.sort(key=lambda x: x['titles'].get('zh', x['id']))
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    with open(article_index_file, 'w', encoding='utf-8') as f:
        json.dump(articles_list, f, ensure_ascii=False, indent=4)
    print(f"多语言文章索引已生成: {article_index_file}")
    if not articles_list:
        print(f"提示: '{articles_dir}' 目录中没有找到 .md 文件。")
    return articles_list

def determine_image_category_key(filename):
    """
    根据文件名判断图片分类，并返回分类的 KEY。
    """
    fn_lower = filename.lower()
    if "ai绘制荷叶.jpg" == fn_lower or "荷叶头像框.png" == fn_lower:
        return IMAGE_CATEGORY_KEYS["AI_PLUS_HANDICRAFT"]
    if "头像框.jpg" in fn_lower and (fn_lower.startswith('0') or fn_lower.startswith('1')) and len(fn_lower.split('.')[0]) <= 3: # 修正：split('.')
        return IMAGE_CATEGORY_KEYS["AI_PLUS_HANDICRAFT"]
    if any(keyword in filename for keyword in ["扑灰", "画灰", "粉手", "上色", "涮花", "开眉眼", "落款成画"]):
        if filename.startswith(tuple(str(i) for i in range(1,8))) or "（高清）" in filename:
             return IMAGE_CATEGORY_KEYS["TRADITIONAL_TECHNIQUE"]
    if "鹅次元虎意年画" in filename or "刘墉拒绝贿赂效果图" in filename:
        return IMAGE_CATEGORY_KEYS["INNOVATIVE_WORK"]
    if "文创小产品" in filename or "文创——鼠标垫" in filename or "小夜灯高清化" in filename or "台灯" in filename:
        return IMAGE_CATEGORY_KEYS["CULTURAL_CREATIVE"]
    traditional_works_filenames = [
        "四条屏.jpg", "玉带福春.jpg", "《五子献寿》（又名《千祥百福》）.jpg",
        "《三星高照》.jpg", "《福禄寿喜》 年画.jpg", "渔乐图.jpg", "四美图.png",
        "四季有余图.png", "福禄寿喜.png"
    ]
    if filename in traditional_works_filenames:
        return IMAGE_CATEGORY_KEYS["TRADITIONAL_WORK"]
    return IMAGE_CATEGORY_KEYS["OTHER"] 

def generate_image_index():
    """扫描 images 目录生成支持多语言标题的图片索引"""
    images_data = []
    used_image_ids = set() 
    if not os.path.exists(images_dir):
        print(f"警告: 图片目录 '{images_dir}' 不存在。")
        return images_data

    supported_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    filenames = sorted([f for f in os.listdir(images_dir) if f.lower().endswith(supported_extensions)])
    
    print("\n正在生成图片索引，重要提示：")
    print("此脚本会将图片文件名（无后缀）作为默认的中文、英文和日文标题。")
    print("您需要在此脚本运行后，手动编辑生成的 'data/image_index.json' 文件，")
    print("为每张图片的 'titles' 对象中的 'en' 和 'ja' 键提供准确的翻译。")
    print("例如，找到对应的图片条目，修改：")
    print("""  "titles": {\n    "zh": "中文标题来自文件名",\n    "en": "此处填写准确的英文标题",\n    "ja": "此处填写准确的日文标题"\n  },""")
    print("确保您的图片标题得到正确国际化。\n")

    for filename in filenames:
        image_title_zh = os.path.splitext(filename)[0] 
        image_title_en = image_title_zh # 占位：需要用户在JSON中手动翻译
        image_title_ja = image_title_zh # 占位：需要用户在JSON中手动翻译
        
        base_id = sanitize_for_id(image_title_zh, fallback_prefix="image")
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

        category_key = determine_image_category_key(filename)

        images_data.append({
            'id': image_id,
            'titles': { 
                'zh': image_title_zh,
                'en': image_title_en, 
                'ja': image_title_ja  
            },
            'filename': filename,
            'path': os.path.join(images_dir, filename).replace('\\', '/'), # 确保使用正斜杠
            'category_key': category_key
        })
            
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    with open(image_index_file, 'w', encoding='utf-8') as f:
        json.dump(images_data, f, ensure_ascii=False, indent=4)
        
    print(f"多语言图片索引已生成: {image_index_file}")
    if not images_data:
        print(f"提示: '{images_dir}' 目录中没有找到支持的图片文件。")
    return images_data

if __name__ == '__main__':
    print("开始生成多语言文章索引...")
    generate_article_index()
    print("\n开始生成多语言图片索引...")
    generate_image_index()
    print("\n索引文件生成完毕。")
    print("请记得检查并在 'data/image_index.json' 中手动翻译图片标题的 'en' 和 'ja' 字段！")