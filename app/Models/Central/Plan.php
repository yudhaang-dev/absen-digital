<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class Plan extends Model
{
    /**
     * Get all of the comments for the Plan
     */
    public function prices(): HasMany
    {
        return $this->hasMany(PlanPrice::class, 'plan_id', 'id');
    }
}
