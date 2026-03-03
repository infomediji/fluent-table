<?php

namespace Infomediji\FluentTable\Casts;

final class HiddenCast extends AbstractCast
{
    private function __construct() {}

    public static function make(): self
    {
        return new self();
    }

    protected function type(): string
    {
        return 'hidden';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [];
    }
}
