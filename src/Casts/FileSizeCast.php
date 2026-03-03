<?php

namespace Infomediji\FluentTable\Casts;

final class FileSizeCast extends AbstractCast
{
    private function __construct(
        private readonly int $decimals = 1,
    ) {}

    public static function make(int $decimals = 1): self
    {
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
