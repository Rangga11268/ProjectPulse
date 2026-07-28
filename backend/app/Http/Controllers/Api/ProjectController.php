<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::with(['client'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'done');
            }])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $projects,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'client_brief' => 'nullable|string',
            'deadline' => 'required|date',
            'status' => 'nullable|in:planning,active,completed,on_hold',
        ]);

        $project = Project::create($validated);
        $project->load('client');

        return response()->json([
            'status' => 'success',
            'message' => 'Proyek berhasil dibuat.',
            'data' => $project,
        ], 201);
    }

    public function show(Project $project)
    {
        $project->load(['client', 'tasks.assignee', 'tasks.timeLogs']);

        return response()->json([
            'status' => 'success',
            'data' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|required|exists:clients,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'client_brief' => 'nullable|string',
            'deadline' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:planning,active,completed,on_hold',
        ]);

        $project->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Proyek berhasil diperbarui.',
            'data' => $project,
        ]);
    }

    public function destroy(Project $project)
    {
        if ($project->tasks()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak bisa menghapus proyek yang masih memiliki task. Hapus semua task terkait terlebih dahulu.',
            ], 409);
        }

        $project->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Proyek berhasil dihapus.',
        ]);
    }
}
