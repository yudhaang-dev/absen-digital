<?php

namespace App\Http\Controllers\Central\Web;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use Illuminate\Http\Request;

class LandingController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        // $workspace = \App\Models\Central\Workspace::create(['name' => 'My Workspace']);
        // $workspace->createDomain('demo');

        $tenant = Tenant::create(['name' => 'My Workspace']);
        $tenant->createDomain('demo-tenant');
    }
}
