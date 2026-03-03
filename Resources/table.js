/**
 * FluentTable — vanilla JS table engine.
 * No dependencies. Works with { data: [], meta: { pagination: {} } } endpoints.
 */
(function () {
    'use strict';

    // Helpers

    function esc(str) {
        return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escAttr(str) {
        return esc(str).replace(/'/g, '&#39;');
    }

    function dash(alt) {
        return `<span class="text-muted">${esc(alt ?? '—')}</span>`;
    }

    /** Dot-notation accessor: dig(row, 'file.size') — blocks prototype keys */
    const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
    function dig(obj, path) {
        if (!path) return obj;
        return path.split('.').reduce((cur, key) => {
            if (BLOCKED_KEYS.has(key)) return undefined;
            return cur?.[key];
        }, obj);
    }

    /**
     * Replace {field.path} placeholders with row data.
     * Optional transform fn is applied to each substituted value.
     */
    function resolve(template, row, transform) {
        return String(template).replace(/\{([^}]+)\}/g, (_, path) => {
            const val = dig(row, path);
            if (val === undefined || val === null) return '';
            const s = String(val);
            return transform ? transform(s) : s;
        });
    }

    /** resolve() with html-escaping of substituted values */
    function resolveEsc(template, row) {
        return resolve(template, row, esc);
    }

    /** Allow only safe URL schemes (allowlist approach) */
    function safeUrl(url) {
        const trimmed = String(url).trim();
        if (!trimmed) return '';
        if (/^https?:/i.test(trimmed) || /^[\/\.#?]/.test(trimmed) || !trimmed.includes(':')) return trimmed;
        return '';
    }

    /** Same as resolve() but for every string value in a payload object */
    function resolvePayload(payload, row) {
        const result = {};
        for (const [key, val] of Object.entries(payload)) {
            result[key] = typeof val === 'string' ? resolve(val, row) : val;
        }
        return result;
    }

    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function el(id) {
        return document.getElementById(id);
    }

    function buildUrl(base, params) {
        const sep = base.includes('?') ? '&' : '?';
        const str = params.toString();
        return str ? base + sep + str : base;
    }

    /** Read CSRF token from <meta name="csrf-token"> — fresh read each time to support token rotation */
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
    }

    function isSameOrigin(url) {
        try { return new URL(url, location.href).origin === location.origin; }
        catch { return false; }
    }

    async function postJson(url, data, extraHeaders) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...extraHeaders,
        };
        if (isSameOrigin(url)) {
            const csrf = getCsrfToken();
            if (csrf) headers['X-CSRF-Token'] = csrf;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (res.status === 204) return null;
        const text = await res.text();
        let body = null;
        if (text) {
            try { body = JSON.parse(text); } catch { body = null; }
        }
        if (!res.ok) {
            const err = new Error(`HTTP ${res.status}`);
            err.status = res.status;
            err.body = body;
            throw err;
        }
        return body;
    }

    function toast(type, message) {
        if (window.showToast) window.showToast(type, message);
    }

    /**
     * Token-based date formatter. Replaces known tokens one at a time
     * so that letters inside month names or other tokens don't get mangled.
     */
    function formatDate(d, format) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const pad = (n) => String(n).padStart(2, '0');

        const tokens = {
            'Y': () => String(d.getFullYear()),
            'M': () => months[d.getMonth()],
            'm': () => pad(d.getMonth() + 1),
            'n': () => String(d.getMonth() + 1),
            'd': () => pad(d.getDate()),
            'j': () => String(d.getDate()),
            'H': () => pad(d.getHours()),
            'i': () => pad(d.getMinutes()),
            's': () => pad(d.getSeconds()),
        };

        // Replace each known token with a unique placeholder first,
        // then swap placeholders with actual values. This prevents
        // tokens from matching inside already-substituted text.
        // Uses split/join to replace ALL occurrences of each token.
        let result = format;
        const values = [];
        for (const [token, fn] of Object.entries(tokens)) {
            if (result.includes(token)) {
                const val = fn();
                const placeholder = '\x00' + values.length + '\x00';
                values.push(val);
                result = result.split(token).join(placeholder);
            }
        }
        return result.replace(/\x00(\d+)\x00/g, (_, i) => values[Number(i)]);
    }

    /** Convert PHP date tokens to AirDatepicker format tokens */
    function phpToAirFormat(fmt) {
        return fmt.replace(/Y/g, 'yyyy').replace(/m/g, 'MM').replace(/n/g, 'M')
            .replace(/d/g, 'dd').replace(/j/g, 'd').replace(/H/g, 'HH')
            .replace(/i/g, 'mm').replace(/s/g, 'ss');
    }

    function tabler(icon, extraClass = '') {
        return `<i class="ti ti-${esc(icon)}${extraClass ? ' ' + esc(extraClass) : ''}"></i>`;
    }

    /** Build data-* attributes string from { attr: fieldPath } map */
    function buildDataAttrs(fields, row) {
        if (!fields) return '';
        return Object.entries(fields).map(([attr, field]) =>
            `data-${escAttr(attr)}="${escAttr(String(dig(row, field) ?? ''))}"`
        ).join(' ');
    }

    /** Build tooltip attribute string (title + data-bs-toggle) */
    function tooltipAttr(cfg) {
        return cfg.tooltip ? ` title="${escAttr(cfg.tooltip)}" data-bs-toggle="tooltip"` : '';
    }

    /** Cached Intl.NumberFormat instances by locale|currency */
    const numberFormatCache = new Map();
    function getNumberFormat(locale, currency) {
        const key = `${locale}|${currency}`;
        let fmt = numberFormatCache.get(key);
        if (!fmt) {
            fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
            numberFormatCache.set(key, fmt);
        }
        return fmt;
    }

    // Cast renderers — each takes (value, castConfig, row) and returns HTML.
    // Register custom ones via FluentTable.renderers['my-type'] = (v, cfg, row) => '...'

    const renderers = {

        text(value, cfg) {
            if (value === null || value === undefined || value === '') {
                return dash(cfg.placeholder);
            }
            return esc(String(value));
        },

        badge(value, cfg) {
            if (value === null || value === undefined) {
                return dash();
            }
            const color = cfg.map?.[value] ?? cfg.default ?? 'secondary';
            return `<span class="badge bg-${esc(color)}-lt">${esc(String(value))}</span>`;
        },

        date(value, cfg) {
            if (value === null || value === undefined || value === '') return dash();
            const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
            if (isNaN(d)) return esc(String(value));
            return esc(formatDate(d, cfg.format || 'd M Y'));
        },

        price(value, cfg) {
            if (value === null || value === undefined) return dash();
            return esc(getNumberFormat(cfg.locale || 'en-US', cfg.currency || 'USD').format(Number(value)));
        },

        filesize(value, cfg) {
            if (value === null || value === undefined) return dash();
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let size = Number(value), i = 0;
            while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
            return esc(`${size.toFixed(cfg.decimals ?? 1)} ${units[i]}`);
        },

        icon(value, cfg) {
            const name = cfg.icon || cfg.map?.[value];
            if (!name) return '';
            const colorClass = cfg.color ? ` text-${cfg.color}` : '';
            return tabler(name, colorClass);
        },

        tags(value, cfg) {
            if (!Array.isArray(value) || !value.length) return dash();
            return value.map(item => {
                const label = cfg.labelField ? (item?.[cfg.labelField] ?? item) : item;
                return `<span class="badge bg-${esc(cfg.color || 'secondary')}-lt me-1 mb-1">${esc(String(label))}</span>`;
            }).join('');
        },

        image(value, cfg) {
            if (!value) return dash();
            const src = safeUrl(String(value));
            if (!src) return dash();
            const rounded = cfg.rounded ? ' rounded-circle' : ' rounded';
            return `<img src="${escAttr(src)}" alt="${escAttr(cfg.alt || '')}" style="width:${esc(cfg.width||'48px')};height:${esc(cfg.height||'48px')};object-fit:cover" class="${rounded}" loading="lazy">`;
        },

        link(value, cfg, row) {
            if (!cfg.url) return esc(String(value ?? '—'));
            const href = safeUrl(resolve(cfg.url, row));
            const label = cfg.label ? resolveEsc(cfg.label, row) : esc(String(value ?? '—'));
            const target = cfg.blank ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${escAttr(href)}"${target}>${label}</a>`;
        },

        'clickable-tags'(value, cfg, row) {
            if (!Array.isArray(value) || !value.length) return dash();
            return value.map(item => {
                const label = cfg.labelField ? (item?.[cfg.labelField] ?? item) : item;
                const val   = cfg.valueField ? (item?.[cfg.valueField] ?? item) : item;
                const href  = safeUrl(resolve(cfg.url, { ...row, value: val, label }));
                return `<a href="${escAttr(href)}" class="badge bg-${esc(cfg.color||'secondary')}-lt me-1 mb-1 text-decoration-none">${esc(String(label))}</a>`;
            }).join('');
        },

        download(value, cfg, row) {
            const href = safeUrl(cfg.url ? resolve(cfg.url, row) : String(value ?? ''));
            if (!href) return dash();
            return `<a href="${escAttr(href)}" class="btn btn-sm btn-${esc(cfg.style||'ghost-primary')}" download>
                ${tabler('download')} ${esc(cfg.label || 'Download')}
            </a>`;
        },

        button(value, cfg, row) {
            const url     = safeUrl(resolve(cfg.url, row));
            const payload = JSON.stringify(resolvePayload(cfg.payload || {}, row));
            const confirm = cfg.confirm ? ` data-flt-confirm="${escAttr(cfg.confirm)}"` : '';
            return `<button type="button"
                class="btn btn-sm btn-${esc(cfg.style||'ghost-primary')} flt-btn"
                data-url="${escAttr(url)}"
                data-payload='${escAttr(payload)}'
                ${confirm}>
                ${esc(cfg.label)}
            </button>`;
        },

        'icon-button'(value, cfg, row) {
            const url     = safeUrl(resolve(cfg.url, row));
            const payload = JSON.stringify(resolvePayload(cfg.payload || {}, row));
            const confirm = cfg.confirm ? ` data-flt-confirm="${escAttr(cfg.confirm)}"` : '';
            const ariaLabel = ` aria-label="${escAttr(cfg.tooltip || cfg.icon || 'Action')}"`;
            return `<button type="button"
                class="btn btn-sm btn-icon btn-${esc(cfg.style||'ghost-secondary')} flt-btn"
                data-url="${escAttr(url)}"
                data-payload='${escAttr(payload)}'
                ${confirm}${tooltipAttr(cfg)}${ariaLabel}>
                ${tabler(cfg.icon)}
            </button>`;
        },

        'button-group'(value, cfg, row) {
            if (!cfg.buttons?.length) return '';
            const buttons = cfg.buttons.map(b => renderers[b.type]?.(value, b, row) ?? '').join('');
            return `<div class="btn-group btn-group-sm">${buttons}</div>`;
        },

        'modal-button'(value, cfg, row) {
            return `<button type="button"
                class="btn btn-sm btn-${esc(cfg.style||'ghost-primary')}"
                data-bs-toggle="modal"
                data-bs-target="${escAttr(cfg.target)}"
                ${buildDataAttrs(cfg.fields, row)}>
                ${esc(cfg.label)}
            </button>`;
        },

        'modal-text'(value, cfg, row) {
            const label = cfg.label ? resolveEsc(cfg.label, row) : esc(String(value ?? '—'));
            return `<a href="#" role="button"
                data-bs-toggle="modal"
                data-bs-target="${escAttr(cfg.target)}"
                ${buildDataAttrs(cfg.fields, row)}>
                ${label}
            </a>`;
        },

        'modal-icon-button'(value, cfg, row) {
            const tip = cfg.tooltip ? ` title="${escAttr(cfg.tooltip)}"` : '';
            const ariaLabel = cfg.tooltip ? ` aria-label="${escAttr(cfg.tooltip)}"` : (cfg.icon ? ` aria-label="${escAttr(cfg.icon)}"` : '');
            return `<button type="button"
                class="btn btn-sm btn-icon btn-${esc(cfg.style||'ghost-secondary')}"
                data-bs-toggle="modal"
                data-bs-target="${escAttr(cfg.target)}"
                ${buildDataAttrs(cfg.fields, row)}${tip}${ariaLabel}>
                ${tabler(cfg.icon)}
            </button>`;
        },

        select(value, cfg, row) {
            const url = safeUrl(resolve(cfg.url, row));
            const options = Object.entries(cfg.options || {}).map(([val, label]) =>
                `<option value="${escAttr(val)}"${String(val) === String(value) ? ' selected' : ''}>${esc(label)}</option>`
            ).join('');
            return `<select class="form-select form-select-sm flt-select"
                data-url="${escAttr(url)}"
                data-field="${escAttr(cfg.field)}"
                aria-label="${escAttr(cfg.label || cfg.field || 'Select')}"
                ${cfg.optionsFrom ? `data-options-from="${escAttr(cfg.optionsFrom)}"` : ''}>
                ${options}
            </select>`;
        },

        checkbox(value, cfg, row) {
            const checked = String(value) === String(cfg.trueValue ?? true);
            const ro   = cfg.readOnly || !cfg.url;
            const dis  = cfg.disabled;

            let attrs = '';
            if (cfg.url) {
                attrs += ` data-url="${escAttr(safeUrl(resolve(cfg.url, row)))}"`;
                attrs += ` data-field="${escAttr(cfg.field)}"`;
                attrs += ` data-true-value="${escAttr(String(cfg.trueValue ?? true))}"`;
                attrs += ` data-false-value="${escAttr(String(cfg.falseValue ?? false))}"`;
            }
            if (ro || dis) attrs += ' disabled';

            return `<input type="checkbox" class="form-check-input${!ro && !dis ? ' flt-checkbox' : ''}"${attrs}${checked ? ' checked' : ''} aria-label="${escAttr(cfg.label || cfg.field || 'Toggle')}">`;
        },

        datepicker(value, cfg, row) {
            const url     = safeUrl(resolve(cfg.url, row));
            const phpFmt  = cfg.format || 'Y-m-d';
            const airFmt  = phpToAirFormat(phpFmt);
            const display = value ? formatDate(
                typeof value === 'number' ? new Date(value * 1000) : new Date(value),
                phpFmt
            ) : '';
            return `<input type="text"
                class="form-control form-control-sm flt-datepicker"
                data-url="${escAttr(url)}"
                data-field="${escAttr(cfg.field)}"
                data-format="${escAttr(airFmt)}"
                ${cfg.minDate ? `data-min-date="${escAttr(cfg.minDate)}"` : ''}
                ${cfg.maxDate ? `data-max-date="${escAttr(cfg.maxDate)}"` : ''}
                ${cfg.nullable ? 'data-nullable="1"' : ''}
                ${value ? `data-raw-value="${escAttr(String(value))}"` : ''}
                value="${escAttr(display)}"
                aria-label="${escAttr(cfg.label || cfg.field || 'Date')}"
                placeholder="Select date..."
                readonly>`;
        },

        status(value, cfg) {
            if (value === null || value === undefined) return dash();
            const color = cfg.map?.[value] ?? cfg.default ?? 'secondary';
            return `<span class="flt-status-dot bg-${esc(color)}" aria-hidden="true"></span> ${esc(String(value))}`;
        },

        entity(value, cfg, row) {
            const title    = resolveEsc(cfg.title, row);
            const subtitle = cfg.subtitle ? resolveEsc(cfg.subtitle, row) : '';
            const avatarUrl = cfg.avatar ? safeUrl(resolve(cfg.avatar, row)) : '';
            const size = cfg.avatarSize || '32px';

            let avatarHtml = '';
            if (avatarUrl) {
                avatarHtml = `<span class="flt-entity-avatar me-2" role="img" aria-label="${escAttr(title)}" style="width:${esc(size)};height:${esc(size)};background-image:url(&quot;${escAttr(avatarUrl)}&quot;)"></span>`;
            }

            let subtitleHtml = '';
            if (subtitle) {
                subtitleHtml = `<div class="flt-entity-subtitle">${subtitle}</div>`;
            }

            return `<div class="flt-entity">
                ${avatarHtml}
                <div class="flt-entity-body">
                    <div class="flt-entity-title">${title}</div>
                    ${subtitleHtml}
                </div>
            </div>`;
        },

        'muted-text'(value, cfg) {
            if (value === null || value === undefined || value === '') {
                return dash(cfg.placeholder);
            }
            return `<span class="text-secondary">${esc(String(value))}</span>`;
        },

        hidden() {
            return '';
        },
    };

    // State per table instance

    const instances = new Map();

    function createState(config) {
        const urlSearch = new URLSearchParams(window.location.search).get(`search_${config.id}`) || new URLSearchParams(window.location.search).get('search') || '';

        const filterValues = {};
        (config.filters || []).forEach(f => { filterValues[f.param] = f.value ?? ''; });

        // Restore perPage from localStorage if valid
        let perPage = config.pageSizes?.[0] ?? 20;
        try {
            const savedPerPage = localStorage.getItem('flt-perPage-' + config.id);
            if (savedPerPage && (config.pageSizes || []).includes(Number(savedPerPage))) {
                perPage = Number(savedPerPage);
            }
        } catch (_) { /* Safari private mode */ }

        const visibleColumns = config.columns.filter(c =>
            (c.cast?.type ?? '') !== 'hidden' && !c.hidden
        );

        return {
            config,
            visibleColumns,
            page:         1,
            rows:         [],
            filterValues,
            panelFilterValues: {},
            remoteFilters: [],
            perPage,
            search:  urlSearch,
            sortCol: config.defaultSort?.col ?? null,
            sortDir: config.defaultSort?.dir ?? 'asc',
            abortController: null,
        };
    }

    // Loading overlay

    function setLoading(id, on) {
        const loader = el(`${id}-loader`);
        const wrap = el(`${id}-wrap`);
        if (loader) {
            loader.style.visibility = on ? 'visible' : 'hidden';
            loader.setAttribute('aria-busy', String(on));
            const loaderText = loader.querySelector('.flt-loader-text');
            if (loaderText) loaderText.textContent = on ? 'Loading data…' : '';
        }
        if (wrap) wrap.setAttribute('aria-busy', String(on));
        if (window.UIUpdater) {
            on ? UIUpdater.start() : UIUpdater.end(true);
        }
    }

    // Fetch data and render

    async function load(id) {
        const state = instances.get(id);
        if (!state) return;

        // Abort any in-flight request to prevent race conditions
        if (state.abortController) state.abortController.abort();
        state.abortController = new AbortController();
        const { signal } = state.abortController;

        const { config, page, perPage, search, sortCol, sortDir } = state;
        setLoading(id, true);
        document.dispatchEvent(new CustomEvent('flt:loading', { detail: { tableId: id } }));

        const params = new URLSearchParams({ page, perPage });
        if (search)  params.set('search', search);
        if (sortCol) { params.set('sortCol', sortCol); params.set('sortDir', sortDir); }

        // Tell the backend which fields are searchable
        config.columns
            .filter(c => c.searchable)
            .forEach(c => params.append('searchFields[]', c.searchField || c.field));

        // Quick (header dropdown) + panel (offcanvas) filters
        for (const obj of [state.filterValues, state.panelFilterValues]) {
            for (const [key, val] of Object.entries(obj || {})) {
                if (val !== '' && val !== null && val !== undefined) {
                    params.set(key, val);
                }
            }
        }

        const fetchHeaders = { 'X-Requested-With': 'XMLHttpRequest' };
        if (config.headers) Object.assign(fetchHeaders, config.headers);

        try {
            const res  = await fetch(buildUrl(config.endpoint, params), {
                headers: fetchHeaders,
                signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            const rows       = json.data ?? [];
            const pagination = json.meta?.pagination ?? {};
            if (!json.meta?.pagination && json.meta) {
                console.warn('[FluentTable] Expected json.meta.pagination, falling back to empty pagination.');
            }

            // Store remote filter definitions from backend
            if (json.meta?.filters) {
                state.remoteFilters = json.meta.filters;
                document.dispatchEvent(new CustomEvent('flt:filters-loaded', {
                    detail: { tableId: id, filters: state.remoteFilters, values: state.panelFilterValues },
                }));
            }

            if (signal.aborted) return;

            state.rows = rows;
            renderRows(id, rows);
            renderPagination(id, pagination);

            document.dispatchEvent(new CustomEvent('flt:loaded', {
                detail: { tableId: id, rows, pagination },
            }));

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('[FluentTable]', id, err);
            renderError(id);
            document.dispatchEvent(new CustomEvent('flt:error', {
                detail: { tableId: id, error: err },
            }));
        } finally {
            setLoading(id, false);
        }
    }

    function renderRows(id, rows) {
        const state  = instances.get(id);
        const tbody  = el(`${id}-tbody`);
        const empty  = el(`${id}-empty`);
        if (!tbody) return;

        if (!rows.length) {
            tbody.innerHTML = '';
            empty?.classList.remove('d-none');
            return;
        }

        empty?.classList.add('d-none');

        // Save focused element info for focus restoration after re-render
        const activeEl = document.activeElement;
        let focusInfo = null;
        if (activeEl && tbody.contains(activeEl)) {
            focusInfo = {
                tag: activeEl.tagName,
                className: activeEl.className,
                rowIdx: activeEl.closest('tr')?.dataset.fltRowIdx,
                cellIdx: activeEl.closest('td') ? Array.from(activeEl.closest('tr')?.children || []).indexOf(activeEl.closest('td')) : -1,
            };
        }

        // Dispose existing Bootstrap tooltips before replacing HTML
        if (window.bootstrap?.Tooltip) {
            tbody.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                bootstrap.Tooltip.getInstance(el)?.dispose();
            });
        }

        // Dispose existing AirDatepicker instances before replacing HTML
        tbody.querySelectorAll('.flt-datepicker').forEach(input => {
            if (input._adp) input._adp.destroy();
        });

        const visible = state.visibleColumns;

        const bulkField = state.config.bulkField;
        const expandMode = state.config.expandable; // 'row', 'button', or falsy

        tbody.innerHTML = rows.map((row, idx) => {
            const rowId = bulkField ? String(dig(row, bulkField) ?? '') : '';
            const bulkTd = bulkField
                ? `<td><input type="checkbox" class="form-check-input flt-bulk-check" data-table="${esc(id)}" value="${escAttr(rowId)}" aria-label="Select row ${escAttr(rowId)}"></td>`
                : '';
            const cells = visible.map(col => {
                const value   = dig(row, col.field);
                const cast    = col.cast;
                const align   = col.align ? ` class="text-${esc(col.align)}"` : '';
                const content = renderCell(value, cast, row);
                return `<td${align}>${content}</td>`;
            }).join('');
            const expandBtn = expandMode === 'button'
                ? `<td class="w-1"><button type="button" class="btn btn-sm btn-icon btn-ghost-secondary flt-expand-btn" data-flt-row-idx="${idx}" aria-label="Expand row" aria-expanded="false"><i class="ti ti-chevron-down flt-expand-icon"></i></button></td>`
                : '';
            const rowClass = expandMode === 'row' ? ' class="flt-expandable-row" tabindex="0" role="button"' : '';
            const rowIdx = expandMode ? ` data-flt-row-idx="${idx}"` : '';
            return `<tr${rowIdx}${rowClass}>${bulkTd}${cells}${expandBtn}</tr>`;
        }).join('');

        // Reset "select all" checkbox
        const selectAll = document.querySelector(`.flt-select-all[data-table="${id}"]`);
        if (selectAll) selectAll.checked = false;

        // Activate Bootstrap tooltips on freshly rendered elements
        if (window.bootstrap?.Tooltip) {
            tbody.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                new bootstrap.Tooltip(el, { trigger: 'hover' });
            });
        }

        initDatepickers(id, tbody);

        // Restore focus after re-render
        if (focusInfo && focusInfo.rowIdx != null) {
            const tr = tbody.querySelector(`tr[data-flt-row-idx="${focusInfo.rowIdx}"]`);
            if (tr && focusInfo.cellIdx >= 0) {
                const td = tr.children[focusInfo.cellIdx];
                const target = td?.querySelector(focusInfo.tag) || td?.querySelector('input, select, button, a');
                if (target) target.focus();
            }
        }

        // Fetch remote options for selects — deduplicate by URL
        const selectsByUrl = new Map();
        tbody.querySelectorAll('select[data-options-from]').forEach(sel => {
            const url = sel.dataset.optionsFrom;
            if (!url) return;
            if (!selectsByUrl.has(url)) selectsByUrl.set(url, []);
            selectsByUrl.get(url).push(sel);
        });
        for (const [url, selects] of selectsByUrl) {
            if (!safeUrl(url)) continue;
            const optHeaders = { 'X-Requested-With': 'XMLHttpRequest' };
            if (isSameOrigin(url)) {
                const csrf = getCsrfToken();
                if (csrf) optHeaders['X-CSRF-Token'] = csrf;
            }
            fetch(url, { headers: optHeaders })
                .then(r => r.json())
                .then(data => {
                    selects.forEach(sel => {
                        const current = sel.value;
                        sel.innerHTML = data.map(o =>
                            `<option value="${escAttr(o.value)}"${String(o.value) === String(current) ? ' selected' : ''}>${esc(o.label)}</option>`
                        ).join('');
                    });
                })
                .catch(err => console.error('[FluentTable] failed to load select options', err));
        }
    }

    function renderCell(value, cast, row) {
        if (!cast) return renderers.text(value, {}, row);
        const fn = renderers[cast.type];
        if (!fn) {
            console.warn('[FluentTable] unknown cast:', cast.type);
            return renderers.text(value, {}, row);
        }
        return fn(value, cast, row);
    }

    function renderError(id) {
        const tbody = el(`${id}-tbody`);
        if (!tbody) return;
        const state   = instances.get(id);
        let colSpan = (state?.config.columns ?? []).filter(c => !c.hidden && c.cast?.type !== 'hidden').length;
        if (state?.config.bulkField) colSpan++;
        if (state?.config.expandable === 'button') colSpan++;
        const msg = state?.config.labels?.error ?? 'Failed to load data.';
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center text-danger py-4" role="alert">${esc(msg)}</td></tr>`;
    }

    // Pagination

    function renderPagination(id, meta) {
        const ul = el(`${id}-pagination`);
        if (!ul) return;

        const page       = Number(meta.page ?? 1);
        const totalPages = Number(meta.totalPages ?? 1);

        if (totalPages <= 1) { ul.innerHTML = ''; return; }

        const pages = buildPageNumbers(page, totalPages);

        const prevSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6l6 6"/></svg>`;
        const nextSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg>`;

        const prev = page <= 1
            ? `<li class="page-item disabled"><span class="page-link" aria-disabled="true" aria-label="Previous page">${prevSvg}</span></li>`
            : `<li class="page-item"><a class="page-link flt-page" href="#" data-table="${esc(id)}" data-page="${page - 1}" aria-label="Previous page">${prevSvg}</a></li>`;

        const next = page >= totalPages
            ? `<li class="page-item disabled"><span class="page-link" aria-disabled="true" aria-label="Next page">${nextSvg}</span></li>`
            : `<li class="page-item"><a class="page-link flt-page" href="#" data-table="${esc(id)}" data-page="${page + 1}" aria-label="Next page">${nextSvg}</a></li>`;

        ul.innerHTML = prev + pages.map(p => {
            if (p === '…') {
                return `<li class="page-item disabled" aria-hidden="true"><span class="page-link">…</span></li>`;
            }
            const current = p === page;
            return `<li class="page-item${current ? ' active' : ''}">
                <a class="page-link flt-page" href="#" data-table="${esc(id)}" data-page="${p}" aria-label="Page ${p}"${current ? ' aria-current="page"' : ''}>${p}</a>
            </li>`;
        }).join('') + next;
    }

    function buildPageNumbers(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = [1];
        if (current > 3)          pages.push('…');
        const from = Math.max(2, current - 1);
        const to   = Math.min(total - 1, current + 1);
        for (let i = from; i <= to; i++) pages.push(i);
        if (current < total - 2)  pages.push('…');
        pages.push(total);
        return pages;
    }

    // Search

    function initSearch(id) {
        const state = instances.get(id);
        const input = document.querySelector(`.flt-search[data-table="${id}"]`);
        if (!input) return;

        if (state.search) input.value = state.search;

        const onSearch = debounce((value) => {
            const s = instances.get(id);
            if (!s) return;
            s.search = value;
            s.page   = 1;
            updateUrlParam(`search_${id}`, value || null);
            document.dispatchEvent(new CustomEvent('flt:search', {
                detail: { tableId: id, query: value },
            }));
            load(id);
        }, 350);

        const handler = e => onSearch(e.target.value.trim());
        input.addEventListener('input', handler);
        if (state) state._searchHandler = { el: input, handler };
    }

    function updateUrlParam(key, value) {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        history.replaceState(null, '', url.toString());
    }

    // Sort

    function initSort(id) {
        const state = instances.get(id);
        const sortBtns = document.querySelectorAll(`.flt-sort[data-table="${id}"]`);

        const handlers = [];
        sortBtns.forEach(btn => {
            const handler = () => {
                const state = instances.get(id);
                if (!state) return;
                const field = btn.dataset.field;

                if (state.sortCol === field) {
                    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sortCol = field;
                    state.sortDir = 'asc';
                }
                state.page = 1;

                sortBtns.forEach(b => {
                    b.classList.remove('asc', 'desc');
                    b.closest('th')?.removeAttribute('aria-sort');
                });
                btn.classList.add(state.sortDir);
                btn.closest('th')?.setAttribute('aria-sort', state.sortDir === 'asc' ? 'ascending' : 'descending');

                document.dispatchEvent(new CustomEvent('flt:sort-change', {
                    detail: { tableId: id, col: state.sortCol, dir: state.sortDir },
                }));
                load(id);
            };
            btn.addEventListener('click', handler);
            handlers.push({ el: btn, handler });

            // Restore visual sort indicator for default sort column
            if (state && btn.dataset.field === state.sortCol) {
                btn.classList.add(state.sortDir);
                btn.closest('th')?.setAttribute('aria-sort', state.sortDir === 'asc' ? 'ascending' : 'descending');
            }
        });

        if (state) state._sortHandlers = handlers;
    }

    // Delegated events — bound once per table, survives re-renders

    function bindDelegation(id) {
        const wrap = el(`${id}-wrap`);
        if (!wrap || wrap.dataset.fltBound) return;
        wrap.dataset.fltBound = '1';

        const extraHeaders = instances.get(id)?.config.headers || {};

        const onClick = async (e) => {
            // Pagination link
            const page = e.target.closest('.flt-page[data-table]');
            if (page && page.dataset.table === id) {
                e.preventDefault();
                const state = instances.get(id);
                if (state) {
                    state.page = Number(page.dataset.page);
                    document.dispatchEvent(new CustomEvent('flt:page-change', {
                        detail: { tableId: id, page: state.page },
                    }));
                    load(id);
                }
                return;
            }

            // Page size selector
            const size = e.target.closest('.flt-page-size[data-table]');
            if (size && size.dataset.table === id) {
                e.preventDefault();
                const state = instances.get(id);
                if (state) {
                    state.perPage = Number(size.dataset.value);
                    state.page    = 1;
                    try { localStorage.setItem('flt-perPage-' + state.config.id, size.dataset.value); } catch (_) {}
                    const label = document.querySelector(`.flt-per-page-label[data-table="${id}"]`);
                    if (label) label.textContent = size.dataset.value;
                    load(id);
                }
                return;
            }

            // Action button — sends POST to its data-url
            const btn = e.target.closest('.flt-btn');
            if (btn && wrap.contains(btn)) {
                e.preventDefault();
                const confirmMsg = btn.dataset.fltConfirm;
                if (confirmMsg && !confirm(confirmMsg)) return;
                btn.disabled = true;
                try {
                    const payload = JSON.parse(btn.dataset.payload || '{}');
                    document.dispatchEvent(new CustomEvent('flt:action', {
                        detail: { tableId: id, url: btn.dataset.url, payload, button: btn },
                    }));
                    const response = await postJson(btn.dataset.url, payload, extraHeaders);
                    document.dispatchEvent(new CustomEvent('flt:action-done', {
                        detail: { tableId: id, url: btn.dataset.url, response },
                    }));
                    load(id);
                } catch (err) {
                    console.error('[FluentTable] action error', err);
                    toast('danger', 'Action failed');
                } finally {
                    btn.disabled = false;
                }
                return;
            }

            // Expandable rows
            const expandBtn = e.target.closest('.flt-expand-btn');
            const tr = e.target.closest('tr[data-flt-row-idx]');
            if (tr && wrap.contains(tr)) {
                const state = instances.get(id);
                if (!state?.config.expandable) return;

                // Button mode — only expand on button click
                if (state.config.expandable === 'button' && !expandBtn) return;

                // Row mode — ignore clicks on interactive elements
                if (state.config.expandable === 'row') {
                    if (e.target.closest('a, button, input, select, textarea, .flt-btn, .flt-checkbox, .flt-select, .flt-bulk-check, .flt-datepicker')) return;
                }

                const idx  = Number(tr.dataset.fltRowIdx);
                const row  = state.rows?.[idx];
                if (!row) return;

                const existing = tr.nextElementSibling;
                if (existing?.classList.contains('flt-expand-row')) {
                    document.dispatchEvent(new CustomEvent('flt:row-collapse', {
                        detail: { tableId: id, row, element: existing.firstElementChild },
                    }));
                    existing.remove();
                    tr.classList.remove('flt-expanded');
                    const collapseBtn = tr.querySelector('.flt-expand-btn');
                    if (collapseBtn) collapseBtn.setAttribute('aria-expanded', 'false');
                    return;
                }

                const colSpan = tr.children.length;
                const expandTr = document.createElement('tr');
                expandTr.className = 'flt-expand-row';
                const td = document.createElement('td');
                td.colSpan = colSpan;
                td.className = 'p-0';
                expandTr.appendChild(td);
                tr.after(expandTr);
                tr.classList.add('flt-expanded');
                const openBtn = tr.querySelector('.flt-expand-btn');
                if (openBtn) openBtn.setAttribute('aria-expanded', 'true');

                document.dispatchEvent(new CustomEvent('flt:row-expand', {
                    detail: { tableId: id, row, element: td },
                }));
                return;
            }
        };

        const onChange = async (e) => {
            // Bulk "select all" checkbox
            const selectAll = e.target.closest('.flt-select-all');
            if (selectAll && selectAll.dataset.table === id) {
                wrap.querySelectorAll('.flt-bulk-check').forEach(cb => { cb.checked = selectAll.checked; });
                document.dispatchEvent(new CustomEvent('flt:bulk-change', {
                    detail: { tableId: id, ids: window.FluentTable.getSelectedIds(id) },
                }));
                return;
            }

            // Individual bulk checkbox
            const bulkCheck = e.target.closest('.flt-bulk-check');
            if (bulkCheck && bulkCheck.dataset.table === id) {
                document.dispatchEvent(new CustomEvent('flt:bulk-change', {
                    detail: { tableId: id, ids: window.FluentTable.getSelectedIds(id) },
                }));
                return;
            }

            // Checkbox toggle
            const cb = e.target.closest('.flt-checkbox');
            if (cb && wrap.contains(cb)) {
                const value = cb.checked ? cb.dataset.trueValue : cb.dataset.falseValue;
                cb.disabled = true;
                try {
                    await postJson(cb.dataset.url, { [cb.dataset.field]: value }, extraHeaders);
                    load(id);
                } catch (err) {
                    cb.checked = !cb.checked;
                    cb.disabled = false;
                    console.error('[FluentTable] checkbox error', err);
                    toast('danger', 'Update failed');
                }
                return;
            }

            // Quick filter dropdown
            const filter = e.target.closest('.flt-filter[data-table]');
            if (filter && filter.dataset.table === id) {
                const state = instances.get(id);
                if (state) {
                    state.filterValues[filter.dataset.param] = filter.value;
                    state.page = 1;
                    load(id);
                }
                return;
            }

            // Inline select
            const sel = e.target.closest('.flt-select');
            if (sel && wrap.contains(sel)) {
                sel.disabled = true;
                try {
                    await postJson(sel.dataset.url, { [sel.dataset.field]: sel.value }, extraHeaders);
                    load(id);
                } catch (err) {
                    console.error('[FluentTable] select error', err);
                    toast('danger', 'Update failed');
                    sel.disabled = false;
                }
                return;
            }

            // Datepicker changes are handled by AirDatepicker's onSelect
        };

        const onKeydown = (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const tr = e.target.closest('tr.flt-expandable-row');
            if (tr && wrap.contains(tr)) {
                e.preventDefault();
                tr.click();
            }
        };

        wrap.addEventListener('click', onClick);
        wrap.addEventListener('change', onChange);
        wrap.addEventListener('keydown', onKeydown);

        // Store refs for cleanup in destroy()
        const state = instances.get(id);
        if (state) state._listeners = { wrap, onClick, onChange, onKeydown };
    }

    // AirDatepicker integration

    function initDatepickers(id, container) {
        const pickers = container.querySelectorAll('.flt-datepicker');
        if (!pickers.length) return;

        if (!window.AirDatepicker) {
            console.warn('[FluentTable] datepicker cast is used but AirDatepicker is not loaded. Include air-datepicker JS/CSS.');
            return;
        }

        const extraHeaders = instances.get(id)?.config.headers || {};

        pickers.forEach(input => {
            if (input._adp) return;

            function saveField(value) {
                postJson(input.dataset.url, { [input.dataset.field]: value }, extraHeaders)
                    .then(() => { toast('success', 'Updated'); load(id); })
                    .catch(err => { console.error('[FluentTable] datepicker error', err); toast('danger', 'Update failed'); });
            }

            const opts = {
                autoClose:      true,
                dateFormat:     input.dataset.format || 'yyyy-MM-dd',
                toggleSelected: false,
                onSelect({ formattedDate }) {
                    input.value = formattedDate || '';
                    saveField(formattedDate || null);
                },
            };

            if (input.dataset.minDate) opts.minDate = new Date(input.dataset.minDate);
            if (input.dataset.maxDate) opts.maxDate = new Date(input.dataset.maxDate);

            const rawValue = input.dataset.rawValue || input.value;
            if (rawValue) opts.selectedDates = [new Date(rawValue)];

            if (input.dataset.nullable) {
                opts.buttons = [{
                    content: 'Clear',
                    onClick(dp) {
                        dp.clear();
                        input.value = '';
                        saveField(null);
                    },
                }];
            }

            input._adp = new AirDatepicker(input, opts);
        });
    }

    // Remote filters — dispatches events for an external offcanvas plugin

    function initRemoteFilters(id) {
        const wrap = el(`${id}-wrap`);
        if (!wrap) return;

        const filtersBtn = wrap.querySelector('.flt-open-filters');
        if (filtersBtn) {
            const handler = () => {
                const state = instances.get(id);
                if (!state) return;
                document.dispatchEvent(new CustomEvent('flt:filters-open', {
                    detail: { tableId: id, filters: state.remoteFilters || [], values: state.panelFilterValues },
                }));
            };
            filtersBtn.addEventListener('click', handler);
            const state = instances.get(id);
            if (state) state._filtersHandler = { el: filtersBtn, handler };
        }
    }

    document.addEventListener('flt:filters-apply', (e) => {
        const { tableId, values } = e.detail;
        const state = instances.get(tableId);
        if (!state) return;
        state.panelFilterValues = values;
        state.page = 1;
        load(tableId);
    });

    document.addEventListener('flt:filters-reset', (e) => {
        const { tableId } = e.detail;
        const state = instances.get(tableId);
        if (!state) return;
        state.panelFilterValues = {};
        state.page = 1;
        load(tableId);
    });

    // Public API

    window.FluentTable = {

        renderers,

        init(config) {
            const id = config.id;
            if (!id) { console.error('[FluentTable] config.id is missing'); return; }
            if ((config._v || 0) < 1) { console.warn('[FluentTable] config version mismatch — update PHP package'); }

            // Destroy previous instance to prevent listener leaks on re-init
            if (instances.has(id)) {
                window.FluentTable.destroy(id);
            }

            instances.set(id, createState(config));

            bindDelegation(id);
            initSort(id);
            initSearch(id);
            initRemoteFilters(id);

            // Update perPage label to match restored value
            const state = instances.get(id);
            if (state) {
                const label = document.querySelector(`.flt-per-page-label[data-table="${id}"]`);
                if (label) label.textContent = String(state.perPage);
            }

            load(id);
        },

        reload(id) {
            load(id);
        },

        getState(id) {
            return instances.get(id);
        },

        destroy(id) {
            const state = instances.get(id);
            if (!state) return;
            if (state.abortController) state.abortController.abort();
            // Remove delegated listeners
            if (state._listeners) {
                const { wrap, onClick, onChange, onKeydown } = state._listeners;
                wrap.removeEventListener('click', onClick);
                wrap.removeEventListener('change', onChange);
                if (onKeydown) wrap.removeEventListener('keydown', onKeydown);
            }
            // Remove sort listeners
            if (state._sortHandlers) {
                state._sortHandlers.forEach(({ el, handler }) => el.removeEventListener('click', handler));
            }
            // Remove search listener
            if (state._searchHandler) {
                state._searchHandler.el.removeEventListener('input', state._searchHandler.handler);
            }
            // Remove filters button listener
            if (state._filtersHandler) {
                state._filtersHandler.el.removeEventListener('click', state._filtersHandler.handler);
            }
            instances.delete(id);
            const wrap = el(`${id}-wrap`);
            if (wrap) delete wrap.dataset.fltBound;
        },

        export(id) {
            const state = instances.get(id);
            if (!state) return;
            document.dispatchEvent(new CustomEvent('flt:export', {
                detail: {
                    tableId:  id,
                    endpoint: state.config.endpoint,
                    filters:  { ...state.filterValues, ...state.panelFilterValues },
                    search:   state.search,
                    sortCol:  state.sortCol,
                    sortDir:  state.sortDir,
                },
            }));
        },

        getSelectedIds(id) {
            const wrap = el(`${id}-wrap`);
            if (!wrap) return [];
            return Array.from(wrap.querySelectorAll('.flt-bulk-check:checked')).map(cb => cb.value);
        },

        collapseAll(id) {
            const wrap = el(`${id}-wrap`);
            if (!wrap) return;
            const state = instances.get(id);
            wrap.querySelectorAll('.flt-expand-row').forEach(expandTr => {
                const dataTr = expandTr.previousElementSibling;
                const idx = dataTr ? Number(dataTr.dataset.fltRowIdx) : -1;
                const row = state?.rows?.[idx];
                document.dispatchEvent(new CustomEvent('flt:row-collapse', {
                    detail: { tableId: id, row: row || null, element: expandTr.firstElementChild },
                }));
                expandTr.remove();
                if (dataTr) dataTr.classList.remove('flt-expanded');
            });
        },
    };

    document.dispatchEvent(new Event('FluentTableReady'));

})();
