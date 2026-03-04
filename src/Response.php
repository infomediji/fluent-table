<?php

namespace Infomediji\FluentTable;

final class Response
{
    /**
     * Build a standard paginated JSON response array.
     *
     * Usage in controller:
     *   echo json_encode(Response::make($rows, $total, $page, $perPage));
     *
     * @param list<array<string, mixed>> $data    Rows for the current page
     * @param int                        $total   Total number of records (across all pages)
     * @param int                        $page    Current page (1-based)
     * @param int                        $perPage Items per page
     * @return array<string, mixed>
     */
    public static function make(array $data, int $total, int $page, int $perPage): array
    {
        if ($page < 1) {
            throw new \InvalidArgumentException('page must be at least 1, got ' . $page);
        }
        if ($perPage <= 0) {
            throw new \InvalidArgumentException('perPage must be greater than 0, got ' . $perPage);
        }
        if ($total < 0) {
            throw new \InvalidArgumentException('total must not be negative, got ' . $total);
        }

        return [
            'data' => $data,
            'meta' => [
                'pagination' => [
                    'page'       => $page,
                    'perPage'    => $perPage,
                    'totalCount' => $total,
                    'totalPages' => (int) ceil($total / $perPage),
                ],
            ],
        ];
    }
}
