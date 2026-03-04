<?php

namespace Infomediji\FluentTable\Casts;

abstract class AbstractCast implements CastInterface
{
    abstract protected function type(): string;

    /** @return array<string, mixed> */
    abstract protected function config(): array;

    protected function with(string $property, mixed $value): static
    {
        if (!property_exists($this, $property)) {
            throw new \LogicException(sprintf('Property "%s" does not exist on %s.', $property, static::class));
        }
        $clone = clone $this;
        /** @phpstan-ignore property.dynamicName */
        $clone->$property = $value;
        return $clone;
    }

    protected static function resolveEnum(\BackedEnum|string|null $value): ?string
    {
        return $value instanceof \BackedEnum ? (string) $value->value : $value;
    }

    /**
     * Validate a URL template (may contain {field} placeholders).
     * Blocks protocol-relative URLs and dangerous schemes.
     */
    protected static function assertSafeUrl(string $url, string $context = 'URL'): void
    {
        if (str_starts_with($url, '//')) {
            throw new \InvalidArgumentException("Protocol-relative URLs are not allowed in $context.");
        }
        // Strip placeholders before parsing to avoid parse_url misinterpreting them
        $stripped = preg_replace('/\{[^}]+\}/', 'x', $url);
        $parsed = parse_url($stripped ?? $url);
        if ($parsed !== false && isset($parsed['scheme']) && !in_array(strtolower($parsed['scheme']), ['http', 'https'], true)) {
            throw new \InvalidArgumentException("Invalid URL scheme in $context. Only http/https or relative URLs are allowed.");
        }
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['type' => $this->type()] + array_filter(
            $this->config(),
            static fn($v) => $v !== null,
        );
    }
}
