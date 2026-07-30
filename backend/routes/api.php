<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Public Auth Endpoints
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & User Profile
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Read Endpoints (Accessible by both Admin and Member)
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::apiResource('clients', ClientController::class)->only(['index', 'show']);
    Route::apiResource('projects', ProjectController::class)->only(['index', 'show']);

    // Admin Role Restricted Endpoints for Mutations (POST, PUT, DELETE)
    Route::middleware([\App\Http\Middleware\EnsureAdminRole::class])->group(function () {
        Route::post('/clients', [ClientController::class, 'store']);
        Route::put('/clients/{client}', [ClientController::class, 'update']);
        Route::delete('/clients/{client}', [ClientController::class, 'destroy']);

        Route::post('/projects', [ProjectController::class, 'store']);
        Route::put('/projects/{project}', [ProjectController::class, 'update']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

        Route::post('/projects/{project}/tasks/generate', [DashboardController::class, 'generateAiTasks']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    });

    // Tasks Management & Time Log Export
    Route::get('/tasks/export/csv', [TaskController::class, 'exportTimeLogsCsv']);
    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::post('/tasks/{task}/time-logs', [TaskController::class, 'addTimeLog']);
    Route::get('/tasks/{task}/comments', [TaskController::class, 'getComments']);
    Route::post('/tasks/{task}/comments', [TaskController::class, 'addComment']);
    Route::put('/comments/{comment}', [TaskController::class, 'updateComment']);
    Route::delete('/comments/{comment}', [TaskController::class, 'destroyComment']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
});
