<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\ButtonStyle;

final class DownloadLinkCast extends AbstractCast
{
    private function __construct(
        private readonly ?string $url = null,
        private readonly string $label = 'Download',
        private readonly ButtonStyle|string $style = 'ghost-primary',
    ) {}

    /**
     * @param string|null        $url   URL with {field} placeholders. Null = use cell value as URL.
     * @param string             $label Button label
     * @param ButtonStyle|string $style ButtonStyle::*
     */
    public static function make(?string $url = null, string $label = 'Download', ButtonStyle|string $style = 'ghost-primary'): self
    {
        return new self($url, $label, $style);
    }

    protected function type(): string
    {
        return 'download';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'   => $this->url,
            'label' => $this->label,
            'style' => self::resolveEnum($this->style),
        ];
    }
}
