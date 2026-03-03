<?php

namespace Infomediji\FluentTable\Casts;

interface CastInterface
{
    /** @return array<string, mixed> */
    public function toArray(): array;
}
