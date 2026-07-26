<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPulseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_get_token(): void
    {
        $user = User::factory()->create([
            'email' => 'testadmin@bilcode.com',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'testadmin@bilcode.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => ['token', 'user'],
            ]);
    }

    public function test_authenticated_admin_can_create_client_and_project(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        // 1. Create Client
        $clientResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/clients', [
                'name' => 'PT Test Client',
                'contact_person' => 'Budi Test',
                'email' => 'budi@test.com',
                'company' => 'Test Corp',
            ]);

        $clientResp->assertStatus(201);
        $clientId = $clientResp->json('data.id');

        // 2. Create Project
        $projectResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/projects', [
                'client_id' => $clientId,
                'name' => 'Test Project Portal',
                'description' => 'Test Description',
                'client_brief' => 'Klien ingin portal web sederhana.',
                'deadline' => now()->addDays(14)->toDateString(),
                'status' => 'active',
            ]);

        $projectResp->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Project Portal');
    }

    public function test_ai_task_breakdown_fallback_service(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $client = Client::create([
            'name' => 'Test Client',
            'contact_person' => 'Contact',
            'email' => 'contact@test.com',
            'company' => 'Corp',
        ]);

        $project = Project::create([
            'client_id' => $client->id,
            'name' => 'Mobile App Project',
            'client_brief' => 'Buatkan aplikasi mobile e-wallet berbasis Flutter.',
            'deadline' => now()->addDays(30)->toDateString(),
            'status' => 'planning',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/projects/{$project->id}/tasks/generate");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => ['project_id', 'suggested_tasks'],
            ]);
    }
}
