<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Models\Domain as StanclDomain;

#[Fillable(['tenant_id', 'domain'])]
class Domain extends StanclDomain
{
    /**
     * Get the user that owns the Domain
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }
}
