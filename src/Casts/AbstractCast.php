<?php

namespace Infomediji\FluentTable\Casts;

abstract class AbstractCast implements CastInterface
{
    abstract protected function type(): string;

    /** @return array<string, mixed> */
    abstract protected function config(): array;

    protected function with(string $property, mixed $value): static
    {
        $clone = clone $this;
        /** @phpstan-ignore property.dynamicName */
        $clone->$property = $value;
        return $clone;
    }

    protected static function resolveEnum(\BackedEnum|string|null $value): ?string
    {
        return $value instanceof \BackedEnum ? (string) $value->value : $value;
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
