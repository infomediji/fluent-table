<?php

namespace Infomediji\FluentTable\Casts;

final class MutedTextCast extends AbstractCast
{
    private function __construct(
        private readonly ?string $placeholder = '—',
    ) {
    }

    public static function make(?string $placeholder = '—'): self
    {
        return new self($placeholder);
    }

    protected function type(): string
    {
        return 'muted-text';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'placeholder' => $this->placeholder,
        ];
    }
}
