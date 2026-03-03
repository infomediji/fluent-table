<?php

namespace Infomediji\FluentTable\Casts;

use Infomediji\FluentTable\ButtonStyle;

final class ModalButtonCast extends AbstractCast
{
    /** @param array<string, string> $fields */
    private function __construct(
        private readonly string $target,
        private readonly string $label,
        private readonly ButtonStyle|string $style = 'ghost-primary',
        private array $fields = [],
    ) {}

    /**
     * @param string             $target CSS selector of Bootstrap modal, e.g. '#editModal'
     * @param string             $label  Button label
     * @param ButtonStyle|string $style  ButtonStyle::*
     */
    public static function make(string $target, string $label, ButtonStyle|string $style = 'ghost-primary'): self
    {
        return new self($target, $label, $style);
    }

    /**
     * Row fields to pass into modal as data-* attributes.
     * e.g. ->withFields(['id' => '_id', 'title' => 'scene.title'])
     *
     * @param array<string, string> $fields
     */
    public function withFields(array $fields): self
    {
        return $this->with('fields', $fields);
    }

    protected function type(): string
    {
        return 'modal-button';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'target' => $this->target,
            'label'  => $this->label,
            'style'  => self::resolveEnum($this->style),
            'fields' => $this->fields !== [] ? $this->fields : null,
        ];
    }
}
