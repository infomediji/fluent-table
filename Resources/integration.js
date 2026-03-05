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

    document.addEventListener('flt:filters-open', ({ detail }) => {
        const { tableId, filters, values } = detail;
        currentTableId = tableId;

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
    });

    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('flt:filters-reset', {
            detail: { tableId: currentTableId },
        }));
        BS?.Offcanvas?.getInstance(offcanvasEl)?.hide();
    });

})();