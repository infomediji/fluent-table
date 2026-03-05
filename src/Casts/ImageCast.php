<?php

namespace Infomediji\FluentTable\Casts;

final class ImageCast extends AbstractCast
{
    private function __construct(
        private readonly string $width = '48px',
        private readonly string $height = '48px',
        private readonly bool $rounded = false,
    ) {
    }

    public static function make(string $width = '48px', string $height = '48px'): self
    {
        return new self($width, $height);
    }

    public static function rounded(string $width = '48px', string $height = '48px'): self
    {
        return new self($width, $height, true);
    }

    protected function type(): string
    {
        return 'image';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'width'   => $this->width,
            'height'  => $this->height,
            'rounded' => $this->rounded,
        ];
    }
}
