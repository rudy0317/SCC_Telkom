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

    public function proxyCloseTicket(Request $request, $path = '')
    {
        $targetBase = "https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/";
        $targetUrl = $path ? $targetBase . $path : $targetBase;

        if ($request->getQueryString()) {
            $targetUrl .= '?' . $request->getQueryString();
        }

        $method = strtolower($request->method());
        
        $incomingCookie = $request->header('Cookie', '');
        $clientIp = $request->ip();

        $headers = [
            'User-Agent'      => $request->header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
            'Referer'         => 'https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/',
            'Origin'          => 'https://scc.telkom.co.id',
            'X-Forwarded-For' => $clientIp,
            'Client-IP'       => $clientIp,
        ];

        if ($incomingCookie) {
            $headers['Cookie'] = $incomingCookie;
        }

        try {
            $httpRequest = Http::withHeaders($headers)->withoutVerifying();

            if ($method === 'post') {
                $response = $httpRequest->asForm()->post($targetUrl, $request->all());
            } else {
                $response = $httpRequest->get($targetUrl);
            }

            $contentType = $response->header('Content-Type') ?? 'text/html';
            $body = $response->body();

            if (str_contains($contentType, 'text/html') && !$path) {
                $lat = (float) $request->input('lat', -3.3194);
                $lng = (float) $request->input('lng', 114.5908);

                $proxyScript = "
                <script>
                    (function() {
                        var fakeLat = {$lat};
                        var fakeLng = {$lng};

                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition = function(success) {
                                if (typeof success === 'function') {
                                    success({
                                        coords: { latitude: fakeLat, longitude: fakeLng, accuracy: 3, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
                                        timestamp: Date.now()
                                    });
                                }
                            };
                            navigator.geolocation.watchPosition = function(success) {
                                if (typeof success === 'function') {
                                    success({
                                        coords: { latitude: fakeLat, longitude: fakeLng, accuracy: 3, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
                                        timestamp: Date.now()
                                    });
                                }
                                return 1;
                            };
                        }

                        var origOpen = XMLHttpRequest.prototype.open;
                        XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
                            if (typeof url === 'string' && url.includes('scc.telkom.co.id')) {
                                var parts = url.split('/Check_embededv1/');
                                if (parts.length > 1) {
                                    url = '/scc/proxy/' + parts[1];
                                }
                            }
                            return origOpen.call(this, method, url, async, user, pass);
                        };
                    })();
                </script>
                ";

                if (str_contains($body, '<head>')) {
                    $body = str_replace('<head>', '<head>' . $proxyScript, $body);
                } else {
                    $body = $proxyScript . $body;
                }
            }

            $res = response($body, $response->status())
                ->header('Content-Type', $contentType)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                ->header('Access-Control-Allow-Headers', '*');

            if ($response->hasHeader('Set-Cookie')) {
                $cookies = $response->header('Set-Cookie');
                if (is_array($cookies)) {
                    foreach ($cookies as $c) {
                        $res->header('Set-Cookie', $c, false);
                    }
                } else {
                    $res->header('Set-Cookie', $cookies, false);
                }
            }

            return $res;

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
