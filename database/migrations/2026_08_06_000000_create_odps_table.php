<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('odps', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('odps');
    }
};
