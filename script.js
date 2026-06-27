/* ================================================================
   SCRIPT.JS – کاملاً ماژولار، بدون وابستگی
   ================================================================ */

(function() {
    'use strict';

    // ---------- DOM refs ----------
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

    // ---------- Helpers ----------
    function getParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    function safeText(str) {
        if (str === null || str === undefined) return '—';
        return String(str).trim() || '—';
    }

    // ---------- Render detail rows ----------
    function renderDetails(data, id) {
        const rows = [];

        // ID row
        rows.push({
            label: 'شناسه',
            value: id,
            isId: true
        });

        // all other fields except 'valid'
        const excluded = ['valid'];
        for (const [key, val] of Object.entries(data)) {
            if (excluded.includes(key)) continue;
            rows.push({
                label: key,
                value: safeText(val),
                isId: false
            });
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
            if (row.isId) {
                valueSpan.classList.add('id-value');
            }
            valueSpan.textContent = row.value;

            if (row.isId) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.setAttribute('aria-label', 'کپی شناسه');
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                `;
                copyBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const text = row.value;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(() => {
                            this.classList.add('copied');
                            this.innerHTML = `
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            `;
                            setTimeout(() => {
                                this.classList.remove('copied');
                                this.innerHTML = `
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                `;
                            }, 1800);
                        }).catch(() => fallbackCopy(text));
                    } else {
                        fallbackCopy(text);
                    }
                });
                valueSpan.appendChild(copyBtn);
            }

            div.appendChild(labelSpan);
            div.appendChild(valueSpan);
            detailList.appendChild(div);
        });
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
        } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    // ---------- Set status ----------
    function setStatus(type, label) {
        statusBadge.className = 'status-badge ' + type;
        statusLabel.textContent = label;
    }

    // ---------- Show error ----------
    function showError(title, msg) {
        loadingState.classList.add('hidden');
        resultState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorTitle.textContent = title;
        errorMessage.textContent = msg;
        card.classList.remove('state-invalid', 'state-expired');
    }

    // ---------- Show result ----------
    function showResult(status, data, id) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        resultState.classList.remove('hidden');

        if (status === 'valid') {
            setStatus('valid', 'VERIFIED ✅');
            card.classList.remove('state-invalid', 'state-expired');
        } else if (status === 'expired') {
            setStatus('expired', 'EXPIRED ⚠️');
            card.classList.add('state-expired');
            card.classList.remove('state-invalid');
        } else {
            setStatus('invalid', 'INVALID ❌');
            card.classList.add('state-invalid');
            card.classList.remove('state-expired');
        }

        if (data && typeof data === 'object') {
            renderDetails(data, id);
        } else {
            detailList.innerHTML = '';
        }
    }

    // ---------- Main verification ----------
    async function verify(id) {
        if (!id || id.trim() === '') {
            showError('شناسه نامعتبر', 'لطفاً یک شناسه معتبر وارد کنید.');
            return;
        }

        const cleanId = id.trim();

        try {
            const response = await fetch('database.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const db = await response.json();

            if (!db || typeof db !== 'object') {
                throw new Error('Invalid database format');
            }

            const record = db[cleanId];

            if (!record) {
                showResult('invalid', null, cleanId);
                return;
            }

            const isValid = record.valid === true;
            if (isValid) {
                showResult('valid', record, cleanId);
            } else {
                showResult('expired', record, cleanId);
            }

        } catch (err) {
            console.error('Verification error:', err);
            showError('پایگاه داده در دسترس نیست', 'امکان بارگذاری اطلاعات وجود ندارد. لطفاً بعداً تلاش کنید.');
        }
    }

    // ---------- Init ----------
    function init() {
        const id = getParam('id');
        if (id && id.trim() !== '') {
            verify(id.trim());
        } else {
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
            errorTitle.textContent = 'شناسه یافت نشد';
            errorMessage.textContent = 'لطفاً از طریق لینک معتبر وارد شوید.';
            card.classList.remove('state-invalid', 'state-expired');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
