document.addEventListener('DOMContentLoaded', () => {
    const articlesListElement = document.querySelector('#articles-list ul');
    const articleContentElement = document.getElementById('article-content');
    // Giscus 实例会自己管理，不再需要直接操作它

    // --- 1. 加载并显示文章列表 ---
    fetch('data/article_index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(articles => {
            if (articles.length === 0) {
                articlesListElement.innerHTML = '<li>没有找到文章。</li>';
                // 如果没有文章，也设置一个默认标题
                document.title = '扑灰年画创新传承项目成果展示';
                return;
            }
            articles.forEach(article => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${article.id}`;
                link.textContent = article.title;
                link.dataset.filename = article.filename;
                
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    loadArticle(article.filename, article.id, article.title); // 传入文章标题
                    window.location.hash = `#${article.id}`;
                });
                
                listItem.appendChild(link);
                articlesListElement.appendChild(listItem);
            });
            // 列表加载完成后，尝试从hash加载文章（如果存在）
            loadArticleFromHash(articles);
        })
        .catch(error => {
            console.error('加载文章索引失败:', error);
            articlesListElement.innerHTML = '<li>加载文章列表失败，请查看控制台。</li>';
            document.title = '错误 - 扑灰年画创新传承项目成果展示';
        });

    // --- 2. 加载并显示单篇文章内容 ---
    function loadArticle(filename, articleId, articleTitle) { // 接收文章标题
        fetch(`articles/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(markdownContent => {
                if (window.marked) {
                    articleContentElement.innerHTML = window.marked.parse(markdownContent);
                } else {
                    console.error('Marked.js 未加载。');
                    articleContentElement.innerHTML = '<p>错误：Markdown解析库未加载。</p>';
                }
                
                // 更新浏览器标签页标题
                if (articleTitle) {
                    document.title = `${articleTitle} - 扑灰年画创新传承项目成果展示`;
                } else {
                    // 如果由于某种原因没有文章标题（理论上不应该发生，因为我们从索引加载）
                    // 则尝试从文章内容的第一行H1提取（这是一个更健壮的后备）
                    const firstH1 = articleContentElement.querySelector('h1');
                    if (firstH1 && firstH1.textContent) {
                        document.title = `${firstH1.textContent.trim()} - 扑灰年画创新传承项目成果展示`;
                    } else {
                        document.title = '扑灰年画创新传承项目成果展示';
                    }
                }
                
                // Giscus 会自动监听 URL (包括 hash) 的变化并更新评论区
                console.log(`文章 ${filename} (ID: ${articleId}, Title: ${articleTitle}) 已加载。`);
            })
            .catch(error => {
                console.error(`加载文章 '${filename}' 失败:`, error);
                articleContentElement.innerHTML = `<p>加载文章内容失败，请查看控制台。</p>`;
                document.title = '错误 - 扑灰年画创新传承项目成果展示';
            });
    }

    // --- 页面加载时尝试加载hash中的文章 ---
    function loadArticleFromHash(articles) { // 接收文章列表数据
        let articleLoadedFromHash = false;
        if (window.location.hash && articles && articles.length > 0) {
            const articleIdFromHash = window.location.hash.substring(1);
            
            const articleToLoad = articles.find(article => article.id === articleIdFromHash);

            if (articleToLoad) {
                loadArticle(articleToLoad.filename, articleToLoad.id, articleToLoad.title);
                articleLoadedFromHash = true;
            } else {
                console.warn(`页面加载时未能在文章索引中找到ID为 '${articleIdFromHash}' 的文章。`);
            }
        }
        
        // 如果没有通过hash加载文章（比如初始访问或hash无效），并且有文章列表，
        // 可以选择加载第一篇文章或保持空白。
        // 当前行为是：如果没有hash匹配，则不主动加载任何文章，等待用户点击。
        // 同时也设置一个默认的页面标题。
        if (!articleLoadedFromHash) {
            document.title = '扑灰年画创新传承项目成果展示';
             // 如果希望默认加载第一篇文章，取消下面这几行的注释
            // if (articles && articles.length > 0) {
            //     loadArticle(articles[0].filename, articles[0].id, articles[0].title);
            // }
        }
    }
});