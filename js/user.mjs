import { util } from './util.mjs';
import { storage } from './storage.mjs';
import { request, HTTP_GET, HTTP_PATCH, HTTP_PUT } from './request.mjs';

export const user = (() => {

    const user = storage('user');
    const token = storage('session');

    const getUserDetail = () => {
        request(HTTP_GET, '/api/user').token(token.get('token')).then((res) => {

            for (let [key, value] of Object.entries(res.data)) {
                user.set(key, value);
            }

            document.getElementById('dashboard-name').innerHTML = `${util.escapeHtml(res.data.name)}<i class="fa-solid fa-hands text-warning ms-2"></i>`;
            document.getElementById('dashboard-email').innerHTML = res.data.email;
            document.getElementById('dashboard-accesskey').value = res.data.access_key;

            document.getElementById('form-name').value = util.escapeHtml(res.data.name);
            document.getElementById('filterBadWord').checked = Boolean(res.data.is_filter);
            document.getElementById('replyComment').checked = Boolean(res.data.can_reply);
            document.getElementById('editComment').checked = Boolean(res.data.can_edit);
            document.getElementById('deleteComment').checked = Boolean(res.data.can_delete);
        });
    };

    const getStatUser = () => {
        request(HTTP_GET, '/api/stats').token(token.get('token')).then((res) => {
            document.getElementById('count-comment').innerHTML = res.data.comments;
            document.getElementById('count-like').innerHTML = res.data.likes;
            document.getElementById('count-present').innerHTML = res.data.present;
            document.getElementById('count-absent').innerHTML = res.data.absent;
        });
    };

    const addLoadingCheckbox = (checkbox) => {
        checkbox.disabled = true;

        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        const tmp = label.innerHTML;
        label.innerHTML = `<div class="spinner-border spinner-border-sm m-0 p-0" style="height: 0.8rem; width: 0.8rem" role="status"></div> ${tmp}`;

        return {
            restore: () => {
                label.innerHTML = tmp;
                checkbox.disabled = false;
            },
        };
    };

    const addLoadingButton = (button) => {
        button.disabled = true;
        const tmp = button.innerHTML;
        button.innerHTML = `<div class="spinner-border spinner-border-sm m-0 p-0" style="height: 0.8rem; width: 0.8rem" role="status"></div> ${tmp}`;

        return {
            restore: () => {
                button.disabled = false;
                button.innerHTML = tmp;
            },
        };
    };

    const changeFilterBadWord = async (checkbox) => {
        const label = addLoadingCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(token.get('token')).
            body({
                filter: Boolean(checkbox.checked)
            }).
            then();

        label.restore();
    };

    const replyComment = async (checkbox) => {
        const label = addLoadingCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(token.get('token')).
            body({
                can_reply: Boolean(checkbox.checked)
            }).
            then();

        label.restore();
    };

    const editComment = async (checkbox) => {
        const label = addLoadingCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(token.get('token')).
            body({
                can_edit: Boolean(checkbox.checked)
            }).
            then();

        label.restore();
    };

    const deleteComment = async (checkbox) => {
        const label = addLoadingCheckbox(checkbox);

        await request(HTTP_PATCH, '/api/user').
            token(token.get('token')).
            body({
                can_delete: Boolean(checkbox.checked)
            }).
            then();

        label.restore();
    };

    const regenerate = async (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const btn = addLoadingButton(button);

        await request(HTTP_PUT, '/api/key').
            token(token.get('token')).
            then((res) => {
                if (res.data.status) {
                    getUserDetail();
                }
            });

        btn.restore();
    };

    const changePassword = async (button) => {
        const old = document.getElementById('old_password');
        const newest = document.getElementById('new_password');

        if (old.value.length == 0 || newest.value.length == 0) {
            alert('Password cannot be empty');
            return;
        }

        old.disabled = true;
        newest.disabled = true;

        const btn = addLoadingButton(button);

        const result = await request(HTTP_PATCH, '/api/user').
            token(token.get('token')).
            body({
                old_password: old.value,
                new_password: newest.value,
            }).
            then((res) => {
                if (res.data.status) {
                    old.value = null;
                    newest.value = null;
                    alert('Success change password');
                }

                return res.data.status;
            });

        btn.restore();

        old.disabled = false;
        newest.disabled = false;

        if (result) {
            button.disabled = true;
        }
    };

    const changeName = async (button) => {
        const name = document.getElementById('form-name');

        if (name.value.length == 0) {
            alert('Name cannot be empty');
            return;
        }

        name.disabled = true;

        const btn = addLoadingButton(button);

        const result = await request(HTTP_PATCH, '/api/user').
            token(token.get('token')).
            body({
                name: name.value,
            }).
            then((res) => {
                if (res.data.status) {
                    getUserDetail();
                    alert('Success change name');
                }

                return res.data.status;
            });

        name.disabled = false;

        btn.restore();

        if (result) {
            button.disabled = true;
        }
    };

    const download = async (button) => {
        const btn = addLoadingButton(button);

        const res = await request(HTTP_GET, '/api/download').token(token.get('token')).download();
        const data = await res?.blob();
        const filename = res?.headers.get('content-disposition')?.match(/(?<=")(?:\\.|[^"\\])*(?=")/)[0];

        const link = document.createElement('a');
        const href = window.URL.createObjectURL(data);

        link.href = href;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(href);
        btn.restore();
    };

    const enableButtonName = () => {
        const btn = document.getElementById('button-change-name');
        if (btn.disabled) {
            btn.disabled = false;
        }
    };

    const enableButtonPassword = () => {
        const btn = document.getElementById('button-change-password');
        const old = document.getElementById('old_password');

        if (btn.disabled && old.value.length !== 0) {
            btn.disabled = false;
        }
    };

    const copyAccessKey = async (button) => {
        try {
            await navigator.clipboard.writeText(user.get('access_key'));
        } catch (err) {
            alert('Failed to copy access key');
            return;
        }

        button.disabled = true;
        let tmp = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i>';

        let clear = null;
        clear = setTimeout(() => {
            button.disabled = false;
            button.innerHTML = tmp;

            clearTimeout(clear);
            clear = null;
            return;
        }, 1500);
    };

    return {
        getUserDetail,
        getStatUser,
        changeFilterBadWord,
        replyComment,
        editComment,
        deleteComment,
        regenerate,
        changePassword,
        download,
        changeName,
        enableButtonName,
        enableButtonPassword,
        copyAccessKey
    };
})();