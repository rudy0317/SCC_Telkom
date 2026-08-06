<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Odp extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'lat',
        'lng',
    ];

    public $timestamps = false;
}
