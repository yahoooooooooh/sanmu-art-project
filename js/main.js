document.addEventListener('DOMContentLoaded', () => {
    // 左侧导航链接
    const navArticlesLink = document.getElementById('nav-articles');
    const navGalleryLink = document.getElementById('nav-gallery');

    // 右侧视图区域
    const articlesView = document.getElementById('articles-view');
    const galleryView = document.getElementById('gallery-view');

    // 文章相关元素
    const articlesListULElement = document.getElementById('articles-list-ul');
    const articleContentContainerElement = document.getElementById('article-content-container');
    
    // 图片画廊容器
    const galleryContainerElement = document.querySelector('#gallery-view .gallery-container');

    // Giscus 占位符和实际的 script 元素
    const giscusPlaceholder = document.getElementById('giscus-placeholder');
    const giscusScript = giscusPlaceholder ? giscusPlaceholder.querySelector('script') : null;

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

    function setActiveNav(activeLink) {
        [navArticlesLink, navGalleryLink].forEach(link => {
            if (link) link.classList.remove('active');
        });
        if (activeLink) activeLink.classList.add('active');
    }

    function showView(viewToShow) {
        [articlesView, galleryView].forEach(view => {
            if (view) view.style.display = 'none';
        });
        if (viewToShow) {
            // **** 修改在这里：确保 #gallery-view 也使用 display: flex ****
            if (viewToShow.id === 'articles-view' || viewToShow.id === 'gallery-view') {
                 viewToShow.style.display = 'flex'; 
            } else {
                 viewToShow.style.display = 'block'; // 其他可能的视图（目前没有）
            }
        }
    }
    
    if (navArticlesLink) {
        navArticlesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(articlesView);
            setActiveNav(navArticlesLink);
        });
    }

    if (navGalleryLink) {
        navGalleryLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(galleryView);
            setActiveNav(navGalleryLink);
            loadGallery(); 
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
            loadArticleFromHash(allArticles); 
            // 默认显示文章视图（showView 和 setActiveNav 会在 loadArticleFromHash 中处理，或在此处确保）
            if (!window.location.hash) { // 如果没有hash，则明确设置默认视图
                showView(articlesView);
                setActiveNav(navArticlesLink);
            }
        })
        .catch(error => {
            console.error('加载文章索引失败:', error);
            if (articlesListULElement) {
                articlesListULElement.innerHTML = `<li>加载文章列表失败。错误: ${error.message}</li>`;
            }
            document.title = '错误 - 扑灰年画创新传承项目成果展示';
            showView(articlesView); // 即使失败，也显示文章区域的错误信息
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
                
                const existingGiscusContainer = articleContentContainerElement.querySelector('[id^="giscus-comments-for-"]');
                if (existingGiscusContainer) {
                    existingGiscusContainer.remove();
                }
                if (giscusScript) {
                    const giscusContainerForArticle = document.createElement('div');
                    giscusContainerForArticle.id = `giscus-comments-for-${articleId}`;
                    giscusContainerForArticle.style.marginTop = '30px'; 
                    
                    const newGiscusScript = giscusScript.cloneNode(true);
                    giscusContainerForArticle.appendChild(newGiscusScript);
                    articleContentContainerElement.appendChild(giscusContainerForArticle);
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
        // if (galleryLoadedOnce) { return; } // 如果不希望每次都重新加载，可以启用这个

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
                    galleryContainerElement.innerHTML = '<p>没有找到图片。</p>';
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

    function loadArticleFromHash(articles) {
        let articleLoadedFromHash = false;
        if (window.location.hash) {
            const articleIdFromHash = window.location.hash.substring(1);
            const articleToLoad = articles.find(article => article.id === articleIdFromHash);

            if (articleToLoad) {
                showView(articlesView); 
                setActiveNav(navArticlesLink); 
                loadArticleContent(articleToLoad.filename, articleToLoad.id, articleToLoad.title);
                articleLoadedFromHash = true;
            } else {
                console.warn(`页面加载时未能在文章索引中找到ID为 '${articleIdFromHash}' 的文章。`);
            }
        }
        
        if (!articleLoadedFromHash) {
            showView(articlesView); // 默认显示文章视图
            setActiveNav(navArticlesLink); // 默认激活文章导航
            document.title = '扑灰年画创新传承项目成果展示';
        }
    }
});