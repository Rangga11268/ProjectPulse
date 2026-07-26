<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['project.client', 'assignee', 'timeLogs']);

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('assignee_id')) {
            $query->where('assignee_id', $request->assignee_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $tasks = $query->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $tasks,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'assignee_id' => 'nullable|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:frontend,backend,design,QA',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'estimated_hours' => 'required|integer|min:1',
            'deadline' => 'nullable|date',
        ]);

        $task = $project->tasks()->create($validated);
        $task->load(['assignee']);

        return response()->json([
            'status' => 'success',
            'message' => 'Task berhasil ditambahkan ke proyek.',
            'data' => $task,
        ], 201);
    }

    public function show(Task $task)
    {
        $task->load(['project.client', 'assignee', 'timeLogs.user']);

        return response()->json([
            'status' => 'success',
            'data' => $task,
        ]);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'assignee_id' => 'nullable|exists:users,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|in:frontend,backend,design,QA',
            'status' => 'sometimes|required|in:todo,in_progress,review,done',
            'estimated_hours' => 'sometimes|required|integer|min:1',
            'deadline' => 'nullable|date',
        ]);

        $task->update($validated);
        $task->load(['assignee']);

        return response()->json([
            'status' => 'success',
            'message' => 'Task berhasil diperbarui.',
            'data' => $task,
        ]);
    }

    public function updateStatus(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,review,done',
        ]);

        $task->update(['status' => $validated['status']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status task berhasil diperbarui.',
            'data' => $task,
        ]);
    }

    public function addTimeLog(Request $request, Task $task)
    {
        $validated = $request->validate([
            'hours' => 'required|numeric|min:0.25|max:24',
            'note' => 'required|string|max:1000',
        ]);

        $timeLog = $task->timeLogs()->create([
            'user_id' => $request->user()->id,
            'hours' => $validated['hours'],
            'note' => $validated['note'],
        ]);

        $timeLog->load('user');

        return response()->json([
            'status' => 'success',
            'message' => 'Log waktu kerja berhasil ditambahkan.',
            'data' => $timeLog,
        ], 201);
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Task berhasil dihapus.',
        ]);
    }
}
