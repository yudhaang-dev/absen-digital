<?php

namespace App\Enums;

enum CycleUnit: string
{
    case DAY = 'day';
    case WEEK = 'week';
    case MONTH = 'month';
    case YEAR = 'year';

    /**
     * Mendapatkan label bahasa Indonesia untuk tampilan UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::DAY => 'Hari',
            self::WEEK => 'Minggu',
            self::MONTH => 'Bulan',
            self::YEAR => 'Tahun',
        };
    }

    /**
     * Mengembalikan semua pilihan dalam bentuk array untuk opsi Dropdown/Select di React.
     * format: [['value' => 'month', 'label' => 'Bulanan'], ...]
     */
    public static function toSelectOptions(): array
    {
        return array_map(fn (self $enum) => [
            'value' => $enum->value,
            'label' => $enum->label(),
        ], self::cases());
    }
}
