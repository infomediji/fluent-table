<?php

namespace Infomediji\FluentTable\Casts;

final class CheckboxCast extends AbstractCast
{
    private function __construct(
        private readonly ?string $url = null,
        private readonly string $field = 'active',
        private mixed $trueValue = true,
        private mixed $falseValue = false,
        private bool $readOnly = false,
        private bool $disabled = false,
    ) {
    }

    /**
     * Interactive checkbox that POSTs on change.
     *
     * @param string $url   POST URL with {field} placeholders
     * @param string $field Name of the field being toggled (sent in POST body)
     */
    public static function make(string $url, string $field = 'active'): self
    {
        self::assertSafeUrl($url, 'CheckboxCast URL');
        return new self($url, $field);
    }

    /** Display-only checkbox — shows the value, no interaction. */
    public static function display(): self
    {
        return new self();
    }

    public function readOnly(): self
    {
        return $this->with('readOnly', true);
    }

    public function disabled(): self
    {
        return $this->with('disabled', true);
    }

    /** Custom true/false values (e.g. 1/0, 'yes'/'no'). */
    public function values(mixed $trueValue, mixed $falseValue): self
    {
        if ($trueValue === null && $falseValue === null) {
            throw new \InvalidArgumentException('At least one of trueValue or falseValue must be non-null.');
        }
        $clone = clone $this;
        $clone->trueValue = $trueValue;
        $clone->falseValue = $falseValue;
        return $clone;
    }

    protected function type(): string
    {
        return 'checkbox';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        $cfg = [
            'field'      => $this->field,
            'trueValue'  => $this->trueValue,
            'falseValue' => $this->falseValue,
        ];

        if ($this->url !== null) {
            $cfg['url'] = $this->url;
        }
        if ($this->readOnly) {
            $cfg['readOnly'] = true;
        }
        if ($this->disabled) {
            $cfg['disabled'] = true;
        }

        return $cfg;
    }
}
