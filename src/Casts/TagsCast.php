<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\Color;

final class TagsCast extends AbstractCast
{
    private function __construct(
        private readonly Color|string $color = 'secondary',
        private readonly ?string $labelField = null,
    ) {
    }

    /**
     * @param Color|string $color      Badge color (Color::*)
     * @param string|null  $labelField If value is array of objects, which field to use as label
     */
    public static function make(Color|string $color = 'secondary', ?string $labelField = null): self
    {
        return new self($color, $labelField);
    }

    protected function type(): string
    {
        return 'tags';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'color'      => self::resolveEnum($this->color),
            'labelField' => $this->labelField,
        ];
    }
}
