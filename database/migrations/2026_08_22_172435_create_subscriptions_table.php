<?php

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('subscriber_type');
            $table->string('subscriber_id');
            $table->foreignId('plan_price_id')
                ->constrained('plan_prices')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('cycle_count')->default(1);
            $table->string('cycle_unit')->default('month');
            $table->decimal('amount', 12, 2)->default(0);
            $table->enum('status', SubscriptionStatus::cases())->default(SubscriptionStatus::PENDING->value);
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->index(['subscriber_type', 'subscriber_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
