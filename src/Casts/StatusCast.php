<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\Color;

final class StatusCast extends AbstractCast
{
    /** @param array<string, Color|string> $map */
    private function __construct(
        private readonly array $map,
        private readonly Color|string $default = 'secondary',
    ) {}

    /**
     * @param array<string, Color|string> $map value => color
     */
    public static function make(array $map, Color|string $default = 'secondary'): self
    {
        return new self($map, $default);
    }

    protected function type(): string
    {
        return 'status';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'map'     => array_map(static fn(Color|string $v): string => self::resolveEnum($v) ?? '', $this->map),
            'default' => self::resolveEnum($this->default),
        ];
    }
}
