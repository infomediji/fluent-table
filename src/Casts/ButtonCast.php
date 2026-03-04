<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\ButtonStyle;

final class ButtonCast extends AbstractCast
{
    /** @param array<string, mixed> $payload */
    private function __construct(
        private readonly string $url,
        private readonly string $label,
        private readonly ButtonStyle|string $style = 'ghost-primary',
        private ?string $confirm = null,
        private array $payload = [],
    ) {}

    /**
     * @param string             $url   POST URL with {field} placeholders
     * @param string             $label Button label
     * @param ButtonStyle|string $style ButtonStyle::*
     */
    public static function make(string $url, string $label, ButtonStyle|string $style = 'ghost-primary'): self
    {
        self::assertSafeUrl($url, 'ButtonCast URL');
        return new self($url, $label, $style);
    }

    public function confirm(string $message): self
    {
        return $this->with('confirm', $message);
    }

    /**
     * Extra fields to include in POST body (from row data via {field} placeholders).
     * e.g. ->withPayload(['id' => '{_id}', 'status' => 'approved'])
     *
     * @param array<string, mixed> $payload
     */
    public function withPayload(array $payload): self
    {
        return $this->with('payload', $payload);
    }

    protected function type(): string
    {
        return 'button';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'     => $this->url,
            'label'   => $this->label,
            'style'   => self::resolveEnum($this->style),
            'confirm' => $this->confirm,
            'payload' => $this->payload !== [] ? $this->payload : null,
        ];
    }
}
