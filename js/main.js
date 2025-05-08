document.addEventListener('DOMContentLoaded', () => {
    const articlesListElement = document.querySelector('#articles-list ul');
    const articleContentElement = document.getElementById('article-content');
    const giscusContainer = document.getElementById('giscus-container');

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
                return;
            }
            articles.forEach(article => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${article.id}`; // 使用文章ID作为hash，方便后续Giscus关联
                link.textContent = article.title;
                link.dataset.filename = article.filename; // 存储文件名用于加载
                
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    loadArticle(article.filename, article.id);
                    // 更新URL的hash，不触发页面重新加载，但Giscus可以检测到
                    window.location.hash = `#${article.id}`;
                });
                
                listItem.appendChild(link);
                articlesListElement.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('加载文章索引失败:', error);
            articlesListElement.innerHTML = '<li>加载文章列表失败，请查看控制台。</li>';
        });

    // --- 2. 加载并显示单篇文章内容 ---
    function loadArticle(filename, articleId) {
        fetch(`articles/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(markdownContent => {
                // 使用 marked.js 将 Markdown 转换为 HTML
                // window.marked 在 index.html 中通过 <script src="js/lib/marked.min.js"></script> 引入
                if (window.marked) {
                    articleContentElement.innerHTML = window.marked.parse(markdownContent);
                } else {
                    console.error('Marked.js 未加载。');
                    articleContentElement.innerHTML = '<p>错误：Markdown解析库未加载。</p>';
                }
                
                // 在文章加载后，处理Giscus评论的逻辑（如果已集成）
                // 目前我们只是清空旧的评论区，后续添加Giscus代码后，它会自动根据页面URL或特定配置重载
                if (giscusContainer) {
                    giscusContainer.innerHTML = ''; // 清空旧的 Giscus 实例
                    // 如果Giscus已配置为监听URL变化，它可能会自动重新加载
                    // 或者，如果Giscus提供了API来重新加载特定主题的评论，可以在这里调用
                }
                console.log(`文章 ${filename} (ID: ${articleId}) 已加载。`);
            })
            .catch(error => {
                console.error(`加载文章 '${filename}' 失败:`, error);
                articleContentElement.innerHTML = `<p>加载文章内容失败，请查看控制台。</p>`;
            });
    }

    // --- （可选）页面加载时尝试加载hash中的文章 ---
    // 这使得用户可以直接通过 URL (例如 index.html#01-xiang-mu-jie-shao) 访问特定文章
    function loadArticleFromHash() {
        if (window.location.hash) {
            const articleIdFromHash = window.location.hash.substring(1); // 移除 '#'
            // 我们需要从文章列表中找到对应的文件名
            // 这里的实现依赖于文章列表已经通过fetch加载完成
            // 为了简化，我们先假设 articlesListElement 中的链接已经生成
            // 更健壮的做法是等文章索引加载完再执行这个，或者重新fetch一次索引
            
            // 尝试在已生成的文章列表中查找
            const linkElement = articlesListElement.querySelector(`a[href="#${articleIdFromHash}"]`);
            if (linkElement && linkElement.dataset.filename) {
                loadArticle(linkElement.dataset.filename, articleIdFromHash);
            } else {
                // 如果文章列表还没加载完，或者hash不匹配，可以尝试从索引重新查找
                // 为了简单起见，这里我们先不处理这种情况。
                // 也可以先加载索引，再检查hash
                console.warn(`页面加载时未能在当前文章列表中找到ID为 '${articleIdFromHash}' 的文章。可能列表尚未完全加载。`);
            }
        }
    }

    // 稍微延迟执行 loadArticleFromHash，给文章列表fetch和渲染一点时间
    // 一个更稳妥的方法是等文章列表Promise resolve后再调用
    setTimeout(loadArticleFromHash, 500); 

});