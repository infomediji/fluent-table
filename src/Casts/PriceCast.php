<?php

namespace Infomediji\FluentTable\Casts;

final class PriceCast extends AbstractCast
{
    private function __construct(
        private readonly string $currency = 'USD',
        private readonly string $locale = 'en-US',
    ) {}

    public static function make(string $currency = 'USD', string $locale = 'en-US'): self
    {
        if ($currency === '') {
            throw new \InvalidArgumentException('PriceCast currency must not be empty.');
        }
        if ($locale === '') {
            throw new \InvalidArgumentException('PriceCast locale must not be empty.');
        }
        return new self($currency, $locale);
    }

    protected function type(): string
    {
        return 'price';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'currency' => $this->currency,
            'locale'   => $this->locale,
        ];
    }
}
