<?php

namespace App\Http\Controllers;

use App\Models\Odp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

class SccController extends Controller
{
    public function index()
    {
        return view('scc');
    }

    public function searchOdp(Request $request)
    {
        $query = trim($request->input('q', ''));
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        try {
            if (Schema::hasTable('odps') && Odp::exists()) {
                $results = Odp::where('name', 'LIKE', "%{$query}%")
                    ->select(['id', 'name', 'lat', 'lng'])
                    ->limit(15)
                    ->get();
                return response()->json($results);
            }
        } catch (\Throwable $e) {
            // Fallback
        }

        $jsonPath = base_path('odp.json');
        if (!file_exists($jsonPath)) {
            return response()->json([]);
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $filtered = [];
        $qLower = strtolower($query);

        foreach ($data as $item) {
            if (str_contains(strtolower($item['n']), $qLower)) {
                $filtered[] = [
                    'id'   => $item['n'],
                    'name' => $item['n'],
                    'lat'  => (float) $item['la'],
                    'lng'  => (float) $item['lo'],
                ];
                if (count($filtered) >= 15) {
                    break;
                }
            }
        }

        return response()->json($filtered);
    }

    public function proxyCloseTicket(Request $request)
    {
        $ticketId = $request->input('ticketId');
        $nd = $request->input('nd');
        $lat = (float) $request->input('lat', -3.3194);
        $lng = (float) $request->input('lng', 114.5908);

        $targetUrl = "https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/?ticketId=" . urlencode($ticketId) . "&nd=" . urlencode($nd);

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer'    => 'https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/',
            ])->withoutVerifying()->get($targetUrl);

            $html = $response->body();

            // Inject Base Tag & Fake GPS script into HTML HEAD
            $baseHref = '<base href="https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/">';
            $fakeGpsScript = "
            {$baseHref}
            <script>
                (function() {
                    var fakeLat = {$lat};
                    var fakeLng = {$lng};
                    console.log('[Laravel Proxy] Injected ODP Coordinates:', fakeLat, fakeLng);

                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition = function(success, error, options) {
                            console.log('[Laravel Proxy] getCurrentPosition intercepted -> returning fake coords');
                            if (typeof success === 'function') {
                                success({
                                    coords: {
                                        latitude: fakeLat,
                                        longitude: fakeLng,
                                        accuracy: 3,
                                        altitude: null,
                                        altitudeAccuracy: null,
                                        heading: null,
                                        speed: null
                                    },
                                    timestamp: Date.now()
                                });
                            }
                        };

                        navigator.geolocation.watchPosition = function(success, error, options) {
                            console.log('[Laravel Proxy] watchPosition intercepted -> returning fake coords');
                            if (typeof success === 'function') {
                                success({
                                    coords: {
                                        latitude: fakeLat,
                                        longitude: fakeLng,
                                        accuracy: 3,
                                        altitude: null,
                                        altitudeAccuracy: null,
                                        heading: null,
                                        speed: null
                                    },
                                    timestamp: Date.now()
                                });
                            }
                            return 1;
                        };
                    }
                })();
            </script>
            ";

            if (str_contains($html, '<head>')) {
                $html = str_replace('<head>', '<head>' . $fakeGpsScript, $html);
            } else {
                $html = $fakeGpsScript . $html;
            }

            return response($html, 200)
                ->header('Content-Type', 'text/html; charset=UTF-8')
                ->header('X-Frame-Options', 'ALLOWALL');

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal terhubung ke SCC Telkom: ' . $e->getMessage()
            ], 500);
        }
    }
}
