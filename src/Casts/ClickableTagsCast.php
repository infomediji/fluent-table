<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\Color;

final class ClickableTagsCast extends AbstractCast
{
    private function __construct(
        private readonly string $url,
        private readonly Color|string $color = 'secondary',
        private readonly ?string $labelField = null,
        private readonly ?string $valueField = null,
    ) {
    }

    /**
     * @param string       $url        URL with {value} placeholder (or {field} from item)
     * @param Color|string $color      Badge color
     * @param string|null  $labelField If items are objects, field to use as label
     * @param string|null  $valueField If items are objects, field to use in URL placeholder
     */
    public static function make(
        string $url,
        Color|string $color = 'secondary',
        ?string $labelField = null,
        ?string $valueField = null,
    ): self {
        return new self($url, $color, $labelField, $valueField);
    }

    protected function type(): string
    {
        return 'clickable-tags';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'        => $this->url,
            'color'      => self::resolveEnum($this->color),
            'labelField' => $this->labelField,
            'valueField' => $this->valueField,
        ];
    }
}
