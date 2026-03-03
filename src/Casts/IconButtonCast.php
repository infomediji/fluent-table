<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\ButtonStyle;
use Infomediji\FluentTable\Icon;

final class IconButtonCast extends AbstractCast
{
    /** @param array<string, mixed> $payload */
    private function __construct(
        private readonly string $url,
        private readonly Icon|string $icon,
        private readonly ButtonStyle|string $style = 'ghost-secondary',
        private ?string $tooltip = null,
        private ?string $confirm = null,
        private array $payload = [],
    ) {}

    /**
     * @param string             $url  POST URL with {field} placeholders
     * @param Icon|string        $icon Icon::* constant
     * @param ButtonStyle|string $style
     */
    public static function make(string $url, Icon|string $icon, ButtonStyle|string $style = 'ghost-secondary'): self
    {
        return new self($url, $icon, $style);
    }

    public function tooltip(string $text): self
    {
        return $this->with('tooltip', $text);
    }

    public function confirm(string $message): self
    {
        return $this->with('confirm', $message);
    }

    /** @param array<string, mixed> $payload */
    public function withPayload(array $payload): self
    {
        return $this->with('payload', $payload);
    }

    protected function type(): string
    {
        return 'icon-button';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'     => $this->url,
            'icon'    => self::resolveEnum($this->icon),
            'style'   => self::resolveEnum($this->style),
            'tooltip' => $this->tooltip,
            'confirm' => $this->confirm,
            'payload' => $this->payload !== [] ? $this->payload : null,
        ];
    }
}
