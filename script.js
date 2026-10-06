/* LTC Verification System + i18n */
(function() {
    'use strict';

    const HUB_URL = 'https://lt-c.iddns.ir/';
    const AUTO_SECONDS = 8;
    const MAIN_LINKS = [
        { href: 'https://lt-c.iddns.ir/', fa: 'هاب اصلی', en: 'Main hub' },
        { href: 'https://mhmahdavi1391.github.io/yelo/', fa: 'YELO Music', en: 'YELO Music' },
        { href: 'https://mhmahdavi1391.github.io/VR/', fa: 'کتابخانه VR', en: 'VR library' },
        { href: 'https://t.me/ltc_3d', fa: 'پرینت سه‌بعدی', en: '3D printing' },
        { href: 'https://lt-c.iddns.ir/n.html', fa: 'نظرسنجی', en: 'Survey' },
        { href: 'https://lt-c.iddns.ir/#about', fa: 'معرفی', en: 'About' }
    ];

    const I18N = {
        fa: {
            brand_sub: 'سیستم تأیید اصالت',
            loading: 'در حال بررسی شناسه ...',
            verified_by: '🔒 تأیید شده توسط LTC',
            id_label: 'شناسه',
            copy_id: 'کپی شناسه',
            invalid_id_title: 'شناسه نامعتبر',
            invalid_id_msg: 'لطفاً یک شناسه معتبر وارد کنید.',
            db_error_title: 'پایگاه داده در دسترس نیست',
            db_error_msg: 'امکان بارگذاری اطلاعات وجود ندارد. لطفاً بعداً تلاش کنید.',
            no_id_title: 'شناسه یافت نشد',
            no_id_msg: 'لطفاً از طریق لینک معتبر وارد شوید.',
            error_default: 'خطا',
            error_generic: 'مشکلی پیش آمده است.',
            status_valid: 'VERIFIED ✅',
            status_expired: 'EXPIRED ⚠️',
            status_invalid: 'INVALID ❌',
            hub_link: 'هاب اصلی LTC',
            hub_stay: 'ماندن در این صفحه',
            hub_note: 'اگر کلیک نکنید، {n} ثانیه دیگر هاب اصلی باز می‌شود.',
            hub_cancelled: 'باز شدن خودکار لغو شد. می‌توانید لینک ها را خودتان باز کنید.'
        },
        en: {
            brand_sub: 'Authenticity verification system',
            loading: 'Checking ID ...',
            verified_by: '🔒 Verified by LTC',
            id_label: 'ID',
            copy_id: 'Copy ID',
            invalid_id_title: 'Invalid ID',
            invalid_id_msg: 'Please enter a valid ID.',
            db_error_title: 'Database unavailable',
            db_error_msg: 'Could not load data. Please try again later.',
            no_id_title: 'ID not found',
            no_id_msg: 'Please open this page via a valid link.',
            error_default: 'Error',
            error_generic: 'Something went wrong.',
            status_valid: 'VERIFIED ✅',
            status_expired: 'EXPIRED ⚠️',
            status_invalid: 'INVALID ❌',
            hub_link: 'LTC main hub',
            hub_stay: 'Stay on this page',
            hub_note: 'If you do not click, the main hub opens in {n} seconds.',
            hub_cancelled: 'Auto-open cancelled. You can open the links yourself.'
        }
    };

    let lang = localStorage.getItem('ltc_lang') || 'fa';
    let autoLeft = AUTO_SECONDS;
    let autoTimer = null;
    let autoCancelled = false;

    function t(key) { return (I18N[lang] || I18N.fa)[key] || key; }

    function applyStaticI18n() {
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            const key = el.getAttribute('data-i18n');
            if (key === 'hub_note') return;
            if (I18N[lang] && I18N[lang][key]) el.textContent = I18N[lang][key];
        });
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        document.querySelectorAll('#langToggle button').forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
        renderHubLinks();
        updateHubNote();
    }

    const $ = (sel) => document.querySelector(sel);
    const loadingState = $('#loadingState');
    const resultState = $('#resultState');
    const errorState = $('#errorState');
    const statusBadge = $('#statusBadge');
    const statusLabel = $('#statusLabel');
    const detailList = $('#detailList');
    const errorTitle = $('#errorTitle');
    const errorMessage = $('#errorMessage');
    const card = $('#card');
    const hubNote = $('#hubNote');
    const hubLinks = $('#hubLinks');
    const hubStay = $('#hubStay');

    function getParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    function safeText(str) {
        if (str === null || str === undefined) return '—';
        return String(str).trim() || '—';
    }

    function renderDetails(data, id) {
        const rows = [];
        rows.push({ label: t('id_label'), value: id, isId: true });
        const excluded = ['valid'];
        for (const [key, val] of Object.entries(data)) {
            if (excluded.includes(key)) continue;
            rows.push({ label: key, value: safeText(val), isId: false });
        }
        detailList.innerHTML = '';
        rows.forEach(row => {
            const div = document.createElement('div');
            div.className = 'detail-row';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = row.label;
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            if (row.isId) valueSpan.classList.add('id-value');
            valueSpan.textContent = row.value;
            if (row.isId) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.setAttribute('aria-label', t('copy_id'));
                copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                copyBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const text = row.value;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).catch(function(){});
                    }
                });
                valueSpan.appendChild(copyBtn);
            }
            div.appendChild(labelSpan);
            div.appendChild(valueSpan);
            detailList.appendChild(div);
        });
    }

    function setStatus(type, label) {
        statusBadge.className = 'status-badge ' + type;
        statusLabel.textContent = label;
    }

    function showError(title, msg) {
        loadingState.classList.add('hidden');
        resultState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorTitle.textContent = title;
        errorMessage.textContent = msg;
        card.classList.remove('state-invalid', 'state-expired');
    }

    function showResult(status, data, id) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        resultState.classList.remove('hidden');
        if (status === 'valid') {
            setStatus('valid', t('status_valid'));
            card.classList.remove('state-invalid', 'state-expired');
        } else if (status === 'expired') {
            setStatus('expired', t('status_expired'));
            card.classList.add('state-expired');
            card.classList.remove('state-invalid');
        } else {
            setStatus('invalid', t('status_invalid'));
            card.classList.add('state-invalid');
            card.classList.remove('state-expired');
        }
        if (data && typeof data === 'object') renderDetails(data, id);
        else detailList.innerHTML = '';
    }

    function updateHubNote() {
        if (!hubNote) return;
        if (autoCancelled) {
            hubNote.textContent = t('hub_cancelled');
            return;
        }
        hubNote.textContent = t('hub_note').replace('{n}', String(autoLeft));
    }

    function renderHubLinks() {
        if (!hubLinks) return;
        hubLinks.innerHTML = '';
        MAIN_LINKS.forEach(function(item) {
            const a = document.createElement('a');
            a.className = 'hub-chip';
            a.href = item.href;
            a.textContent = lang === 'en' ? item.en : item.fa;
            a.addEventListener('click', cancelAutoOpen);
            hubLinks.appendChild(a);
        });
    }

    function cancelAutoOpen() {
        if (autoCancelled) return;
        autoCancelled = true;
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
        if (hubStay) hubStay.classList.add('hidden');
        updateHubNote();
    }

    function startAutoOpen() {
        const hubLink = $('#hubLink');
        if (hubLink) hubLink.addEventListener('click', cancelAutoOpen);
        if (hubStay) hubStay.addEventListener('click', cancelAutoOpen);
        renderHubLinks();
        updateHubNote();
        autoTimer = setInterval(function() {
            autoLeft -= 1;
            if (autoLeft <= 0) {
                clearInterval(autoTimer);
                autoTimer = null;
                if (!autoCancelled) window.location.assign(HUB_URL);
                return;
            }
            updateHubNote();
        }, 1000);
    }

    async function verify(id) {
        if (!id || id.trim() === '') {
            showError(t('invalid_id_title'), t('invalid_id_msg'));
            return;
        }
        const cleanId = id.trim();
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const db = await response.json();
            if (!db || typeof db !== 'object') throw new Error('Invalid database format');
            const record = db[cleanId];
            if (!record) {
                showResult('invalid', null, cleanId);
                return;
            }
            if (record.valid === true) showResult('valid', record, cleanId);
            else showResult('expired', record, cleanId);
        } catch (err) {
            console.error('Verification error:', err);
            showError(t('db_error_title'), t('db_error_msg'));
        }
    }

    function init() {
        applyStaticI18n();
        startAutoOpen();
        document.querySelectorAll('#langToggle button').forEach(function(btn) {
            btn.addEventListener('click', function() {
                lang = btn.getAttribute('data-lang');
                localStorage.setItem('ltc_lang', lang);
                applyStaticI18n();
                const id = getParam('id');
                if (id && id.trim() !== '') verify(id.trim());
                else {
                    loadingState.classList.add('hidden');
                    errorState.classList.remove('hidden');
                    errorTitle.textContent = t('no_id_title');
                    errorMessage.textContent = t('no_id_msg');
                }
            });
        });

        const id = getParam('id');
        if (id && id.trim() !== '') {
            verify(id.trim());
        } else {
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            errorTitle.textContent = t('no_id_title');
            errorMessage.textContent = t('no_id_msg');
            card.classList.remove('state-invalid', 'state-expired');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
