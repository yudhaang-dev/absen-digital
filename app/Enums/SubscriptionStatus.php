<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case GRACE_PERIOD = 'grace_period';
    case SUSPENDED = 'suspended';
    case TERMINATED = 'terminated';
    case CANCELLED = 'cancelled';

    /**
     * Mendapatkan label human-readable untuk tampilan UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu Pembayaran',
            self::ACTIVE => 'Aktif',
            self::GRACE_PERIOD => 'Masa Tenggang',
            self::SUSPENDED => 'Ditangguhkan',
            self::TERMINATED => 'Dihapus Permanen',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    /**
     * Mendapatkan warna badge untuk komponen UI (seperti Bootstrap/Tailwind).
     */
    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::ACTIVE => 'success',
            self::GRACE_PERIOD => 'info',
            self::SUSPENDED => 'danger',
            self::TERMINATED => 'secondary',
            self::CANCELLED => 'dark',
        };
    }

    /**
     * Validasi apakah status ini mengizinkan pengguna mengakses fitur SaaS.
     */
    public function hasAccess(): bool
    {
        return match ($this) {
            self::ACTIVE, self::GRACE_PERIOD => true,
            default => false,
        };
    }
}
