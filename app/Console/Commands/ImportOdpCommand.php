<?php

namespace App\Console\Commands;

use App\Models\Odp;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportOdpCommand extends Command
{
    protected $signature = 'odp:import {file=odp.json}';
    protected $description = 'Import ODP JSON data into database';

    public function handle(): int
    {
        $filePath = base_path($this->argument('file'));
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return Command::FAILURE;
        }

        $this->info("Reading ODP JSON data...");
        $json = file_get_contents($filePath);
        $data = json_decode($json, true);

        if (!is_array($data)) {
            $this->error("Invalid JSON format.");
            return Command::FAILURE;
        }

        $this->info("Truncating existing ODP records...");
        DB::table('odps')->truncate();

        $chunks = array_chunk($data, 1000);
        $bar = $this->output->createProgressBar(count($chunks));

        foreach ($chunks as $chunk) {
            $records = [];
            foreach ($chunk as $item) {
                $records[] = [
                    'name' => $item['n'],
                    'lat'  => (float) $item['la'],
                    'lng'  => (float) $item['lo'],
                ];
            }
            DB::table('odps')->insert($records);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully imported " . count($data) . " ODP records.");

        return Command::SUCCESS;
    }
}
