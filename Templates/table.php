<?php
/** @var array<string, mixed> $decoded  Table config array */
/** @var string $config  JSON-encoded table config (for <script> tag) */
/** @var string $id      Unique table instance ID */
$columns        = $decoded['columns'] ?? [];
$visibleColumns = array_filter($columns, fn($c) => ($c['cast']['type'] ?? '') !== 'hidden' && !($c['hidden'] ?? false));
$hasSearch      = !empty(array_filter($columns, fn($c) => $c['searchable'] ?? false));
$filters        = $decoded['filters'] ?? [];
$actions        = $decoded['actions'] ?? [];
$bulkField      = $decoded['bulkField'] ?? null;
$expandable     = $decoded['expandable'] ?? false;
$title          = $decoded['title'] ?? null;
$description    = $decoded['description'] ?? null;
$labels         = $decoded['labels'] ?? [];
$l = static fn(string $key, string $fallback): string => $labels[$key] ?? $fallback;
$hasRemoteFilters = !empty($decoded['remoteFilters']);
$hasHeader = $title !== null || $description !== null || $filters !== [] || $hasRemoteFilters || $hasSearch || $actions !== [];
?>
<div class="card-table" id="<?= htmlspecialchars($id) ?>-wrap">

    <?php if ($hasHeader): ?>
    <!-- Header -->
    <div class="card-header">
        <div class="row w-100 align-items-center g-2">

            <!-- Left: title / description -->
            <div class="col">
                <?php if ($title !== null): ?>
                <h3 class="card-title mb-0"><?= htmlspecialchars($title) ?></h3>
                <?php endif; ?>
                <?php if ($description !== null): ?>
                <p class="card-subtitle mt-0"><?= htmlspecialchars($description) ?></p>
                <?php endif; ?>
            </div>

            <!-- Right: quick filters + search -->
            <div class="col-md-auto col-sm-12">
                <div class="ms-auto d-flex flex-wrap gap-2 align-items-center">

                    <?php if ($actions !== []): ?>
                    <div class="btn-group">
                        <?php foreach ($actions as $action): ?>
                        <a href="<?= htmlspecialchars($action['url']) ?>" class="btn btn-ghost-secondary">
                            <?php if (!empty($action['icon'])): ?>
                            <i class="ti ti-<?= htmlspecialchars($action['icon']) ?>" aria-hidden="true"></i>
                            <?php endif; ?>
                            <?= htmlspecialchars($action['label']) ?>
                        </a>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>

                    <?php foreach ($filters as $filter): ?>
                    <?php $filterId = htmlspecialchars($id . '-filter-' . $filter['param']); ?>
                    <div class="flt-filter-wrap">
                        <label class="flt-filter-label" for="<?= $filterId ?>"><?= htmlspecialchars($filter['label']) ?></label>
                        <select class="flt-filter"
                                id="<?= $filterId ?>"
                                data-table="<?= htmlspecialchars($id) ?>"
                                data-param="<?= htmlspecialchars($filter['param']) ?>">
                            <?php foreach ($filter['options'] as $val => $label): ?>
                            <option value="<?= htmlspecialchars((string) $val) ?>"
                                <?= (string) $val === (string) ($filter['value'] ?? '') ? ' selected' : '' ?>>
                                <?= htmlspecialchars((string) $label) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <?php endforeach; ?>

                    <?php if ($hasRemoteFilters): ?>
                    <button type="button" class="btn btn-ghost-secondary flt-open-filters"
                       data-table="<?= htmlspecialchars($id) ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                             stroke-linejoin="round" class="icon icon-1" aria-hidden="true">
                            <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z"></path>
                        </svg>
                        <?= htmlspecialchars($l('filters', 'Filters')) ?>
                    </button>
                    <?php endif; ?>

                    <?php if ($hasSearch): ?>
                    <div class="input-group input-group-flat w-auto">
                        <span class="input-group-text">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round" class="icon icon-1" aria-hidden="true">
                                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
                                <path d="M21 21l-6 -6"></path>
                            </svg>
                        </span>
                        <input type="text"
                               class="form-control flt-search"
                               data-table="<?= htmlspecialchars($id) ?>"
                               placeholder="<?= htmlspecialchars($l('search', 'Search...')) ?>"
                               aria-label="<?= htmlspecialchars($l('search', 'Search')) ?>"
                               autocomplete="off">
                    </div>
                    <?php endif; ?>

                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Active filters bar (populated by offcanvas plugin via JS) -->
    <div class="d-none" id="<?= htmlspecialchars($id) ?>-active-filters"></div>

    <!-- Table -->
    <div class="table-responsive position-relative">

        <!-- Loading overlay -->
        <div class="flt-loader" id="<?= htmlspecialchars($id) ?>-loader" aria-live="polite" aria-busy="false" style="visibility:hidden">
            <div class="flt-loader-inner">
                <div class="spinner-border text-secondary" role="status">
                    <span class="visually-hidden"><?= htmlspecialchars($l('loading', 'Loading...')) ?></span>
                </div>
                <span class="visually-hidden flt-loader-text"></span>
            </div>
        </div>

        <table class="table table-vcenter card-table" aria-label="<?= htmlspecialchars($title ?? $l('tableLabel', 'Data table')) ?>">
            <thead>
                <tr>
                    <?php if ($bulkField !== null): ?>
                    <th style="width:1%"><input type="checkbox" class="form-check-input flt-select-all" data-table="<?= htmlspecialchars($id) ?>" aria-label="<?= htmlspecialchars($l('selectAll', 'Select all')) ?>"></th>
                    <?php endif; ?>
                    <?php foreach ($visibleColumns as $col): ?>
                    <th<?= !empty($col['width']) ? ' style="width:' . htmlspecialchars($col['width']) . '"' : '' ?>
                        <?= ($col['align'] ?? 'left') !== 'left' ? ' class="text-' . htmlspecialchars($col['align']) . '"' : '' ?>>
                        <?php if ($col['sortable'] ?? true): ?>
                            <button class="table-sort d-flex align-items-center gap-1 flt-sort"
                                    data-table="<?= htmlspecialchars($id) ?>"
                                    data-field="<?= htmlspecialchars($col['field']) ?>">
                                <?= htmlspecialchars($col['name']) ?>
                            </button>
                        <?php else: ?>
                            <?= htmlspecialchars($col['name']) ?>
                        <?php endif; ?>
                    </th>
                    <?php endforeach; ?>
                    <?php if ($expandable === 'button'): ?>
                    <th style="width:1%"></th>
                    <?php endif; ?>
                </tr>
            </thead>
            <tbody id="<?= htmlspecialchars($id) ?>-tbody">
                <!-- JS fills this -->
            </tbody>
        </table>

        <!-- Empty state -->
        <div class="flt-empty d-none" id="<?= htmlspecialchars($id) ?>-empty">
            <div class="empty">
                <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                         stroke-linejoin="round" class="icon icon-lg">
                        <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                        <path d="M4 8v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-8"></path>
                        <path d="M10 12l2 2l4 -4"></path>
                    </svg>
                </div>
                <p class="empty-title"><?= htmlspecialchars($decoded['emptyState']['message'] ?? $l('empty', 'No results found')) ?></p>
            </div>
        </div>

    </div>

    <!-- Footer: page size + pagination -->
    <div class="card-footer d-flex align-items-center">

        <div class="dropdown">
            <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="flt-per-page-label" data-table="<?= htmlspecialchars($id) ?>">
                    <?= (int) ($decoded['pageSizes'][0] ?? 20) ?>
                </span>
                <span class="ms-1"><?= htmlspecialchars($l('records', 'records')) ?></span>
            </button>
            <ul class="dropdown-menu">
                <?php foreach ($decoded['pageSizes'] as $size): ?>
                <li><button type="button" class="dropdown-item flt-page-size"
                   data-table="<?= htmlspecialchars($id) ?>"
                   data-value="<?= (int) $size ?>">
                    <?= (int) $size ?> <?= htmlspecialchars($l('records', 'records')) ?>
                </button></li>
                <?php endforeach; ?>
            </ul>
        </div>

        <ul class="pagination m-0 ms-auto" id="<?= htmlspecialchars($id) ?>-pagination" aria-label="<?= htmlspecialchars($l('pagination', 'Table pagination')) ?>">
            <!-- JS fills this -->
        </ul>

    </div>

</div>

<script>
(function () {
    var cfg = <?= $config ?>;
    if (window.FluentTable) {
        window.FluentTable.init(cfg);
    } else {
        document.addEventListener('FluentTableReady', function () {
            window.FluentTable.init(cfg);
        });
    }
})();
</script>