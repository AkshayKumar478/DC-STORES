(function () {
    const contentSelector = '.admin-content-shell .content';

    async function loadAdminPage(url, shouldPushState) {
        const content = document.querySelector(contentSelector);
        if (!content) {
            window.location.href = url;
            return;
        }

        content.classList.add('is-admin-loading');

        try {
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load page');
            }

            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const nextContent = doc.querySelector(contentSelector);

            if (!nextContent) {
                window.location.href = url;
                return;
            }

            content.innerHTML = nextContent.innerHTML;

            if (shouldPushState) {
                window.history.pushState({}, '', url);
            }

            window.dispatchEvent(new CustomEvent('admin:page-updated', {
                detail: { url }
            }));

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Admin pagination failed:', error);
            window.location.href = url;
        } finally {
            content.classList.remove('is-admin-loading');
        }
    }

    document.addEventListener('click', function (event) {
        const link = event.target.closest('.admin-pagination__link');

        if (!link || link.classList.contains('is-disabled')) {
            return;
        }

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
            return;
        }

        const url = link.href;
        if (!url || new URL(url).origin !== window.location.origin) {
            return;
        }

        event.preventDefault();
        loadAdminPage(url, true);
    });

    window.addEventListener('popstate', function () {
        loadAdminPage(window.location.href, false);
    });
})();
