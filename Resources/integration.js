/**
 * FluentTable — integration helpers.
 *
 * - Connects UIUpdater (optional) to flt:loading / flt:loading-done events
 * - Offcanvas filter panel adapter — works with Bootstrap or Tabler
 *
 * Include AFTER table.js. Do NOT call FilterPanel.init() on pages that use this file.
 */
(function () {

    // -------------------------------------------------------------------------
    // UIUpdater bridge (optional — only runs if window.UIUpdater exists)
    // -------------------------------------------------------------------------

    document.addEventListener('flt:loading',      () => window.UIUpdater?.start());
    document.addEventListener('flt:loading-done', () => window.UIUpdater?.end(true));

    // First load fires flt:loading before this script is registered.
    // Catch tables already loading by checking aria-busy on their wrappers.
    document.querySelectorAll('.card-table[aria-busy="true"]').forEach(() => {
        window.UIUpdater?.start();
    });

    // -------------------------------------------------------------------------
    // Offcanvas filter panel
    // -------------------------------------------------------------------------

    const offcanvasEl = document.getElementById('tableFilters');
    const panelEl     = document.getElementById('filterPanel');
    if (!offcanvasEl || !panelEl) return;

    /** Works with Bootstrap or Tabler (which re-exports Bootstrap under window.tabler) */
    const BS = window.tabler ?? window.bootstrap;
    if (!BS?.Offcanvas) {
        console.warn('[FluentTable] integration.js: Bootstrap or Tabler not found — offcanvas filters will not work.');
        return;
    }

    let currentTableId = null;
    /** Filter definitions from last flt:filters-loaded — used for label lookup in active bar */
    let knownFilters = [];

    // -------------------------------------------------------------------------
    // Active filters bar
    // -------------------------------------------------------------------------

    function renderActiveBar(tableId, values) {
        const bar = document.getElementById(`${tableId}-active-filters`);
        if (!bar) return;

        const active = knownFilters
            .map(f => ({ f, val: values[f.param] }))
            .filter(({ val }) => val !== '' && val !== null && val !== undefined);

        if (!active.length) {
            bar.classList.add('d-none');
            bar.innerHTML = '';
            return;
        }

        bar.classList.remove('d-none');
        const wrap = document.createElement('div');
        wrap.className = 'card-body py-2 border-bottom d-flex flex-wrap gap-2';

        active.forEach(({ f, val }) => {
            const opt   = (f.options || []).find(o => String(o.value) === String(val));
            const label = opt ? opt.label : val;

            const badge     = document.createElement('span');
            badge.className = 'badge bg-blue-lt d-flex align-items-center gap-1';

            const text       = document.createElement('span');
            text.textContent = `${f.label}: ${label}`;

            const btn     = document.createElement('button');
            btn.type      = 'button';
            btn.className = 'btn-close btn-close-sm ms-1';
            btn.setAttribute('aria-label', `Remove ${f.label} filter`);
            btn.addEventListener('click', () => {
                const next = { ...values, [f.param]: '' };
                renderActiveBar(tableId, next);
                document.dispatchEvent(new CustomEvent('flt:filters-apply', {
                    detail: { tableId, values: next },
                }));
            });

            badge.append(text, btn);
            wrap.appendChild(badge);
        });

        bar.innerHTML = '';
        bar.appendChild(wrap);
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    document.addEventListener('flt:filters-loaded', ({ detail }) => {
        const { tableId, filters, values } = detail;
        currentTableId = tableId;
        knownFilters   = filters;
        renderActiveBar(tableId, values);
    });

    document.addEventListener('flt:filters-open', ({ detail }) => {
        const { tableId, filters, values } = detail;
        currentTableId = tableId;
        knownFilters   = filters;

        panelEl.innerHTML = '';

        filters.forEach(f => {
            const wrap     = document.createElement('div');
            wrap.className = 'mb-3';

            const label       = document.createElement('label');
            label.className   = 'form-label';
            label.textContent = f.label;

            const select             = document.createElement('select');
            select.className         = 'form-select';
            select.dataset.filterKey = f.param;

            const placeholder       = document.createElement('option');
            placeholder.value       = '';
            placeholder.textContent = '— All —';
            select.appendChild(placeholder);

            (f.options || []).forEach(o => {
                const opt       = document.createElement('option');
                opt.value       = o.value;
                opt.textContent = o.count !== undefined ? `${o.label} (${o.count})` : o.label;
                if (String(values[f.param] ?? '') === String(o.value)) opt.selected = true;
                select.appendChild(opt);
            });

            wrap.append(label, select);
            panelEl.appendChild(wrap);
        });

        BS?.Offcanvas?.getOrCreateInstance(offcanvasEl)?.show();
    });

    document.getElementById('applyFilters')?.addEventListener('click', () => {
        const values = {};
        panelEl.querySelectorAll('[data-filter-key]').forEach(el => {
            values[el.dataset.filterKey] = el.value;
        });
        document.dispatchEvent(new CustomEvent('flt:filters-apply', {
            detail: { tableId: currentTableId, values },
        }));
        BS?.Offcanvas?.getInstance(offcanvasEl)?.hide();
        renderActiveBar(currentTableId, values);
    });

    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('flt:filters-reset', {
            detail: { tableId: currentTableId },
        }));
        BS?.Offcanvas?.getInstance(offcanvasEl)?.hide();
        renderActiveBar(currentTableId, {});
    });

})();