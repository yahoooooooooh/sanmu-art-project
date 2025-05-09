import os

def rename_image_files_in_project():
    """
    根据预定义的规则重命名 images 目录下的特定图片文件。
    """
    images_base_dir = "images"  # 假设脚本在项目根目录运行

    # 定义重命名任务：(旧文件名, 新文件名)
    # 这些文件名都是相对于 images_base_dir 的
    renaming_tasks = [
        # 分类：文创 (D)
        ("微信图片_20240220134657.jpg", "文创小产品01.jpg"),
        ("微信图片_20240220134700.jpg", "文创小产品02.jpg"),
        ("微信图片_20240220134703.jpg", "文创小产品03.jpg"),
        ("微信图片_20240220134709.jpg", "文创小产品04.jpg"),
        ("微信图片_20240220134652.jpg", "文创小产品05.jpg"),
        ("微信图片_20240220134654.jpg", "文创小产品06.jpg"),

        # 分类：创新作品 (C)
        ("微信图片_20240220135514.jpg", "鹅次元虎意年画01.jpg"),
        ("微信图片_20240220135518.jpg", "鹅次元虎意年画02.jpg"),
        ("微信图片_20240220135521.jpg", "鹅次元虎意年画03.jpg"),
        ("微信图片_20240220135524.jpg", "鹅次元虎意年画04.jpg"),
        ("微信图片_20240220135528.jpg", "鹅次元虎意年画05.jpg"),
        ("微信图片_20240220135432.jpg", "鹅次元虎意年画06.jpg"),
        ("微信图片_20240220135441.jpg", "鹅次元虎意年画07.jpg"),
        ("微信图片_20240220135445.jpg", "鹅次元虎意年画08.jpg"),
        ("微信图片_20240220135449.jpg", "鹅次元虎意年画09.jpg"),
        ("微信图片_20240220135454.jpg", "鹅次元虎意年画10.jpg"),
        ("微信图片_20240220135458.jpg", "鹅次元虎意年画11.jpg"),
        ("微信图片_20240220135502.jpg", "鹅次元虎意年画12.jpg"),
        ("微信图片_20240220135506.jpg", "鹅次元虎意年画13.jpg"),
        ("微信图片_20240220135511.jpg", "鹅次元虎意年画14.jpg"),
    ]

    if not os.path.isdir(images_base_dir):
        print(f"错误：图片目录 '{images_base_dir}' 不存在。")
        print(f"请确保此脚本位于项目根目录下，并且 '{images_base_dir}' 目录存在。")
        return

    print("--- 开始图片文件重命名 ---")
    print(f"将在目录 '{os.path.abspath(images_base_dir)}' 中操作。")
    print("\n!!! 重要：在继续之前，请确保您已备份了 'images' 目录 !!!\n")

    # 为安全起见，可以取消下面这行和 related else/indent 的注释来增加用户确认步骤
    # proceed = input("您确定要开始重命名操作吗？请输入 'yes' 继续: ")
    # if proceed.lower() != 'yes':
    #     print("操作已取消。")
    #     return

    renamed_count = 0
    skipped_count = 0
    error_count = 0

    for old_filename, new_filename in renaming_tasks:
        old_filepath = os.path.join(images_base_dir, old_filename)
        new_filepath = os.path.join(images_base_dir, new_filename)

        if not os.path.exists(old_filepath):
            print(f"跳过：源文件 '{old_filepath}' 未找到。")
            skipped_count += 1
            continue

        if os.path.exists(new_filepath):
            print(f"警告：目标文件 '{new_filepath}' 已存在。将不会覆盖此文件。")
            skipped_count += 1
            continue
        
        try:
            os.rename(old_filepath, new_filepath)
            print(f"成功：'{old_filename}'  ->  '{new_filename}'")
            renamed_count += 1
        except OSError as e:
            print(f"错误：重命名 '{old_filename}' 到 '{new_filename}' 失败: {e}")
            error_count += 1
            
    print("\n--- 重命名总结 ---")
    print(f"成功重命名: {renamed_count} 个文件")
    print(f"跳过 (源文件不存在或目标已存在): {skipped_count} 个文件")
    print(f"重命名时发生错误: {error_count} 个文件")
    print("--------------------")

if __name__ == "__main__":
    rename_image_files_in_project()