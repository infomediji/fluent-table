<?php

namespace Infomediji\FluentTable\Casts;

final class SelectCast extends AbstractCast
{
    /** @param array<string, string> $options */
    private function __construct(
        private readonly string $url,
        private readonly string $field,
        private array $options = [],
        private ?string $optionsFrom = null,
    ) {}

    /**
     * @param string $url   POST URL with {field} placeholders
     * @param string $field Name of the field being updated (sent in POST body)
     */
    public static function make(string $url, string $field): self
    {
        return new self($url, $field);
    }

    /**
     * Static options list.
     * e.g. ->options(['pending' => 'Pending', 'approved' => 'Approved'])
     *
     * @param array<string, string> $options
     */
    public function options(array $options): self
    {
        return $this->with('options', $options);
    }

    /**
     * Load options dynamically from a URL (GET, returns [{value, label}]).
     */
    public function optionsFrom(string $url): self
    {
        return $this->with('optionsFrom', $url);
    }

    protected function type(): string
    {
        return 'select';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'         => $this->url,
            'field'       => $this->field,
            'options'     => $this->options !== [] ? $this->options : null,
            'optionsFrom' => $this->optionsFrom,
        ];
    }
}
