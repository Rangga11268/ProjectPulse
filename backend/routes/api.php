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

    // Admin Dashboard Summary
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Clients Management
    Route::apiResource('clients', ClientController::class);

    // Projects Management
    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{project}/tasks/generate', [DashboardController::class, 'generateAiTasks']);

    // Tasks Management
    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::post('/tasks/{task}/time-logs', [TaskController::class, 'addTimeLog']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
});
