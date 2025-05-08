document.addEventListener('DOMContentLoaded', () => {
    const articlesListElement = document.querySelector('#articles-list ul');
    const articleContentElement = document.getElementById('article-content');

    // 动态获取基础路径，以适应 GitHub Pages 的子目录结构
    // 如果仓库名是 'your-username.github.io'，则 basePath 为 ""
    // 否则，如果仓库 URL 是 'https://your-username.github.io/your-repo-name/', basePath 为 "/your-repo-name"
    let basePath = "";
    const repoName = window.location.pathname.split('/')[1]; // 获取路径的第一个部分
    // 检查当前域名是否为 github.io 并且路径不是简单的 '/'
    if (window.location.hostname.endsWith('github.io') && window.location.pathname !== '/') {
        // 假设路径结构是 /repo-name/ 或 /repo-name/index.html 等
        // 我们需要确保 basePath 是 /repo-name
        // 如果直接在根目录的 your-username.github.io 仓库，则 pathname 可能只是 /
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        if (pathSegments.length > 0 && pathSegments[0] !== 'index.html') { // 避免username.github.io仓库的根目录index.html被误判
            // 进一步检查是否是用户站点 (username.github.io) 还是项目站点 (username.github.io/repo-name)
            // 对于项目站点，pathname 通常以 /repo-name/ 开头
            const hostnameParts = window.location.hostname.split('.');
            // 如果 hostname 不是 username.github.io 这种形式，或者路径段数大于1
            if (hostnameParts.length < 3 || hostnameParts[0] !== repoName || pathSegments.length > 1 || (pathSegments.length === 1 && pathSegments[0] !== 'index.html' && pathSegments[0] !== '')) {
                 basePath = `/${repoName}`;
            }
        }
    }
    console.log("Detected basePath:", basePath);


    // --- 1. 加载并显示文章列表 ---
    fetch(`${basePath}/data/article_index.json`) // 在路径前添加 basePath
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
            }
            return response.json();
        })
        .then(articles => {
            if (articles.length === 0) {
                articlesListElement.innerHTML = '<li>没有找到文章。</li>';
                document.title = '扑灰年画创新传承项目成果展示';
                return;
            }
            articles.forEach(article => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                // 链接的 hash 保持不变，因为它是页面内的锚点
                link.href = `#${article.id}`; 
                link.textContent = article.title;
                link.dataset.filename = article.filename;
                
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    loadArticle(article.filename, article.id, article.title);
                    window.location.hash = `#${article.id}`;
                });
                
                listItem.appendChild(link);
                articlesListElement.appendChild(listItem);
            });
            loadArticleFromHash(articles);
        })
        .catch(error => {
            console.error('加载文章索引失败:', error);
            articlesListElement.innerHTML = `<li>加载文章列表失败，请查看控制台。错误: ${error.message}</li>`;
            document.title = '错误 - 扑灰年画创新传承项目成果展示';
        });

    // --- 2. 加载并显示单篇文章内容 ---
    function loadArticle(filename, articleId, articleTitle) {
        fetch(`${basePath}/articles/${filename}`) // 在路径前添加 basePath
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
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
                
                if (articleTitle) {
                    document.title = `${articleTitle} - 扑灰年画创新传承项目成果展示`;
                } else {
                    const firstH1 = articleContentElement.querySelector('h1');
                    if (firstH1 && firstH1.textContent) {
                        document.title = `${firstH1.textContent.trim()} - 扑灰年画创新传承项目成果展示`;
                    } else {
                        document.title = '扑灰年画创新传承项目成果展示';
                    }
                }
                console.log(`文章 ${filename} (ID: ${articleId}, Title: ${articleTitle}) 已加载。`);
            })
            .catch(error => {
                console.error(`加载文章 '${filename}' 失败:`, error);
                articleContentElement.innerHTML = `<p>加载文章内容失败，请查看控制台。错误: ${error.message}</p>`;
                document.title = '错误 - 扑灰年画创新传承项目成果展示';
            });
    }

    // --- 页面加载时尝试加载hash中的文章 ---
    function loadArticleFromHash(articles) {
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
        
        if (!articleLoadedFromHash) {
            document.title = '扑灰年画创新传承项目成果展示';
        }
    }
});