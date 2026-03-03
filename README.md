# FluentTable

Fluent PHP builder for [Tabler UI](https://tabler.io/) data tables with REST endpoint support.

Zero dependencies on the JS side. Works with any backend that returns `{ data: [], meta: { pagination: {} } }`.

## Requirements

- PHP >= 8.1
- Tabler UI CSS/JS in the host application
- Bootstrap 5 (included with Tabler)

## Installation

```bash
composer require infomediji/fluent-table
```

## Host Application Setup

### PUBLIC_HTML_PATH constant

`Table::render()` copies `table.css` and `table.js` from the package into the public web directory. Define the constant **before** calling `render()`:

```php
define('PUBLIC_HTML_PATH', '/var/www/html');
```

Assets are published to `PUBLIC_HTML_PATH/s/widgets/fluent_table/` with cache-busting timestamps.

### CSRF Protection

FluentTable reads a CSRF token from `<meta name="csrf-token">` and sends it as `X-CSRF-Token` on all POST requests:

```html
<meta name="csrf-token" content="<?= $csrfToken ?>">
```

## Quick Start

### 1. Define the table

```php
use Infomediji\FluentTable\Table;
use Infomediji\FluentTable\Casts\BadgeCast;
use Infomediji\FluentTable\Casts\IconButtonCast;
use Infomediji\FluentTable\Color;
use Infomediji\FluentTable\Icon;

echo Table::make('/api/users/list')
    ->title('Users')
    ->description('Manage system users')
    ->column('ID', '_id')->hidden()
    ->column('Name', 'name')->searchable()
    ->column('Email', 'email')->searchable()
    ->column('Status', 'status')
        ->cast(BadgeCast::make(['active' => Color::SUCCESS, 'banned' => Color::DANGER]))
    ->column('Actions', '_id')->noSort()->center()
        ->cast(IconButtonCast::make('/api/users/delete/{_id}', Icon::DELETE, 'ghost-danger')
            ->confirm('Delete this user?'))
    ->defaultSort('name', 'asc')
    ->pageSizes([20, 50, 100])
    ->render();
```

### 2. Create the REST endpoint

The endpoint receives GET parameters: `page`, `perPage`, `sortCol`, `sortDir`, `search`, `searchFields[]`, plus any custom filter params.

```php
use Infomediji\FluentTable\Response;

$page    = (int) ($_GET['page'] ?? 1);
$perPage = (int) ($_GET['perPage'] ?? 20);
$search  = $_GET['search'] ?? '';

// ... fetch $rows and $total from your database ...

echo json_encode(Response::make($rows, $total, $page, $perPage));
```

## Table Options

| Method | Description |
|---|---|
| `title(string)` | Card header title |
| `description(string)` | Card header subtitle |
| `defaultSort(string $col, string $dir)` | Initial sort column and direction (`asc`/`desc`) |
| `pageSizes(array $sizes)` | Page size options, e.g. `[20, 50, 100]` |
| `emptyState(string $msg, string $icon)` | Custom empty state message and icon |
| `locale(array $labels)` | Override UI labels (keys: `records`, `filters`, `search`, `loading`, `empty`, `error`) |

## Column Modifiers

After `->column('Name', 'field')`, chain any of these:

| Method | Description |
|---|---|
| `->cast(CastInterface)` | Set the cell renderer |
| `->hidden()` | Hide column (data still available to JS) |
| `->center()` | Center-align column |
| `->right()` | Right-align column |
| `->noSort()` | Disable sorting for this column |
| `->width(string)` | Set column width, e.g. `'1%'`, `'200px'` |
| `->searchable(?string $field)` | Mark as searchable (optional override field) |

## Available Casts

| Class | Description |
|---|---|
| `BadgeCast` | Colored badge mapped from value |
| `ButtonCast` | POST button with optional confirm dialog |
| `ButtonGroupCast` | Group of `ButtonCast` / `IconButtonCast` |
| `CheckboxCast` | Toggle checkbox (POST on change) |
| `ClickableTagsCast` | Clickable tag list with URL |
| `DateCast` | Format a timestamp as date |
| `DatePickerCast` | Inline date picker (POST on change, requires [AirDatepicker](https://air-datepicker.com/)) |
| `DownloadLinkCast` | Download button/link |
| `EntityCast` | Avatar + title + optional subtitle |
| `FileSizeCast` | Human-readable file size |
| `HiddenCast` | Hidden column (data available to JS, not rendered) |
| `IconButtonCast` | Icon-only POST button with optional tooltip |
| `IconCast` | Static or value-mapped Tabler icon |
| `ImageCast` | Thumbnail image |
| `LinkCast` | Anchor link with `{field}` placeholders |
| `ModalButtonCast` | Button that opens a Bootstrap modal |
| `ModalIconButtonCast` | Icon button that opens a Bootstrap modal |
| `ModalTextCast` | Clickable text that opens a Bootstrap modal |
| `MutedTextCast` | Muted/secondary text with placeholder |
| `PriceCast` | Formatted currency value |
| `SelectCast` | Inline select (POST on change) |
| `StatusCast` | Colored dot indicator + text |
| `TagsCast` | Non-clickable badge list |
| `TextCast` | Plain text with optional placeholder |

## Helper Enums

- `Color` — Tabler color constants (`Color::SUCCESS`, `Color::DANGER`, etc.)
- `ButtonStyle` — Button style constants (`ButtonStyle::GHOST_PRIMARY`, etc.)
- `Icon` — Common Tabler icon name constants (`Icon::EDIT`, `Icon::DELETE`, etc.)

## Header Actions

Add custom action buttons to the table header:

```php
Table::make('/api/shorts')
    ->action('Add short', '/admin_slr_shorts/add', Icon::PLUS)
    ->action('Import', '/admin_slr_shorts/import', Icon::UPLOAD)
    ->column('Name', 'name')
    ->render();
```

Actions render as a `btn-group` in the header right side, before filters and search.

## Bulk Actions

Enable mass selection with checkboxes:

```php
Table::make('/api/users')
    ->bulkActions('_id')   // row key field for collecting selected IDs
    ->column('Name', 'name')
    ->render();
```

A "select all" checkbox appears in the header. Selection resets on every data reload.

```js
// Get array of selected row IDs
const ids = FluentTable.getSelectedIds('flt-1');  // ['123', '456', ...]
```

## Expandable Rows

Click a row (or a chevron button) to open a detail panel below it. FluentTable handles expand/collapse; the host app fills the content via event.

```php
// Click anywhere on row to expand:
Table::make('/api/shorts')
    ->expandable()
    ->column('Title', 'title')
    ->render();

// Chevron button in last column:
Table::make('/api/shorts')
    ->expandable('button')
    ->column('Title', 'title')
    ->render();
```

Host-side JS:

```js
document.addEventListener('flt:row-expand', (e) => {
    const { tableId, row, element } = e.detail;
    // row = full row object from API, element = empty <td> to fill
    element.innerHTML = renderDetail(row);
});

document.addEventListener('flt:row-collapse', (e) => {
    // Clean up resources if needed
});
```

Clicks on interactive elements (links, buttons, checkboxes, selects) do **not** trigger expand.

## Quick Filters

Dropdown filters in the card header:

```php
Table::make('/api/items')
    ->filter('Status', 'status_filter', [
        ''         => 'All statuses',
        'active'   => 'Active',
        'inactive' => 'Inactive',
    ], $_GET['status_filter'] ?? '')
    ->column('Name', 'name')
    ->render();
```

## Remote Filters (Offcanvas)

For complex filter UIs — filter definitions come from the backend in `meta.filters`, and FluentTable communicates with an external offcanvas plugin via DOM events.

### PHP setup

```php
Table::make('/api/scenes')
    ->remoteFilters()   // shows the "Filters" button in the header
    ->column('Name', 'name')
    ->render();
```

### Backend response

```json
{
  "data": [],
  "meta": {
    "pagination": { "page": 1, "perPage": 20, "totalCount": 100, "totalPages": 5 },
    "filters": [
      { "label": "Active", "param": "active", "options": { "": "All", "1": "Active", "0": "Inactive" } },
      { "label": "Status", "param": "moderationStatus", "options": { "": "All", "1": "Pending", "2": "Approved" } }
    ]
  }
}
```

### Event contract

FluentTable dispatches:
- `flt:filters-loaded` — after data load when `meta.filters` is present. Detail: `{ tableId, filters, values }`
- `flt:filters-open` — when user clicks "Filters" button. Detail: `{ tableId, filters, values }`

External plugin must dispatch:
- `flt:filters-apply` — when user confirms. Detail: `{ tableId, values: { param: value, ... } }`
- `flt:filters-reset` — when user clears all. Detail: `{ tableId }`

### Active filters bar

FluentTable renders an empty container `<div id="{tableId}-active-filters">` between the header and the table. The offcanvas plugin populates it with badges showing applied filters.

### Offcanvas plugin implementation guide

The offcanvas plugin is **not** part of FluentTable — it lives in the host application. Below is a reference implementation.

#### 1. HTML structure

Place anywhere in your layout (e.g. end of `<body>`):

```html
<div class="offcanvas offcanvas-end" tabindex="-1" id="tableFilters">
    <div class="offcanvas-header">
        <h2 class="offcanvas-title">Filters</h2>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
        <div data-filter-panel></div>
    </div>
    <div class="offcanvas-footer p-3 border-top">
        <div class="d-flex gap-2 w-100">
            <button class="btn w-100" data-filter-reset>Reset</button>
            <button class="btn btn-primary w-100" data-filter-apply>Apply</button>
        </div>
    </div>
</div>
```

#### 2. JS — FilterPanel class

```js
class FilterPanel {
    constructor() {
        this.tableId = null;
        this.filters = [];
        this.values  = {};
        this.labels  = {};

        this.offcanvas = new bootstrap.Offcanvas('#tableFilters');
        this.panel     = document.querySelector('[data-filter-panel]');
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('flt:filters-loaded', (e) => {
            this.tableId = e.detail.tableId;
            this.filters = e.detail.filters;
            this.values  = { ...e.detail.values };
            this.buildLabelsMap();
            this.renderActiveBar();
        });

        document.addEventListener('flt:filters-open', (e) => {
            this.tableId = e.detail.tableId;
            this.filters = e.detail.filters;
            this.values  = { ...e.detail.values };
            this.renderPanel();
            this.offcanvas.show();
        });

        document.querySelector('[data-filter-apply]').addEventListener('click', () => {
            this.collectValues();
            document.dispatchEvent(new CustomEvent('flt:filters-apply', {
                detail: { tableId: this.tableId, values: this.values }
            }));
            this.offcanvas.hide();
            this.renderActiveBar();
        });

        document.querySelector('[data-filter-reset]').addEventListener('click', () => {
            this.values = {};
            document.dispatchEvent(new CustomEvent('flt:filters-reset', {
                detail: { tableId: this.tableId }
            }));
            this.offcanvas.hide();
            this.renderActiveBar();
        });
    }

    buildLabelsMap() {
        this.labels = {};
        this.filters.forEach(f => {
            this.labels[f.param] = {};
            Object.entries(f.options || {}).forEach(([val, label]) => {
                this.labels[f.param][val] = label;
            });
        });
    }

    renderPanel() {
        this.panel.innerHTML = this.filters.map(f => {
            const current = this.values[f.param] ?? '';
            if (f.options) {
                const opts = Object.entries(f.options)
                    .map(([v, l]) => `<option value="${v}"${v === current ? ' selected' : ''}>${l}</option>`)
                    .join('');
                return `<div class="mb-3">
                    <label class="form-label">${f.label}:</label>
                    <select class="form-select" data-filter-key="${f.param}">${opts}</select>
                </div>`;
            }
            return `<div class="mb-3">
                <label class="form-label">${f.label}:</label>
                <input type="text" class="form-control" data-filter-key="${f.param}"
                       value="${current}" placeholder="">
            </div>`;
        }).join('');
    }

    collectValues() {
        this.values = {};
        this.panel.querySelectorAll('[data-filter-key]').forEach(el => {
            if (el.value !== '' && el.value !== null) {
                this.values[el.dataset.filterKey] = el.value;
            }
        });
    }

    renderActiveBar() {
        const container = document.getElementById(this.tableId + '-active-filters');
        if (!container) return;

        const active = Object.entries(this.values)
            .filter(([, val]) => val !== '' && val !== null && val !== undefined);

        if (!active.length) {
            container.classList.add('d-none');
            container.innerHTML = '';
            return;
        }

        container.classList.remove('d-none');
        container.innerHTML = `<div class="card-body py-2 border-bottom">
            <div class="d-flex flex-wrap gap-2">
                ${active.map(([param, value]) => {
                    const filter = this.filters.find(f => f.param === param);
                    const label  = this.labels[param]?.[value] || value;
                    const name   = filter?.label || param;
                    return `<span class="badge bg-blue-lt">
                        ${name}: ${label}
                        <button type="button" data-filter-remove="${param}"
                                class="btn-close btn-close-sm ms-1"
                                aria-label="Remove"></button>
                    </span>`;
                }).join('')}
            </div>
        </div>`;

        container.querySelectorAll('[data-filter-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                delete this.values[btn.dataset.filterRemove];
                document.dispatchEvent(new CustomEvent('flt:filters-apply', {
                    detail: { tableId: this.tableId, values: this.values }
                }));
                this.renderActiveBar();
            });
        });
    }
}

new FilterPanel();
```

#### 3. Flow

1. Data loads → backend returns `meta.filters` → `flt:filters-loaded` → plugin builds labels and renders active bar
2. "Filters" button click → `flt:filters-open` → plugin renders form, shows offcanvas
3. "Apply" → `flt:filters-apply` → FluentTable reloads → active bar updates
4. Badge `×` click → removes param, dispatches `flt:filters-apply` → reload
5. "Reset" → `flt:filters-reset` → all filters cleared

## Events

FluentTable dispatches `CustomEvent`s on `document`.

| Event | When fired | `e.detail` |
|---|---|---|
| `flt:loading` | Request starts | `{ tableId }` |
| `flt:loaded` | Data received and rendered | `{ tableId, rows, pagination }` |
| `flt:error` | Request failed | `{ tableId, error }` |
| `flt:page-change` | User changes page | `{ tableId, page }` |
| `flt:sort-change` | User changes sort | `{ tableId, col, dir }` |
| `flt:search` | Search triggered (debounced) | `{ tableId, query }` |
| `flt:action` | Action button clicked (before POST) | `{ tableId, url, payload, button }` |
| `flt:action-done` | Action POST completed | `{ tableId, url, response }` |
| `flt:bulk-change` | Bulk selection changed | `{ tableId, ids }` |
| `flt:export` | `FluentTable.export(id)` called | `{ tableId, endpoint, filters, search, sortCol, sortDir }` |
| `flt:row-expand` | Expandable row opened | `{ tableId, row, element }` |
| `flt:row-collapse` | Expandable row closed | `{ tableId, row, element }` |
| `flt:filters-loaded` | Remote filters from backend | `{ tableId, filters, values }` |
| `flt:filters-open` | Filters button clicked | `{ tableId, filters, values }` |
| `flt:filters-apply` | *(inbound)* Apply filters | `{ tableId, values }` |
| `flt:filters-reset` | *(inbound)* Reset filters | `{ tableId }` |

### Example

```js
document.addEventListener('flt:loaded', (e) => {
    console.log(`Table ${e.detail.tableId}: ${e.detail.rows.length} rows loaded`);
});

document.addEventListener('flt:bulk-change', (e) => {
    document.getElementById('bulk-delete-btn').disabled = e.detail.ids.length === 0;
});
```

## JS Public API

```js
FluentTable.init(config)          // Initialize a table instance
FluentTable.reload(id)            // Reload data
FluentTable.destroy(id)           // Tear down: abort requests, remove all listeners
FluentTable.export(id)            // Dispatch flt:export event with current state
FluentTable.getSelectedIds(id)    // Get checked bulk action IDs as string[]
FluentTable.getState(id)          // Get internal state object
FluentTable.collapseAll(id)       // Collapse all expanded rows
FluentTable.renderers             // Map of cast renderers (extensible)
```

### Custom Renderers

Register custom renderers for your own cast types:

```js
FluentTable.renderers['my-type'] = function(value, cfg, row) {
    return `<span class="custom">${value}</span>`;
};
```

### Export

`FluentTable.export(id)` dispatches `flt:export`. The host app handles the actual download:

```js
document.addEventListener('flt:export', (e) => {
    const { endpoint, filters, search, sortCol, sortDir } = e.detail;
    window.location.href = buildExportUrl(endpoint, filters, search, sortCol, sortDir);
});
```

### Destroy

`FluentTable.destroy(id)` fully cleans up: aborts in-flight requests, removes all event listeners (delegated, sort, search, filters), and clears internal state. Safe for SPA destroy/re-init cycles.

### perPage persistence

The selected page size is saved to `localStorage` (key: `flt-perPage-{endpoint}`) and restored on next init. No configuration needed.

## Localization

Override UI labels via `locale()`:

```php
Table::make('/api/items')
    ->locale([
        'records' => 'Einträge',
        'search'  => 'Suchen...',
        'loading' => 'Laden...',
        'empty'   => 'Keine Ergebnisse',
        'error'   => 'Fehler beim Laden',
        'filters' => 'Filter',
    ])
    ->column('Name', 'name')
    ->render();
```

## Date Formats

`DateCast` and `DatePickerCast` use PHP-style format tokens:

| Token | Output | Example |
|---|---|---|
| `Y` | 4-digit year | `2024` |
| `M` | Short month name | `Jan` |
| `m` | Month (zero-padded) | `01` |
| `n` | Month (no padding) | `1` |
| `d` | Day (zero-padded) | `05` |
| `j` | Day (no padding) | `5` |
| `H` | Hours (24h, zero-padded) | `09` |
| `i` | Minutes (zero-padded) | `30` |
| `s` | Seconds (zero-padded) | `00` |

Example: `DateCast::make('d M Y')` → `05 Jan 2024`

For `DatePickerCast`, PHP tokens are automatically converted to AirDatepicker format internally.

## Example: Integration in sbd-admin-backend

This example shows how the package was integrated into the `sbd-admin-backend` project as a pilot on the **Scripts** page.

### Setup

The package is connected as a local path repository (`packages/table-v2/`). To switch to a remote repo:

1. Push this repo to GitHub/Gitea (`infomediji/fluent-table`)
2. In `sbd-admin-backend/composer.json`:
   - Replace path repository `./packages/table-v2` with the VCS URL
   - Replace `"infomediji/table-v2": "@dev"` with `"infomediji/fluent-table": "@dev"`
3. Run `composer update infomediji/fluent-table`
4. Update `use` imports: `Infomediji\TableV2\` → `Infomediji\FluentTable\`
   - File: `application/controllers/Admin/Fleshlightpartners/Scripts.php`
5. Delete `packages/table-v2/`

### Controller actions

- `listV2Action` — builds the table with columns: Active, Title, Studio, Date, Vendor, Status, Type, Price, Download
- `listV2DataAction` — REST endpoint, applies status/vendor/ai_type filters + search, returns paginated rows
- `listV2ToggleActiveAction` — checkbox toggle endpoint (JSON body)

### Files

- View: `application/views/controllers/admin_fleshlight-partners_scripts/listv2.tpl`
- Route: registered in `library/Admin/ControllerAbstract.php` `$tabler_routes` array

### Host-app requirements

- `PUBLIC_HTML_PATH` constant — defined in `sbd-admin-backend`
- Assets published to `public_html/s/widgets/fluent_table/`
- `window.UIUpdater` (from `core.js`) — loading indicator integration
- `window.showToast(type, message)` (from `core.js`) — toast notifications after toggles
- Layout `core_tb.tpl` — exclude `core-tags.js`, `core-timeline.js`, `web-player` scripts on non-edit pages

## License

MIT
