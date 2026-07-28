<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        $clients = Client::withCount('projects')->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $clients,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email',
            'company' => 'required|string|max:255',
        ]);

        $client = Client::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Klien berhasil ditambahkan.',
            'data' => $client,
        ], 201);
    }

    public function show(Client $client)
    {
        $client->load('projects');

        return response()->json([
            'status' => 'success',
            'data' => $client,
        ]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'contact_person' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email',
            'company' => 'sometimes|required|string|max:255',
        ]);

        $client->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data klien berhasil diperbarui.',
            'data' => $client,
        ]);
    }

    public function destroy(Client $client)
    {
        if ($client->projects()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak bisa menghapus klien yang masih memiliki proyek. Hapus semua proyek terkait terlebih dahulu.',
            ], 409);
        }

        $client->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Klien berhasil dihapus.',
        ]);
    }
}
