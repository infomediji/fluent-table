<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\Color;

final class BadgeCast extends AbstractCast
{
    /** @param array<string, Color|string> $map */
    private function __construct(
        private readonly array $map,
        private readonly Color|string|null $default = 'secondary',
    ) {}

    /**
     * @param array<string, Color|string> $map value => Color constant
     *                                         e.g. ['pending' => 'warning', 'approved' => 'success']
     */
    public static function make(array $map, Color|string|null $default = 'secondary'): self
    {
        return new self($map, $default);
    }

    protected function type(): string
    {
        return 'badge';
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
