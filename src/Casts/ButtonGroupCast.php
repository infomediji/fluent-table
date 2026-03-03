<?php

namespace Infomediji\FluentTable\Casts;

final class ButtonGroupCast extends AbstractCast
{
    /** @var list<ButtonCast|IconButtonCast> */
    private array $buttons = [];

    private function __construct() {}

    public static function make(): self
    {
        return new self();
    }

    public function add(ButtonCast|IconButtonCast $button): self
    {
        $clone = clone $this;
        $clone->buttons[] = $button;
        return $clone;
    }

    protected function type(): string
    {
        return 'button-group';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'buttons' => array_map(static fn(ButtonCast|IconButtonCast $b): array => $b->toArray(), $this->buttons),
        ];
    }
}
