<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TaskBreakdownService
{
    /**
     * Generate task recommendations from a client brief using LLM API.
     * Includes graceful fallback if API fails/timeouts.
     */
    public function generateTasksFromBrief(string $brief): array
    {
        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');

        if (! $apiKey) {
            Log::info('GEMINI_API_KEY tidak dikonfigurasi. Menggunakan heuristic breakdown fallback.');
            return $this->fallbackTaskBreakdown($brief);
        }

        try {
            $prompt = "Bertindak sebagai Senior IT Project Manager di Bilcode Technology. 
Berdasarkan brief klien berikut, buatlah daftar rekomendasi task teknis yang spesifik dan terstruktur.
Sertakan kategori (pilih satu: 'frontend', 'backend', 'design', 'QA') dan estimasi jam kerja (integer 4-40).

Brief Klien:
\"{$brief}\"

Kembalikan HANYA format JSON valid tanpa teks markdown dengan skema berikut:
{
  \"tasks\": [
    {
      \"title\": \"Judul Task\",
      \"description\": \"Deskripsi singkat pengerjaan\",
      \"category\": \"backend\",
      \"estimated_hours\": 16
    }
  ]
}";

            $response = Http::timeout(10)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                ]);

            if ($response->successful()) {
                $rawText = $response->json('candidates.0.content.parts.0.text', '');
                // Clean markdown code blocks if present
                $cleanJson = preg_replace('/```json|```/', '', $rawText);
                $decoded = json_decode(trim($cleanJson), true);

                if (isset($decoded['tasks']) && is_array($decoded['tasks']) && count($decoded['tasks']) > 0) {
                    return $decoded['tasks'];
                }
            }

            Log::warning('Gemini API response invalid, falling back to heuristic engine.', ['response' => $response->body()]);
            return $this->fallbackTaskBreakdown($brief);

        } catch (\Exception $e) {
            Log::error('Task breakdown LLM API error: '.$e->getMessage());
            return $this->fallbackTaskBreakdown($brief);
        }
    }

    /**
     * Heuristic fallback breakdown if LLM API is unavailable.
     */
    private function fallbackTaskBreakdown(string $brief): array
    {
        return [
            [
                'title' => 'Analisis Kebutuhan & Desain Arsitektur Sistem',
                'description' => 'Menyusun dokumen arsitektur dan spesifikasi API berdasarkan brief: '.$brief,
                'category' => 'backend',
                'estimated_hours' => 12,
            ],
            [
                'title' => 'Perancangan Wireframe & Design System (Figma)',
                'description' => 'Mendesain komponen UI/UX responsif sesuai preferensi klien.',
                'category' => 'design',
                'estimated_hours' => 16,
            ],
            [
                'title' => 'Pengembangan Backend RESTful API & Database',
                'description' => 'Membangun endpoint API, otentikasi token, serta otorisasi role.',
                'category' => 'backend',
                'estimated_hours' => 24,
            ],
            [
                'title' => 'Pengembangan Antarmuka Frontend & Integrasi API',
                'description' => 'Membangun komponen UI dashboard/aplikasi dan menghubungkannya dengan API.',
                'category' => 'frontend',
                'estimated_hours' => 20,
            ],
            [
                'title' => 'Quality Assurance (QA) & Penetration Testing',
                'description' => 'Pengujian otomatis unit test, integrasi, serta pengujian keamanan input.',
                'category' => 'QA',
                'estimated_hours' => 10,
            ],
        ];
    }
}
