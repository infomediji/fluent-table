<?php

namespace Infomediji\FluentTable\Casts;

final class DateCast extends AbstractCast
{
    private function __construct(
        private readonly string $format,
        private readonly bool $withTime = false,
    ) {}

    public static function make(string $format = 'd M Y'): self
    {
        if ($format === '') {
            throw new \InvalidArgumentException('DateCast format must not be empty.');
        }
        return new self($format, false);
    }

    public static function withTime(string $format = 'd M Y H:i'): self
    {
        if ($format === '') {
            throw new \InvalidArgumentException('DateCast format must not be empty.');
        }
        return new self($format, true);
    }

    protected function type(): string
    {
        return 'date';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'format'   => $this->format,
            'withTime' => $this->withTime,
        ];
    }
}
