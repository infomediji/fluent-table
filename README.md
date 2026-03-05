# FluentTable

Zero-dependency data table engine for [Tabler UI](https://tabler.io/) with a fluent PHP API, 20+ cell renderers, and built-in pagination, sorting, search, and inline editing.

Works with any backend that returns `{ data: [], meta: { pagination: {} } }`.

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
| `trackUrl()` | Sync search, sort, page and filters to the URL query string (enables shareable links) |

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

Options are an array of objects with `value` and `label`. Optionally include `count` to show item counts next to each option in the filter panel.

```json
{
  "data": [],
  "meta": {
    "pagination": { "page": 1, "perPage": 20, "totalCount": 100, "totalPages": 5 },
    "filters": [
      {
        "label": "Status",
        "param": "profile_status",
        "options": [
          { "value": "",  "label": "All" },
          { "value": "1", "label": "Pending",  "count": 84 },
          { "value": "2", "label": "Approved", "count": 12 },
          { "value": "3", "label": "Suspended","count": 4  }
        ]
      }
    ]
  }
}
```

### integration.js

The package ships `integration.js` — published automatically alongside `table.js`. It provides:

- **UIUpdater bridge** — calls `window.UIUpdater.start()/end()` on `flt:loading` / `flt:loading-done` (optional, only runs if `window.UIUpdater` exists)
- **Offcanvas filter adapter** — renders filter fields and wires Apply/Reset buttons to FluentTable events

Include it after `table.js`. Works with Bootstrap or Tabler (auto-detected):

```html
<script src="/s/widgets/fluent_table/table.{timestamp}.js"></script>
<script src="/s/widgets/fluent_table/integration.{timestamp}.js"></script>
```

Required HTML (place anywhere in `<body>`):

```html
<div class="offcanvas offcanvas-end" tabindex="-1" id="tableFilters">
    <div class="offcanvas-header">
        <h2 class="offcanvas-title">Filters</h2>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
        <div id="filterPanel" class="row g-3"></div>
    </div>
    <div class="offcanvas-footer p-3 border-top">
        <div class="d-flex gap-2 w-100">
            <button class="btn btn-primary w-100" id="applyFilters">Apply</button>
            <button class="btn btn-outline-secondary w-100" id="resetFilters">Reset</button>
        </div>
    </div>
</div>
```

### Event contract

FluentTable dispatches:
- `flt:filters-loaded` — after data load when `meta.filters` is present. Detail: `{ tableId, filters, values }`
- `flt:filters-open` — when user clicks "Filters" button. Detail: `{ tableId, filters, values }`

External plugin must dispatch:
- `flt:filters-apply` — when user confirms. Detail: `{ tableId, values: { param: value, ... } }`
- `flt:filters-reset` — when user clears all. Detail: `{ tableId }`

### Active filters bar

FluentTable renders an empty container `<div id="{tableId}-active-filters">` between the header and the table. An external plugin can populate it with badges showing applied filters.

## Events

FluentTable dispatches `CustomEvent`s on `document`.

| Event | When fired | `e.detail` |
|---|---|---|
| `flt:loading` | Request starts | `{ tableId }` |
| `flt:loading-done` | Request finished (success or error, not fired on abort) | `{ tableId }` |
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

The selected page size is saved to `localStorage` (key: `flt-perPage-{id}`) and restored on next init. No configuration needed.

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

## License

MIT
