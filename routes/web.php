<?php

use Illuminate\Support\Facades\Route;

$centralDomains = config('tenancy.central_domains', ['localhost', '127.0.0.1']);

foreach ($centralDomains as $domain) {
    Route::domain($domain)->group(function () {

        Route::inertia('/', 'welcome')->name('home');

    });
}
