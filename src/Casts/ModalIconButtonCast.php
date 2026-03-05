<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\ButtonStyle;
use Infomediji\FluentTable\Icon;

final class ModalIconButtonCast extends AbstractCast
{
    /** @param array<string, string> $fields */
    private function __construct(
        private readonly string $target,
        private readonly Icon|string $icon,
        private readonly ButtonStyle|string $style = 'ghost-secondary',
        private ?string $tooltip = null,
        private array $fields = [],
    ) {
    }

    /**
     * @param string             $target CSS selector of Bootstrap modal, e.g. '#editModal'
     * @param Icon|string        $icon   Icon::* constant
     * @param ButtonStyle|string $style  ButtonStyle::*
     */
    public static function make(string $target, Icon|string $icon, ButtonStyle|string $style = 'ghost-secondary'): self
    {
        return new self($target, $icon, $style);
    }

    public function tooltip(string $text): self
    {
        return $this->with('tooltip', $text);
    }

    /** @param array<string, string> $fields */
    public function withFields(array $fields): self
    {
        return $this->with('fields', $fields);
    }

    protected function type(): string
    {
        return 'modal-icon-button';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'target'  => $this->target,
            'icon'    => self::resolveEnum($this->icon),
            'style'   => self::resolveEnum($this->style),
            'tooltip' => $this->tooltip,
            'fields'  => $this->fields !== [] ? $this->fields : null,
        ];
    }
}
