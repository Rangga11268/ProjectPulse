<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Users
        $admin = User::create([
            'name' => 'Project Manager Admin',
            'email' => 'admin@bilcode.com',
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);

        $dev = User::create([
            'name' => 'Darell Senior Developer',
            'email' => 'dev@bilcode.com',
            'role' => 'member',
            'password' => Hash::make('password123'),
        ]);

        $designer = User::create([
            'name' => 'UI UX Specialist',
            'email' => 'designer@bilcode.com',
            'role' => 'member',
            'password' => Hash::make('password123'),
        ]);

        // 2. Create Dummy Clients
        $client1 = Client::create([
            'name' => 'PT Maju Bersama Tech',
            'contact_person' => 'Budi Santoso',
            'email' => 'budi@majubersama.com',
            'company' => 'Maju Group',
        ]);

        $client2 = Client::create([
            'name' => 'Fintech Asia Solution',
            'contact_person' => 'Siti Rahma',
            'email' => 'siti@fintechasia.id',
            'company' => 'Fintech Asia',
        ]);

        $client3 = Client::create([
            'name' => 'Logistik Nusantara',
            'contact_person' => 'Hendra Wijaya',
            'email' => 'hendra@logistiknusantara.co.id',
            'company' => 'Nusantara Express',
        ]);

        // 3. Create Projects
        $proj1 = Project::create([
            'client_id' => $client1->id,
            'name' => 'E-Commerce Marketplace Redesign',
            'description' => 'Rebuild e-commerce platform with microservices & Next.js frontend.',
            'client_brief' => 'Klien ingin platform e-commerce baru yang bisa handle 10k concurrent user dengan UI modern.',
            'deadline' => now()->addDays(30)->toDateString(),
            'status' => 'active',
        ]);

        $proj2 = Project::create([
            'client_id' => $client2->id,
            'name' => 'Mobile Banking Companion App',
            'description' => 'Secure mobile app for quick digital payments & credit monitoring.',
            'client_brief' => 'Aplikasi mobile Flutter/Ionic dengan biometric login dan QRIS scanner.',
            'deadline' => now()->addDays(45)->toDateString(),
            'status' => 'planning',
        ]);

        // 4. Create Dummy Tasks
        $task1 = Task::create([
            'project_id' => $proj1->id,
            'assignee_id' => $dev->id,
            'title' => 'Setup REST API Authentication & Database Schema',
            'description' => 'Implement Sanctum token auth & migrations for users and products.',
            'category' => 'backend',
            'status' => 'in_progress',
            'estimated_hours' => 16,
            'deadline' => now()->addDays(5)->toDateString(),
        ]);

        $task2 = Task::create([
            'project_id' => $proj1->id,
            'assignee_id' => $designer->id,
            'title' => 'Design High-Fidelity Checkout & Cart Page',
            'description' => 'Figma layout for seamless guest checkout and payment selector.',
            'category' => 'design',
            'status' => 'review',
            'estimated_hours' => 12,
            'deadline' => now()->addDays(3)->toDateString(),
        ]);

        $task3 = Task::create([
            'project_id' => $proj2->id,
            'assignee_id' => $dev->id,
            'title' => 'Integrate QRIS Payment SDK Callback',
            'description' => 'Handle webhook callbacks and updates transaction status in DB.',
            'category' => 'backend',
            'status' => 'todo',
            'estimated_hours' => 20,
            'deadline' => now()->addDays(10)->toDateString(),
        ]);

        // 5. Create Time Logs
        TimeLog::create([
            'task_id' => $task1->id,
            'user_id' => $dev->id,
            'hours' => 4.5,
            'note' => 'Finished Sanctum configuration & initial user model migration.',
        ]);

        TimeLog::create([
            'task_id' => $task2->id,
            'user_id' => $designer->id,
            'hours' => 6.0,
            'note' => 'Created cart wireframes and mobile responsive layout in Figma.',
        ]);
    }
}
