<?php

namespace Infomediji\FluentTable;

use Infomediji\FluentTable\Casts\CastInterface;

final class Column
{
    private ?CastInterface $cast = null;
    private bool $hidden = false;
    private string $align = 'left';
    private bool $sortable = true;
    private ?string $width = null;
    private bool $searchable = false;
    private ?string $searchField = null;

    public function __construct(
        private readonly string $name,
        private readonly string $field,
    ) {}

    public function setCast(CastInterface $cast): void
    {
        $this->cast = $cast;
    }

    public function setHidden(bool $hidden): void
    {
        $this->hidden = $hidden;
    }

    public function setAlign(string $align): void
    {
        if (!in_array($align, ['left', 'center', 'right'], true)) {
            throw new \InvalidArgumentException("Invalid align value '$align'. Allowed: left, center, right.");
        }
        $this->align = $align;
    }

    public function setSortable(bool $sortable): void
    {
        $this->sortable = $sortable;
    }

    public function setWidth(string $width): void
    {
        $this->width = $width;
    }

    public function setSearchable(bool $searchable, ?string $field = null): void
    {
        $this->searchable = $searchable;
        $this->searchField = $field;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getField(): string
    {
        return $this->field;
    }

    public function isHidden(): bool
    {
        return $this->hidden;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return array_filter([
            'name'        => $this->name,
            'field'       => $this->field,
            'hidden'      => $this->hidden ? true : null,
            'align'       => $this->align !== 'left' ? $this->align : null,
            'sortable'    => $this->sortable ? null : false,
            'width'       => $this->width,
            'searchable'  => $this->searchable ? true : null,
            'searchField' => $this->searchField,
            'cast'        => $this->cast?->toArray(),
        ], fn($v) => $v !== null);
    }
}
