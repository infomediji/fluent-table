<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\Color;
use Infomediji\FluentTable\Icon;

final class IconCast extends AbstractCast
{
    /** @param array<string, Icon|string>|null $map */
    private function __construct(
        private readonly Icon|string|null $icon = null,
        private readonly ?array $map = null,
        private readonly Color|string|null $color = null,
    ) {}

    /**
     * Static icon — always the same regardless of value.
     * e.g. IconCast::static(Icon::Check, Color::Success)
     */
    public static function static(Icon|string $icon, Color|string|null $color = null): self
    {
        return new self($icon, null, $color);
    }

    /**
     * Icon mapped from cell value.
     * e.g. IconCast::mapped(['active' => Icon::Check, 'inactive' => Icon::X])
     *
     * @param array<string, Icon|string> $map
     */
    public static function mapped(array $map, Color|string|null $color = null): self
    {
        return new self(null, $map, $color);
    }

    protected function type(): string
    {
        return 'icon';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'icon'  => self::resolveEnum($this->icon),
            'map'   => $this->map !== null
                ? array_map(static fn(Icon|string $v): string => self::resolveEnum($v) ?? '', $this->map)
                : null,
            'color' => self::resolveEnum($this->color),
        ];
    }
}
