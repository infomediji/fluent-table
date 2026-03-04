<?php

namespace Infomediji\FluentTable\Casts;

final class EntityCast extends AbstractCast
{
    private function __construct(
        private readonly string $title,
        private ?string $avatar = null,
        private ?string $subtitle = null,
        private string $avatarSize = '32px',
    ) {}

    public static function make(string $title): self
    {
        if ($title === '') {
            throw new \InvalidArgumentException('EntityCast title field must not be empty.');
        }
        return new self($title);
    }

    public function avatar(string $field): self
    {
        return $this->with('avatar', $field);
    }

    public function subtitle(string $field): self
    {
        return $this->with('subtitle', $field);
    }

    public function avatarSize(string $size): self
    {
        return $this->with('avatarSize', $size);
    }

    protected function type(): string
    {
        return 'entity';
    }

    /** @return array<string, mixed> */
    protected function config(): array
    {
        return [
            'title'      => $this->title,
            'avatar'     => $this->avatar,
            'subtitle'   => $this->subtitle,
            'avatarSize' => $this->avatarSize,
        ];
    }
}
