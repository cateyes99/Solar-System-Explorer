$ErrorActionPreference = 'Stop'
$query = @{
    format = 'json'
    COMMAND = "'90000030'"
    EPHEM_TYPE = "'VECTORS'"
    CENTER = "'500@10'"
    START_TIME = "'1957-01-01'"
    STOP_TIME = "'2097-01-01'"
    STEP_SIZE = "'2 d'"
    OUT_UNITS = "'AU-D'"
    REF_PLANE = "'ECLIPTIC'"
    REF_SYSTEM = "'ICRF'"
    VEC_TABLE = "'2'"
    VEC_CORR = "'NONE'"
    CSV_FORMAT = "'YES'"
}
$uri = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + (($query.GetEnumerator() | ForEach-Object { $_.Key + '=' + [uri]::EscapeDataString($_.Value) }) -join '&')
$response = Invoke-RestMethod -Uri $uri
if ($response.error) { throw $response.error }
if ($response.result -notmatch 'source: JPL#75') { throw 'Horizons solution changed; update provenance and reference tests before regenerating.' }
if ($response.result -notmatch '(?s)\$\$SOE\s*(.*?)\s*\$\$EOE') { throw 'Horizons returned no vector table.' }
$rows = $Matches[1] | ConvertFrom-Csv -Header 'jd', 'date', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'end'
$culture = [Globalization.CultureInfo]::InvariantCulture
$samples = @(
    for ($index = 0; $index -lt $rows.Count; $index++) {
        $row = $rows[$index]
        $values = @('jd', 'x', 'y', 'z', 'vx', 'vy', 'vz' | ForEach-Object { [double]::Parse($row.$_, $culture) })
        $distance = [Math]::Sqrt($values[1] * $values[1] + $values[2] * $values[2] + $values[3] * $values[3])
        if ($distance -lt 4 -or $index % 8 -eq 0 -or $index -eq $rows.Count - 1) {
            ,@($values | ForEach-Object { [Math]::Round($_, 12) })
        }
    }
)
if ($samples.Count -lt 3000 -or $samples[0][0] -ne 2435839.5) { throw 'Unexpected ephemeris coverage.' }
$data = [ordered]@{
    source = $uri
    solution = 'JPL#75, 2025-Nov-21; DE441; SB441-N16'
    frame = 'Heliocentric J2000 ecliptic; geometric; TDB; AU and AU/day'
    columns = @('jd', 'x', 'y', 'z', 'vx', 'vy', 'vz')
    samples = $samples
}
$destination = Join-Path $PSScriptRoot '../src/data/halley-ephemeris.json'
[IO.File]::WriteAllText($destination, ($data | ConvertTo-Json -Depth 5 -Compress), [Text.UTF8Encoding]::new($false))
Write-Output "Saved $($samples.Count) Halley state vectors to $destination"