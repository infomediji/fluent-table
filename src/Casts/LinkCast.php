<?php

namespace Infomediji\FluentTable\Casts;

final class LinkCast extends AbstractCast
{
    private function __construct(
        private readonly string $url,
        private readonly ?string $label = null,
        private bool $blank = false,
    ) {}

    /**
     * @param string      $url   URL with {field} placeholders, e.g. '/scenes/{scene._id}'
     * @param string|null $label Label with {field} placeholders. Null = use cell value.
     */
    public static function make(string $url, ?string $label = null): self
    {
        self::assertSafeUrl($url, 'LinkCast URL');
        return new self($url, $label);
    }

    public function blank(): self
    {
        return $this->with('blank', true);
    }

    protected function type(): string
    {
        return 'link';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'url'   => $this->url,
            'label' => $this->label,
            'blank' => $this->blank ? true : null,
        ];
    }
}
