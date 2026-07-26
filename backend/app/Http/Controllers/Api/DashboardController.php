<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskBreakdownService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary()
    {
        $activeProjects = Project::where('status', 'active')->count();
        $totalProjects = Project::count();
        
        $overdueTasks = Task::where('status', '!=', 'done')
            ->whereNotNull('deadline')
            ->where('deadline', '<', now()->toDateString())
            ->count();

        $completedTasks = Task::where('status', 'done')->count();
        $totalTasks = Task::count();

        $workloadPerMember = User::where('role', 'member')
            ->withCount(['tasks as active_tasks_count' => function ($q) {
                $q->where('status', '!=', 'done');
            }])
            ->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'active_projects' => $activeProjects,
                'total_projects' => $totalProjects,
                'overdue_tasks' => $overdueTasks,
                'completed_tasks' => $completedTasks,
                'total_tasks' => $totalTasks,
                'workload_per_member' => $workloadPerMember,
            ],
        ]);
    }

    public function generateAiTasks(Request $request, Project $project, TaskBreakdownService $service)
    {
        $brief = $request->input('client_brief') ?? $project->client_brief ?? $project->description;

        if (empty($brief)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Brief klien tidak boleh kosong untuk membuat saran AI.',
            ], 422);
        }

        $suggestedTasks = $service->generateTasksFromBrief($brief);

        return response()->json([
            'status' => 'success',
            'message' => 'Rekomendasi task berhasil dihasilkan oleh AI.',
            'data' => [
                'project_id' => $project->id,
                'suggested_tasks' => $suggestedTasks,
            ],
        ]);
    }
}
