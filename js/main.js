document.addEventListener('DOMContentLoaded', async () => {
    // 左侧导航链接
    const navArticlesLink = document.getElementById('nav-articles');
    const navGalleryLink = document.getElementById('nav-gallery');
    const navAIChatLink = document.getElementById('nav-ai-chat');

    // 右侧视图区域
    const articlesView = document.getElementById('articles-view');
    const galleryView = document.getElementById('gallery-view');
    const aiChatView = document.getElementById('ai-chat-view');

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

    const allNavLinks = [navArticlesLink, navGalleryLink, navAIChatLink];
    const allViews = [articlesView, galleryView, aiChatView];

    // --- Internationalization (i18n) ---
    let currentLang = 'zh'; 
    let translations = {}; 
    const supportedLangs = ['zh', 'en', 'ja'];
    const langSwitcherContainer = document.querySelector('.language-switcher');
    let allArticles = []; 
    let galleryLoadedOnce = false; 

    function getInitialLanguage() {
        const storedLang = localStorage.getItem('preferredLang');
        if (storedLang && supportedLangs.includes(storedLang)) {
            return storedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        if (supportedLangs.includes(browserLang)) {
            return browserLang;
        }
        return 'zh'; 
    }

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`${basePath}/locales/${lang}.json?v=${new Date().getTime()}`); 
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json: ${response.status} ${response.statusText}`);
            }
            translations = await response.json();
            console.log(`Translations for ${lang} loaded.`);
            document.documentElement.lang = lang; 
        } catch (error) {
            console.error('Error loading translation file:', error);
            if (lang !== 'zh') { 
                console.warn(`Falling back to 'zh' translations.`);
                await loadTranslations('zh'); 
            } else {
                translations = {}; 
                alert('Failed to load base language file (zh.json). Site may not display correctly.');
            }
        }
    }

    function applyTranslationsToStaticElements() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            if (translations[key] !== undefined) { 
                if (el.tagName === 'TITLE') {
                    el.textContent = translations[key];
                } else if (el.tagName === 'IMG' && key === 'logo_alt_text') { 
                    el.alt = translations[key];
                } else if (el.tagName === 'A' && el.href.includes('baidu.com') && key === "ai_chat_download_button") { 
                    el.textContent = translations[key]; 
                }
                else {
                    if (el.id !== 'header-logo') { 
                       el.innerHTML = translations[key];
                    }
                }
            } else {
                console.warn(`Translation key "${key}" not found for language "${currentLang}".`);
            }
        });
        const logoElement = document.getElementById('header-logo');
        if (logoElement) {
            logoElement.src = `${basePath}/LOGO.png`; 
        }
    }

    async function setLanguage(lang) {
        if (!supportedLangs.includes(lang) || lang === currentLang) return;
        console.log(`Setting language to: ${lang}`);
        currentLang = lang;
        localStorage.setItem('preferredLang', currentLang);
        
        await loadTranslations(currentLang);
        applyTranslationsToStaticElements();

        if (articlesListULElement) articlesListULElement.innerHTML = '';
        if (articleContentContainerElement) {
             articleContentContainerElement.innerHTML = `<p>${translations['article_select_prompt'] || '请从左侧选择一篇文章查看。'}</p>`;
        }
        if (galleryContainerElement) galleryContainerElement.innerHTML = '';
        galleryLoadedOnce = false; 
        
        await fetchArticleIndexAndHandleHash(); 
        
        const currentHash = window.location.hash;
        if (currentHash.startsWith('#gallery') && (galleryView.style.display === 'flex' || galleryView.style.display === 'block')) {
            loadGallery(); 
        } else if (currentHash.startsWith('#ai-chat')) {
            // AI chat view doesn't depend on dynamic content in the same way for now
        } else if (currentHash && currentHash !== '#' && !currentHash.startsWith('#articles')) {
            // If a specific article was showing, handleHashChange will reload it
        } else {
            // Default to articles view, handleHashChange covers this
        }
        updateNavActiveStateBasedOnHash(); 
    }
    
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
            if (viewToShow.id === 'articles-view' || viewToShow.id === 'gallery-view') {
                 viewToShow.style.display = 'flex'; 
            } else {
                 viewToShow.style.display = 'block';
            }
        }
    }
    
    if (navArticlesLink) {
        navArticlesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(articlesView);
            setActiveNav(navArticlesLink);
            window.location.hash = '#articles'; // Or just '', if that's your default
        });
    }

    if (navGalleryLink) {
        navGalleryLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(galleryView);
            setActiveNav(navGalleryLink);
            loadGallery(); // Load or reload gallery on click to ensure correct language
            window.location.hash = '#gallery';
        });
    }

    if (navAIChatLink) {
        navAIChatLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(aiChatView);
            setActiveNav(navAIChatLink);
            window.location.hash = '#ai-chat';
        });
    }

    function loadArticlesList(articlesData) {
        if (!articlesListULElement) return;
        articlesListULElement.innerHTML = ''; 
        if (!articlesData || articlesData.length === 0) {
            articlesListULElement.innerHTML = `<li>${translations['no_articles_found'] || '没有找到文章。'}</li>`;
            return;
        }
        articlesData.forEach(articleEntry => { 
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            const title = articleEntry.titles[currentLang] || articleEntry.titles['zh'] || articleEntry.id;
            link.textContent = title; 
            link.href = `#${articleEntry.id}`; 
            link.addEventListener('click', (event) => {
                event.preventDefault();
                showView(articlesView); 
                setActiveNav(navArticlesLink);
                loadArticleContent(articleEntry); 
                window.location.hash = `#${articleEntry.id}`; 
            });
            listItem.appendChild(link);
            articlesListULElement.appendChild(listItem);
        });
    }
    
    async function fetchArticleIndexAndHandleHash() { 
        try {
            const response = await fetch(`${basePath}/data/article_index.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
            }
            allArticles = await response.json(); 
            loadArticlesList(allArticles); 
            handleHashChange(allArticles); 
        } catch (error) {
            console.error('加载文章索引失败:', error);
            if (articlesListULElement) {
                articlesListULElement.innerHTML = `<li>${translations['error_loading_article_list'] || '加载文章列表失败。'} Error: ${error.message}</li>`;
            }
            const errorTitle = translations['error_generic'] || '错误';
            const siteBase = translations['site_title_base'] || '扑灰年画创新传承项目成果展示';
            document.title = `${errorTitle} - ${siteBase}`;
            showView(articlesView); 
            setActiveNav(navArticlesLink);
        }
    }

    function loadArticleContent(articleEntry) { 
        if (!articleContentContainerElement) return;
        const filenameToLoad = articleEntry.filenames[currentLang] || articleEntry.filenames['zh'];
        const titleToDisplay = articleEntry.titles[currentLang] || articleEntry.titles['zh'] || articleEntry.id;
        const articleId = articleEntry.id;

        if (!filenameToLoad) {
            console.error(`No filename found for article ID ${articleId} in language ${currentLang} or fallback 'zh'.`);
            articleContentContainerElement.innerHTML = `<p>${translations['error_loading_article_content'] || '加载文章内容失败。'} (File not specified for language)</p>`;
            return;
        }

        fetch(`${basePath}/articles/${filenameToLoad}?v=${new Date().getTime()}`)
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
                    articleContentContainerElement.innerHTML = '<p>Error: Markdown parsing library not loaded.</p>';
                }
                const siteBase = translations['site_title_base'] || '扑灰年画创新传承项目成果展示';
                document.title = `${titleToDisplay} - ${siteBase}`;
                console.log(`Article ${filenameToLoad} (ID: ${articleId}, Title: ${titleToDisplay}) loaded for lang ${currentLang}.`);
            })
            .catch(error => {
                console.error(`加载文章 '${filenameToLoad}' (ID: ${articleId}) 失败:`, error);
                articleContentContainerElement.innerHTML = `<p>${translations['error_loading_article_content'] || '加载文章内容失败。'} Error: ${error.message}</p>`;
                const errorTitle = translations['error_generic'] || '错误';
                const siteBase = translations['site_title_base'] || '扑灰年画创新传承项目成果展示';
                document.title = `${errorTitle} - ${siteBase}`;
            });
    }

    function loadGallery() {
        if (!galleryContainerElement) {
            console.warn("Image gallery container '.gallery-container' not found.");
            return;
        }
        fetch(`${basePath}/data/image_index.json?v=${new Date().getTime()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, trying to fetch ${response.url}`);
                }
                return response.json();
            })
            .then(images => {
                galleryContainerElement.innerHTML = ''; 
                if (!images || images.length === 0) {
                    galleryContainerElement.innerHTML = `<p>${translations['no_images_found'] || '没有找到图片。'}</p>`;
                    return;
                }
                const imagesByCategory = images.reduce((acc, image) => {
                    const categoryKey = image.category_key || "OTHER"; 
                    if (!acc[categoryKey]) {
                        acc[categoryKey] = [];
                    }
                    acc[categoryKey].push(image);
                    return acc;
                }, {});

                const categoryDisplayOrderKeys = [ // These are the keys from IMAGE_CATEGORY_KEYS
                    "TRADITIONAL_TECHNIQUE", "TRADITIONAL_WORK", "INNOVATIVE_WORK",
                    "AI_PLUS_HANDICRAFT", "CULTURAL_CREATIVE", "OTHER"
                ];
                // Map these to the translation keys in locales/*.json
                const categoryTranslationKeys = categoryDisplayOrderKeys.map(key => `gallery_category_${key}`);

                for (const i in categoryDisplayOrderKeys) {
                    const actualCategoryKey = categoryDisplayOrderKeys[i];
                    const translationKey = categoryTranslationKeys[i];

                    if (imagesByCategory[actualCategoryKey] && imagesByCategory[actualCategoryKey].length > 0) {
                        const categorySection = document.createElement('div');
                        categorySection.classList.add('gallery-category-section');
                        const categoryTitleElement = document.createElement('h3');
                        categoryTitleElement.classList.add('gallery-category-title');
                        categoryTitleElement.textContent = translations[translationKey] || actualCategoryKey; 
                        categorySection.appendChild(categoryTitleElement);
                        const categoryImagesContainer = document.createElement('div');
                        categoryImagesContainer.classList.add('gallery-category-images');
                        imagesByCategory[actualCategoryKey].forEach(image => {
                            const galleryItem = document.createElement('div');
                            galleryItem.classList.add('gallery-item');
                            galleryItem.id = `gallery-image-${image.id}`;
                            const imgElement = document.createElement('img');
                            imgElement.src = `${basePath}/${image.path}`; 
                            const imageDisplayTitle = image.titles[currentLang] || image.titles['zh'] || image.id;
                            imgElement.alt = imageDisplayTitle; 
                            imgElement.title = imageDisplayTitle;
                            imgElement.loading = 'lazy'; 
                            const titleElement = document.createElement('p');
                            titleElement.classList.add('gallery-item-title');
                            titleElement.textContent = imageDisplayTitle;
                            imgElement.addEventListener('click', () => {
                                window.open(`${basePath}/${image.path}`, '_blank');
                            });
                            galleryItem.appendChild(imgElement);
                            galleryItem.appendChild(titleElement);
                            categoryImagesContainer.appendChild(galleryItem);
                        });
                        categorySection.appendChild(categoryImagesContainer);
                        galleryContainerElement.appendChild(categorySection);
                    }
                }
                galleryLoadedOnce = true; 
                console.log("Multi-language image gallery loaded.");
            })
            .catch(error => {
                console.error('加载图片索引失败:', error);
                if (galleryContainerElement) {
                    galleryContainerElement.innerHTML = `<p>${translations['error_loading_gallery'] || '加载图片画廊失败。'} Error: ${error.message}</p>`;
                }
            });
    }
    
    function updateNavActiveStateBasedOnHash() {
        const hash = window.location.hash;
        if (hash.startsWith('#gallery')) setActiveNav(navGalleryLink);
        else if (hash.startsWith('#ai-chat')) setActiveNav(navAIChatLink);
        else if (hash && hash !== '#' && (hash.startsWith('#articles') || !hash.startsWith('#'))) {
             // If hash is #articles or any article ID like #some-article-id
            setActiveNav(navArticlesLink);
        }
        else setActiveNav(navArticlesLink); // Default
    }

    function handleHashChange(articles = allArticles) {
        const hash = window.location.hash;
        updateNavActiveStateBasedOnHash(); // Update nav active state first

        if (hash.startsWith('#gallery')) {
            showView(galleryView);
            // setActiveNav(navGalleryLink); // Moved to updateNavActiveStateBasedOnHash
            if(!galleryLoadedOnce || currentLangChangedGallery) { // currentLangChangedGallery is a flag you might set in setLanguage
                loadGallery();
                // currentLangChangedGallery = false; // Reset flag
            }
        } else if (hash.startsWith('#ai-chat')) {
            showView(aiChatView);
            // setActiveNav(navAIChatLink); // Moved
        } else if (hash && hash !== '#' && !hash.startsWith('#articles')) { 
            const articleIdFromHash = hash.substring(1);
            const articleToLoad = articles.find(article => article.id === articleIdFromHash);
            if (articleToLoad) {
                showView(articlesView);
                // setActiveNav(navArticlesLink); // Moved
                loadArticleContent(articleToLoad); 
            } else {
                console.warn(`Hash routing: Article ID '${articleIdFromHash}' not found. Showing default article view.`);
                showView(articlesView); 
                // setActiveNav(navArticlesLink); // Moved
                if (articleContentContainerElement) {
                    articleContentContainerElement.innerHTML = `<p>${translations['article_select_prompt'] || '请从左侧选择一篇文章查看。'}</p>`;
                    const siteBase = translations['site_title_base'] || '扑灰年画创新传承项目成果展示';
                    const overviewTitle = translations['nav_articles'] || '文章概览';
                    document.title = `${overviewTitle} - ${siteBase}`;
                }
            }
        } else { 
            showView(articlesView);
            // setActiveNav(navArticlesLink); // Moved
            if (articleContentContainerElement) {
                articleContentContainerElement.innerHTML = `<p>${translations['article_select_prompt'] || '请从左侧选择一篇文章查看。'}</p>`;
                const siteBase = translations['site_title_base'] || '扑灰年画创新传承项目成果展示';
                const overviewTitle = translations['nav_articles'] || '文章概览';
                document.title = `${overviewTitle} - ${siteBase}`;
            }
        }
    }

    // --- Initial Load ---
    currentLang = getInitialLanguage();
    await loadTranslations(currentLang); 
    applyTranslationsToStaticElements(); 

    if (langSwitcherContainer) {
        langSwitcherContainer.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.tagName === 'A' && e.target.dataset.lang) {
                setLanguage(e.target.dataset.lang);
            }
        });
    }
    
    await fetchArticleIndexAndHandleHash(); 
    window.addEventListener('hashchange', () => handleHashChange(allArticles));
});