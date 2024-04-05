import { util } from './util.mjs';
import { theme } from './theme.mjs';
import { storage } from './storage.mjs';
import { pagination } from './pagination.mjs';

export const card = (() => {

    const user = storage('user');
    const owns = storage('owns');
    const likes = storage('likes');
    const tracker = storage('tracker');
    const session = storage('session');

    const lists = new Map([
        ['\*', `<strong class="text-${theme.isDarkMode('light', 'dark')}">$1</strong>`],
        ['\_', `<em class="text-${theme.isDarkMode('light', 'dark')}">$1</em>`],
        ['\~', `<del class="text-${theme.isDarkMode('light', 'dark')}">$1</del>`],
        ['\`\`\`', `<code class="font-monospace text-${theme.isDarkMode('light', 'dark')}">$1</code>`]
    ]);

    const renderLoading = () => {
        document.getElementById('comments').innerHTML = `
        <div class="card-body bg-theme-${theme.isDarkMode('dark', 'light')} shadow p-3 mx-0 mt-0 mb-3 rounded-4">
            <div class="d-flex flex-wrap justify-content-between align-items-center placeholder-wave">
                <span class="placeholder bg-secondary col-4 rounded-3"></span>
                <span class="placeholder bg-secondary col-2 rounded-3"></span>
            </div>
            <hr class="text-${theme.isDarkMode('light', 'dark')} my-1">
            <p class="card-text placeholder-wave">
                <span class="placeholder bg-secondary col-6 rounded-3"></span>
                <span class="placeholder bg-secondary col-5 rounded-3"></span>
                <span class="placeholder bg-secondary col-12 rounded-3"></span>
            </p>
        </div>`.repeat(pagination.getPer());
    };

    const convertMarkdownToHTML = (input) => {
        lists.forEach((v, k) => {
            const regex = new RegExp(`\\${k}(?=\\S)(.*?)(?<!\\s)\\${k}`, 'gs');
            input = input.replace(regex, v);
        });

        return input;
    };

    const renderButton = (comment) => {
        return `
        <div class="d-flex flex-wrap justify-content-between align-items-center" id="button-${comment.uuid}">
            <div class="d-flex flex-wrap justify-content-start align-items-center">
                <button style="font-size: 0.8rem;" onclick="comment.reply(this)" data-uuid="${comment.uuid}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">Balas</button>

                ${owns.has(comment.uuid)
                ? `<button style="font-size: 0.8rem;" onclick="comment.edit(this)" data-uuid="${comment.uuid}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 ms-1">Ubah</button>` : ''}

                ${session.get('token')
                ? `<button style="font-size: 0.8rem;" onclick="comment.remove(this)" data-uuid="${comment.uuid}" data-own="${comment.own}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 ms-1">Hapus</button>`
                : (owns.has(comment.uuid) ? `<button style="font-size: 0.8rem;" onclick="comment.remove(this)" data-uuid="${comment.uuid}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 ms-1">Hapus</button>` : '')}
            </div>
            <div class="ms-auto">
                <button style="font-size: 0.8rem;" onclick="like.like(this)" data-uuid="${comment.uuid}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-2 p-0">
                    <div class="d-flex justify-content-start align-items-center">
                        <p class="my-0 mx-1" data-count-like="${comment.like.love}">${comment.like.love} suka</p>
                        <i class="py-1 me-1 px-0 pb-0 ${likes.has(comment.uuid) ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
                    </div>
                </button>
            </div>
        </div>`;
    };

    const renderTracker = (comment) => {
        if (comment.ip === null || comment.user_agent === null || comment.is_admin) {
            return '';
        }

        if (!tracker.has(comment.ip)) {
            fetch(`https://ipapi.co/${comment.ip}/city`)
                .then((res) => res.text())
                .then((res) => {
                    if (res == 'Undefined') {
                        res = 'Localhost';
                    }

                    tracker.set(comment.ip, res);
                })
                .catch((err) => console.error(err));
        }

        return `<p class="text-${theme.isDarkMode('light', 'dark')} my-1 mx-0 p-0" style="white-space: pre-wrap; font-size: 0.8rem;"><i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(comment.ip) + (tracker.has(comment.ip) ? ' - ' + tracker.get(comment.ip) : '')}</p>
        <p class="text-${theme.isDarkMode('light', 'dark')} my-1 mx-0 p-0" style="white-space: pre-wrap; font-size: 0.8rem;"><i class="fa-solid fa-mobile-screen-button me-1"></i>${util.escapeHtml(comment.user_agent)}</p>`;
    };

    const renderHeader = (is_parent) => {
        if (is_parent) {
            return `class="card-body bg-theme-${theme.isDarkMode('dark', 'light')} shadow p-3 mx-0 mt-0 mb-3 rounded-4" data-parent="true"`;
        }

        return `class="card-body border-start bg-theme-${theme.isDarkMode('dark', 'light')} py-2 ps-2 pe-0 my-2 ms-2 me-0"`;
    };

    const renderTitle = (comment, is_parent) => {
        if (comment.is_admin) {
            return `<strong class="me-1">${util.escapeHtml(user.get('name'))}</strong><i class="fa-solid fa-certificate text-primary"></i>`;
        }

        if (is_parent) {
            return `<strong class="me-1">${util.escapeHtml(comment.name)}</strong><i class="fa-solid ${comment.presence ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>`;
        }

        return `<strong>${util.escapeHtml(comment.name)}</strong>`;
    };

    const renderBody = (comment, is_parent) => {
        return `
        <div class="d-flex flex-wrap justify-content-between align-items-center">
            <p class="text-${theme.isDarkMode('light', 'dark')} text-truncate m-0 p-0" style="font-size: 0.95rem;">${renderTitle(comment, is_parent)}</p>
            <small class="text-${theme.isDarkMode('light', 'dark')} m-0 p-0" style="font-size: 0.75rem;">${comment.created_at}</small>
        </div>
        <hr class="text-${theme.isDarkMode('light', 'dark')} my-1">
        <p class="text-${theme.isDarkMode('light', 'dark')} mt-0 mb-1 mx-0 p-0" style="white-space: pre-wrap" id="content-${comment.uuid}">${convertMarkdownToHTML(util.escapeHtml(comment.comment))}</p>`;
    };

    const renderContent = (comment, is_parent = true) => {
        return `
        <div ${renderHeader(is_parent)} id="${comment.uuid}">
            ${renderBody(comment, is_parent)}
            ${renderTracker(comment)}
            ${renderButton(comment)}
            ${comment.comments.map((c) => renderContent(c, false)).join('')}
        </div>`;
    };

    return {
        renderLoading,
        renderContent,
        convertMarkdownToHTML
    }
})();