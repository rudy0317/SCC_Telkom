<?php

use App\Http\Controllers\SccController;
use Illuminate\Support\Facades\Route;

Route::get('/', [SccController::class, 'index']);
Route::get('/api/odp/search', [SccController::class, 'searchOdp']);
Route::any('/scc/proxy', [SccController::class, 'proxyCloseTicket']);
