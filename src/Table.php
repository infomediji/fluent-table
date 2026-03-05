<?php

namespace Infomediji\FluentTable;

use Infomediji\FluentTable\Casts\CastInterface;

final class Table
{
    /** @var list<Column> */
    private array $columns = [];
    private ?Column $currentColumn = null;
    /** @var list<int> */
    private array $pageSizes = [20, 50, 100];
    /** @var array{col: string|null, dir: string} */
    private array $defaultSort = ['col' => null, 'dir' => 'asc'];
    private ?string $emptyMessage = 'No results found';
    private ?string $emptyIcon = 'inbox';
    private ?string $title = null;
    private ?string $description = null;
    /** @var list<array{label: string, param: string, options: array<string, string>, value: string}> */
    private array $filters = [];
    private bool $remoteFilters = false;
    private bool $trackUrl = false;
    /** @var list<array{label: string, url: string, icon: string|null}> */
    private array $actions = [];
    private ?string $bulkField = null;
    private string|false $expandable = false;
    /** @var array<string, string> */
    private array $labels = [];
    private static int $instanceCount = 0;
    private string $uniqueId;

    private static bool $assetsPublished = false;

    private function __construct(private readonly string $endpoint)
    {
        self::$instanceCount++;
        $this->uniqueId = 'flt-' . self::$instanceCount;
    }

    public static function make(string $endpoint): self
    {
        return new self($endpoint);
    }

    // -------------------------------------------------------------------------
    // Column definition
    // -------------------------------------------------------------------------

    public function column(string $name, string $field): self
    {
        $column = new Column($name, $field);
        $this->columns[] = $column;
        $this->currentColumn = $column;
        return $this;
    }

    // -------------------------------------------------------------------------
    // Column modifiers — apply to the last defined column
    // -------------------------------------------------------------------------

    public function cast(CastInterface $cast): self
    {
        $this->lastColumn()->setCast($cast);
        return $this;
    }

    public function hidden(): self
    {
        $this->lastColumn()->setHidden(true);
        return $this;
    }

    public function center(): self
    {
        $this->lastColumn()->setAlign('center');
        return $this;
    }

    public function right(): self
    {
        $this->lastColumn()->setAlign('right');
        return $this;
    }

    public function noSort(): self
    {
        $this->lastColumn()->setSortable(false);
        return $this;
    }

    public function width(string $width): self
    {
        $this->lastColumn()->setWidth($width);
        return $this;
    }

    /**
     * Mark the last column as searchable.
     * @param string|null $field Override the search field (dot-notation). Null = use column field.
     */
    public function searchable(?string $field = null): self
    {
        $this->lastColumn()->setSearchable(true, $field);
        return $this;
    }

    // -------------------------------------------------------------------------
    // Table-level options
    // -------------------------------------------------------------------------

    public function defaultSort(string $col, string $dir = 'asc'): self
    {
        if ($col === '') {
            throw new \InvalidArgumentException('Sort column must not be empty.');
        }
        if (!in_array($dir, ['asc', 'desc'], true)) {
            throw new \InvalidArgumentException("Invalid sort direction '$dir'. Allowed: asc, desc.");
        }
        $this->defaultSort = ['col' => $col, 'dir' => $dir];
        return $this;
    }

    /**
     * @param list<int> $sizes
     */
    public function pageSizes(array $sizes): self
    {
        if ($sizes === []) {
            throw new \InvalidArgumentException('Page sizes must not be empty.');
        }
        foreach ($sizes as $size) {
            if ($size <= 0) {
                throw new \InvalidArgumentException("Each page size must be a positive integer, got: " . var_export($size, true));
            }
        }
        $this->pageSizes = $sizes;
        return $this;
    }

    public function emptyState(string $message, string $icon = 'inbox'): self
    {
        $this->emptyMessage = $message;
        $this->emptyIcon = $icon;
        return $this;
    }

    public function title(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function description(string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function action(string $label, string $url, ?Icon $icon = null): self
    {
        $parsed = parse_url($url);
        if ($parsed === false) {
            throw new \InvalidArgumentException("Malformed action URL.");
        }
        if (str_starts_with($url, '//')) {
            throw new \InvalidArgumentException("Protocol-relative URLs are not allowed in actions.");
        }
        if (isset($parsed['scheme']) && !in_array(strtolower($parsed['scheme']), ['http', 'https'], true)) {
            throw new \InvalidArgumentException("Invalid URL scheme in action URL. Only http/https or relative URLs are allowed.");
        }
        $this->actions[] = [
            'label' => $label,
            'url'   => $url,
            'icon'  => $icon?->value,
        ];
        return $this;
    }

    public function bulkActions(string $field): self
    {
        $this->bulkField = $field;
        return $this;
    }

    /**
     * Enable expandable rows — open a detail panel below a row.
     *
     * @param string $trigger 'row' = click anywhere on row, 'button' = chevron button in last column
     */
    public function expandable(string $trigger = 'row'): self
    {
        if (!in_array($trigger, ['row', 'button'], true)) {
            throw new \InvalidArgumentException("Invalid expandable trigger '$trigger'. Allowed: row, button.");
        }
        $this->expandable = $trigger;
        return $this;
    }

    /**
     * Add a dropdown filter to the table header.
     *
     * @param string               $label   Label shown above/beside the select
     * @param string               $param   Query-string param sent to the endpoint (e.g. 'status_filter')
     * @param array<string, string> $options [value => label] pairs; include '' => 'All ...' as first option
     * @param string               $default Initially selected value (empty string = "all")
     */
    public function filter(string $label, string $param, array $options, string $default = ''): self
    {
        $this->filters[] = [
            'label'   => $label,
            'param'   => $param,
            'options' => $options,
            'value'   => $default,
        ];
        return $this;
    }

    /**
     * Sync search, sort, page and filters to the URL query string.
     * Enables sharing links with active state.
     */
    public function trackUrl(): self
    {
        $this->trackUrl = true;
        return $this;
    }

    /**
     * Enable remote filters — the backend sends filter definitions in meta.filters,
     * and FluentTable dispatches events for an external offcanvas plugin to handle.
     */
    public function remoteFilters(): self
    {
        $this->remoteFilters = true;
        return $this;
    }

    /**
     * Override UI labels for localization.
     *
     * Supported keys: records, filters, search, loading, empty, error
     *
     * @param array<string, string> $labels
     */
    public function locale(array $labels): self
    {
        $this->labels = $labels;
        return $this;
    }

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    public function render(): string
    {
        $assets = $this->publishAssets();
        $decoded = $this->buildConfig();
        $config  = json_encode($decoded, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

        $id = $this->uniqueId;
        ob_start();
        try {
            include __DIR__ . '/../Templates/table.php';
        } catch (\Throwable $e) {
            ob_end_clean();
            throw $e;
        }
        $html = ob_get_clean();
        return $assets . ($html !== false ? $html : '');
    }

    // -------------------------------------------------------------------------
    // Internals
    // -------------------------------------------------------------------------

    private function lastColumn(): Column
    {
        if ($this->currentColumn === null) {
            throw new \LogicException('No column defined. Call column() before using column modifiers.');
        }
        return $this->currentColumn;
    }

    /** @return array<string, mixed> */
    private function buildConfig(): array
    {
        $config = [
            '_v'          => 1,
            'id'          => $this->uniqueId,
            'endpoint'    => $this->endpoint,
            'pageSizes'   => $this->pageSizes,
            'defaultSort' => $this->defaultSort,
            'emptyState'  => [
                'message' => $this->emptyMessage,
                'icon'    => $this->emptyIcon,
            ],
            'columns' => array_map(static fn(Column $c): array => $c->toArray(), $this->columns),
        ];

        if ($this->title !== null)       $config['title']       = $this->title;
        if ($this->description !== null) $config['description'] = $this->description;
        if ($this->actions !== [])       $config['actions']     = $this->actions;
        if ($this->bulkField !== null)   $config['bulkField']   = $this->bulkField;
        if ($this->expandable !== false)  $config['expandable']  = $this->expandable;
        if ($this->filters !== [])       $config['filters']     = $this->filters;
        if ($this->remoteFilters)        $config['remoteFilters'] = true;
        if ($this->trackUrl)             $config['trackUrl']      = true;
        if ($this->labels !== [])       $config['labels']      = $this->labels;

        return $config;
    }

    /**
     * Copies CSS and JS assets to the public directory.
     *
     * Requires the host application to define the PUBLIC_HTML_PATH constant
     * pointing to the document root (e.g. define('PUBLIC_HTML_PATH', '/var/www/html')).
     * Assets are published to PUBLIC_HTML_PATH/s/widgets/fluent_table/ with cache-busting
     * timestamps in the filename.
     */
    private function publishAssets(): string
    {
        if (self::$assetsPublished) {
            return '';
        }

        if (!defined('PUBLIC_HTML_PATH')) {
            throw new \RuntimeException('PUBLIC_HTML_PATH constant is not defined. Define it before calling render().');
        }

        $realPublic = realpath(PUBLIC_HTML_PATH);
        if ($realPublic === false) {
            throw new \RuntimeException('PUBLIC_HTML_PATH does not exist: ' . PUBLIC_HTML_PATH);
        }

        $resourcesDir = __DIR__ . '/../Resources/';
        $publicDir = $realPublic . '/s/widgets/fluent_table/';

        if (!is_dir($publicDir) && !mkdir($publicDir, 0755, true) && !is_dir($publicDir)) {
            throw new \RuntimeException('Failed to create directory: ' . $publicDir);
        }

        $tags = '';
        foreach (['table.css', 'table.js', 'integration.js'] as $file) {
            $source = $resourcesDir . $file;
            if (!file_exists($source)) {
                continue;
            }

            $ext  = pathinfo($file, PATHINFO_EXTENSION);
            $base = pathinfo($file, PATHINFO_FILENAME);
            $mtime = filemtime($source);
            $timestamped = $base . '.' . ($mtime !== false ? $mtime : 0) . '.' . $ext;
            $dest = $publicDir . $timestamped;

            if (!file_exists($dest)) {
                $tmp = $dest . '.tmp.' . getmypid();
                if (!copy($source, $tmp)) {
                    @unlink($tmp);
                    throw new \RuntimeException('Failed to copy asset: ' . $source);
                }
                if (!rename($tmp, $dest)) {
                    @unlink($tmp);
                    throw new \RuntimeException('Failed to rename asset: ' . $tmp);
                }
                // Clean old versions only after new file is confirmed
                $matches = glob($publicDir . $base . '.*.' . $ext);
                foreach ($matches !== false ? $matches : [] as $old) {
                    if ($old !== $dest) {
                        @unlink($old);
                    }
                }
            }

            $url = '/s/widgets/fluent_table/' . $timestamped;
            $tags .= $ext === 'css'
                ? '<link rel="stylesheet" href="' . $url . '">'
                : '<script src="' . $url . '"></script>';
        }

        self::$assetsPublished = true;

        return $tags;
    }

    /**
     * Reset instance counter (for persistent runtimes like Swoole/Octane).
     */
    public static function resetInstanceCount(): void
    {
        self::$instanceCount = 0;
    }

    /**
     * Reset assets published flag so assets are re-published on next render.
     */
    public static function resetAssets(): void
    {
        self::$assetsPublished = false;
    }

    /**
     * Reset all static state between requests (for persistent runtimes like Swoole/Octane).
     */
    public static function resetState(): void
    {
        self::resetInstanceCount();
        self::resetAssets();
    }

    public function getUniqueId(): string
    {
        return $this->uniqueId;
    }
}
