document.addEventListener('DOMContentLoaded', () => {
    // 左侧导航链接
    const navArticlesLink = document.getElementById('nav-articles');
    const navGalleryLink = document.getElementById('nav-gallery');
    const navAIChatLink = document.getElementById('nav-ai-chat'); // 新增：获取AI对话导航链接

    // 右侧视图区域
    const articlesView = document.getElementById('articles-view');
    const galleryView = document.getElementById('gallery-view');
    const aiChatView = document.getElementById('ai-chat-view'); // 新增：获取AI对话视图

    // 文章相关元素
    const articlesListULElement = document.getElementById('articles-list-ul');
    const articleContentContainerElement = document.getElementById('article-content-container');
    
    // 图片画廊容器
    const galleryContainerElement = document.querySelector('#gallery-view .gallery-container');

    let basePath = "";
    const repoName = window.location.pathname.split('/')[1];
    if (window.location.hostname.endsWith('github.io') && window.location.pathname !== '/') {
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        if (pathSegments.length > 0 && pathSegments[0] !== 'index.html') {
            const hostnameParts = window.location.hostname.split('.');
            if (hostnameParts.length < 3 || hostnameParts[0] !== repoName || pathSegments.length > 1 || (pathSegments.length === 1 && pathSegments[0] !== 'index.html' && pathSegments[0] !== '')) {
                 basePath = `/${repoName}`;
            }
        }
    }
    console.log("Detected basePath:", basePath);

    // 更新：将 navAIChatLink 添加到数组
    const allNavLinks = [navArticlesLink, navGalleryLink, navAIChatLink];
    const allViews = [articlesView, galleryView, aiChatView];

    function setActiveNav(activeLink) {
        allNavLinks.forEach(link => {
            if (link) link.classList.remove('active');
        });
        if (activeLink) activeLink.classList.add('active');
    }

    function showView(viewToShow) {
        allViews.forEach(view => {
            if (view) view.style.display = 'none';
        });
        if (viewToShow) {
            // 根据视图类型决定 display 属性
            // articles-view 使用 flex, 其他使用 block (或者 galleryView 也用 flex)
            if (viewToShow.id === 'articles-view' || viewToShow.id === 'gallery-view') {
                 viewToShow.style.display = 'flex'; 
            } else {
                 viewToShow.style.display = 'block'; // aiChatView 用 block
            }
        }
    }
    
    if (navArticlesLink) {
        navArticlesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(articlesView);
            setActiveNav(navArticlesLink);
            window.location.hash = ''; // 清除哈希，或设置为文章概览的特定哈希
        });
    }

    if (navGalleryLink) {
        navGalleryLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(galleryView);
            setActiveNav(navGalleryLink);
            loadGallery(); 
            window.location.hash = '#gallery'; // 为画廊设置哈希
        });
    }

    // 新增：为AI对话导航链接添加事件监听器
    if (navAIChatLink) {
        navAIChatLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(aiChatView);
            setActiveNav(navAIChatLink);
            window.location.hash = '#ai-chat'; // 为AI对话设置哈希
        });
    }


    function loadArticlesList(articlesData) {
        if (!articlesListULElement) return;
        articlesListULElement.innerHTML = ''; 

        if (articlesData.length === 0) {
            articlesListULElement.innerHTML = '<li>没有找到文章。</li>';
            return;
        }
        articlesData.forEach(article => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${article.id}`; 
            link.textContent = article.title;
            link.dataset.filename = article.filename;
            
            link.addEventListener('click', (event) => {
                event.preventDefault();
                showView(articlesView); // 确保文章视图是显示的
                setActiveNav(navArticlesLink); // 设置文章导航为激活
                loadArticleContent(article.filename, article.id, article.title);
                window.location.hash = `#${article.id}`; 
            });
            
            listItem.appendChild(link);
            articlesListULElement.appendChild(listItem);
        });
    }
    
    let allArticles = []; 
    fetch(`${basePath}/data/article_index.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
            }
            return response.json();
        })
        .then(articles => {
            allArticles = articles; 
            loadArticlesList(allArticles); 
            // 处理哈希加载的逻辑调整
            handleHashChange(allArticles); 
        })
        .catch(error => {
            console.error('加载文章索引失败:', error);
            if (articlesListULElement) {
                articlesListULElement.innerHTML = `<li>加载文章列表失败。错误: ${error.message}</li>`;
            }
            document.title = '错误 - 扑灰年画创新传承项目成果展示';
            showView(articlesView); // 默认或错误时显示文章视图
            setActiveNav(navArticlesLink);
        });

    function loadArticleContent(filename, articleId, articleTitle) {
        if (!articleContentContainerElement) return;

        fetch(`${basePath}/articles/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
                }
                return response.text();
            })
            .then(markdownContent => {
                if (window.marked) {
                    articleContentContainerElement.innerHTML = window.marked.parse(markdownContent);
                } else {
                    console.error('Marked.js 未加载。');
                    articleContentContainerElement.innerHTML = '<p>错误：Markdown解析库未加载。</p>';
                }
                
                if (articleTitle) {
                    document.title = `${articleTitle} - 扑灰年画创新传承项目成果展示`;
                } else {
                    const firstH1 = articleContentContainerElement.querySelector('h1');
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
                articleContentContainerElement.innerHTML = `<p>加载文章内容失败。错误: ${error.message}</p>`;
                document.title = '错误 - 扑灰年画创新传承项目成果展示';
            });
    }

    let galleryLoadedOnce = false; 
    function loadGallery() {
        if (!galleryContainerElement) {
            console.warn("图片画廊容器 '.gallery-container' 未找到。");
            return;
        }
         // 如果已经加载过一次，可以根据需求决定是否重新加载
        // if (galleryLoadedOnce) return;

        fetch(`${basePath}/data/image_index.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
                }
                return response.json();
            })
            .then(images => {
                galleryContainerElement.innerHTML = ''; 
                if (images.length === 0) {
                    galleryContainerElement.innerHTML = '<p>沒有找到圖片。</p>';
                    return;
                }

                images.forEach(image => {
                    const galleryItem = document.createElement('div');
                    galleryItem.classList.add('gallery-item');
                    galleryItem.id = `gallery-image-${image.id}`;

                    const imgElement = document.createElement('img');
                    imgElement.src = `${basePath}/${image.path}`; 
                    imgElement.alt = image.title;
                    imgElement.title = image.title;
                    imgElement.loading = 'lazy'; 

                    const titleElement = document.createElement('p');
                    titleElement.classList.add('gallery-item-title');
                    titleElement.textContent = image.title;

                    imgElement.addEventListener('click', () => {
                        window.open(`${basePath}/${image.path}`, '_blank');
                    });

                    galleryItem.appendChild(imgElement);
                    galleryItem.appendChild(titleElement);
                    galleryContainerElement.appendChild(galleryItem);
                });
                galleryLoadedOnce = true; 
                console.log("图片画廊已加载。");
            })
            .catch(error => {
                console.error('加载图片索引失败:', error);
                if (galleryContainerElement) {
                    galleryContainerElement.innerHTML = `<p>加载图片画廊失败。错误: ${error.message}</p>`;
                }
            });
    }

    // 统一处理哈希变化的函数
    function handleHashChange(articles = allArticles) {
        const hash = window.location.hash;
        if (hash.startsWith('#gallery')) {
            showView(galleryView);
            setActiveNav(navGalleryLink);
            loadGallery();
        } else if (hash.startsWith('#ai-chat')) {
            showView(aiChatView);
            setActiveNav(navAIChatLink);
        } else if (hash && hash !== '#') { // 处理文章哈希
            const articleIdFromHash = hash.substring(1);
            const articleToLoad = articles.find(article => article.id === articleIdFromHash);
            if (articleToLoad) {
                showView(articlesView);
                setActiveNav(navArticlesLink);
                loadArticleContent(articleToLoad.filename, articleToLoad.id, articleToLoad.title);
            } else {
                console.warn(`哈希路由：未找到ID为 '${articleIdFromHash}' 的文章。显示默认文章视图。`);
                showView(articlesView); // 如果文章ID无效，显示文章列表
                setActiveNav(navArticlesLink);
                if (articles.length > 0 && articleContentContainerElement) {
                     // 可选：清空文章内容区或加载第一篇文章
                    articleContentContainerElement.innerHTML = '<p>请从左侧选择一篇文章查看。</p>';
                    document.title = '文章概览 - 扑灰年画创新传承项目成果展示';
                }
            }
        } else { // 没有哈希或哈希是空的，默认显示文章视图
            showView(articlesView);
            setActiveNav(navArticlesLink);
            if (articles.length > 0 && articleContentContainerElement) {
                articleContentContainerElement.innerHTML = '<p>请从左侧选择一篇文章查看。</p>';
                document.title = '文章概览 - 扑灰年画创新传承项目成果展示';
            }
        }
    }

    // 监听哈希变化
    window.addEventListener('hashchange', () => handleHashChange(allArticles));

    // 初始加载时也调用一次（在文章列表加载后）
    // loadArticleFromHash(allArticles) 已被 handleHashChange(allArticles) 替代，在 fetch.then 中调用
});