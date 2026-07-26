<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Akses ditolak. Fitur ini hanya dapat diakses oleh Admin / PM.',
        ], 403);
    }
}
