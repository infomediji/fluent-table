<?php

namespace Infomediji\FluentTable\Casts;

final class ModalTextCast extends AbstractCast
{
    /** @param array<string, string> $fields */
    private function __construct(
        private readonly string $target,
        private readonly ?string $label = null,
        private array $fields = [],
    ) {}

    /**
     * @param string      $target CSS selector of Bootstrap modal, e.g. '#viewModal'
     * @param string|null $label  Link label with {field} placeholders. Null = use cell value.
     */
    public static function make(string $target, ?string $label = null): self
    {
        return new self($target, $label);
    }

    /** @param array<string, string> $fields */
    public function withFields(array $fields): self
    {
        return $this->with('fields', $fields);
    }

    protected function type(): string
    {
        return 'modal-text';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'target' => $this->target,
            'label'  => $this->label,
            'fields' => $this->fields !== [] ? $this->fields : null,
        ];
    }
}
