<?php

namespace Infomediji\FluentTable\Casts;

final class FileSizeCast extends AbstractCast
{
    private function __construct(
        private readonly int $decimals = 1,
    ) {
    }

    public static function make(int $decimals = 1): self
    {
        if ($decimals < 0) {
            throw new \InvalidArgumentException('FileSizeCast decimals must not be negative, got ' . $decimals);
        }
        return new self($decimals);
    }

    protected function type(): string
    {
        return 'filesize';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'decimals' => $this->decimals,
        ];
    }
}
