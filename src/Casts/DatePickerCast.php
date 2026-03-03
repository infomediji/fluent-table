<?php

namespace Infomediji\FluentTable\Casts;

final class DatePickerCast extends AbstractCast
{
    private function __construct(
        private readonly string $url,
        private readonly string $field,
        private readonly string $format = 'Y-m-d',
        private ?string $minDate = null,
        private ?string $maxDate = null,
        private bool $nullable = false,
    ) {}

    /**
     * @param string $url    POST URL with {field} placeholders
     * @param string $field  Name of the field being updated (sent in POST body)
     * @param string $format Date format for display and POST value
     */
    public static function make(string $url, string $field, string $format = 'Y-m-d'): self
    {
        return new self($url, $field, $format);
    }

    public function min(string $date): self
    {
        return $this->with('minDate', $date);
    }

    public function max(string $date): self
    {
        return $this->with('maxDate', $date);
    }

    public function nullable(): self
    {
        return $this->with('nullable', true);
    }

    protected function type(): string
    {
        return 'datepicker';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'      => $this->url,
            'field'    => $this->field,
            'format'   => $this->format,
            'minDate'  => $this->minDate,
            'maxDate'  => $this->maxDate,
            'nullable' => $this->nullable ? true : null,
        ];
    }
}
