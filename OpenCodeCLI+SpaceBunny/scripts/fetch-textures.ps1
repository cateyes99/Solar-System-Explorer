# Downloads public NASA/JPL imagery into public/textures/ for the planet maps.
# Sources are NASA / ESA / USGS public-domain products. Run once; the files are
# committed so the app never needs network access at runtime.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$dest = Join-Path $PSScriptRoot '..\public\textures'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$repo = 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures'
$eoim = 'https://eoimages.gsfc.nasa.gov/images/imagerecords'
$svs = 'https://svs.gsfc.nasa.gov/vis'

# Every entry must be an equirectangular (2:1) map, because that is what a
# sphere's UV layout expects. Rendered globes and ordinary photographs are NOT
# usable even when they happen to be 2:1, and are deliberately not listed here.
$map = [ordered]@{
  'venus'        = "$repo/Venus/Venus.jpg"
  # Blue Marble. Served as a PNG upstream but re-encoded to JPEG below, because
  # photographic data in a PNG is several times larger for no visible gain.
  'earth'        = "$eoim/57000/57730/land_ocean_ice_2048.png"
  'mars'         = "$repo/Mars/Mars.jpg"
  'jupiter'      = "$repo/Jupiter/Jupiter.jpg"
  'saturn'       = "$repo/Saturn/Saturn.jpg"
  'neptune'      = "$repo/Neptune/Neptune.jpg"

  # MESSENGER global colour mosaic, 6132x3066 (22 MB). Downscaled to 2048x1024
  # by -Resize below; committed at the smaller size to keep the repo light.
  'mercury'      = "$svs/a010000/a011100/a011197/Image1_rawpng.png"

  'luna'         = "$svs/a000000/a004700/a004720/lroc_color_poles_1k.jpg"
  'io'           = "$repo/Jupiter%20-%20Io%20(A)/Jupiter%20-%20Io%20(A).jpg"
  'europa'       = "$repo/Jupiter%20-%20Europa/Jupiter%20-%20Europa.jpg"
  'ganymede'     = "$repo/Jupiter%20-%20Ganymede/Jupiter%20-%20Ganymede.jpg"
  'callisto'     = "$repo/Jupiter%20-%20Callisto/Jupiter%20-%20Callisto.jpg"
  'titan'        = "$repo/Saturn%20-%20Titan/Saturn%20-%20Titan.jpg"
  'enceladus'    = "$repo/Saturn%20-%20Enceladus/Saturn%20-%20Enceladus.jpg"
  'rhea'         = "$repo/Saturn%20-%20Rhea/Saturn%20-%20Rhea.jpg"
  'dione'        = "$repo/Saturn%20-%20Dione/Saturn%20-%20Dione.jpg"
  'iapetus'      = "$repo/Saturn%20-%20Iapetus/Saturn%20-%20Iapetus.jpg"
  'mimas'        = "$repo/Saturn%20-%20Mimas/Saturn%20-%20Mimas.jpg"
  'tethys'       = "$repo/Saturn%20-%20Tethys/Saturn%20-%20Tethys.jpg"
  'triton'       = "$repo/Neptune%20-%20Triton/Neptune%20-%20Triton.jpg"
  'ariel'        = "$repo/Uranus%20-%20Ariel/Uranus%20-%20Ariel.jpg"
  'miranda'      = "$repo/Uranus%20-%20Miranda/Uranus%20-%20Miranda.jpg"
  'titania'      = "$repo/Uranus%20-%20Titania/Uranus%20-%20Titania.jpg"
  'oberon'       = "$repo/Uranus%20-%20Oberon/Uranus%20-%20Oberon.jpg"
  'umbriel'      = "$repo/Uranus%20-%20Umbriel/Uranus%20-%20Umbriel.jpg"
  'phobos'       = "$repo/Mars%20-%20Phobos/Mars%20-%20Phobos.jpg"
  'deimos'       = "$repo/Mars%20-%20Deimos/Mars%20-%20Deimos.jpg"
}

$failed = @()
foreach ($name in $map.Keys) {
  $url = $map[$name]
  $ext = if ($url -match '\.png') { 'png' } else { 'jpg' }
  $out = Join-Path $dest "$name.$ext"
  try {
    Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 120 -UseBasicParsing -UserAgent 'Mozilla/5.0'
    $img = [System.Drawing.Image]::FromFile($out)
    $w = $img.Width; $h = $img.Height
    $img.Dispose()

    # A sphere only needs ~2048x1024 of detail. Re-encode anything larger, and
    # any PNG, as JPEG: these are all photographic subjects, where PNG costs
    # several times the bytes for no visible gain.
    if ($w -gt 2048 -or $ext -eq 'png') {
      $resized = New-Object System.Drawing.Bitmap 2048,1024
      $g2 = [System.Drawing.Graphics]::FromImage($resized)
      $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g2.DrawImage($out, 0, 0, 2048, 1024)
      $g2.Dispose()
      $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq 'image/jpeg' }
      $params = New-Object System.Drawing.Imaging.EncoderParameters 1
      $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, 90)
      $jpg = [System.IO.Path]::ChangeExtension($out, '.jpg')
      $resized.Save($jpg, $enc, $params)
      $resized.Dispose()
      Remove-Item $out -Force
      $out = $jpg
      $w = 2048; $h = 1024
    }

    $ratio = $w / $h
    if ([math]::Abs($ratio - 2) -gt 0.02) {
      "NOT 2:1   $name is ${w}x${h} (ratio $ratio) - unusable on a sphere"
      $failed += $name
      continue
    }

    $kb = [math]::Round((Get-Item $out).Length / 1KB, 0)
    "{0,-11} {1,5}x{2,-5} {3,7} KB" -f $name, $w, $h, $kb
  } catch {
    "FAILED     $name -> $($_.Exception.Message)"
    $failed += $name
  }
}

if ($failed.Count) {
  "`n$($failed.Count) failed: $($failed -join ', ')"
  exit 1
}
"`nAll $($map.Count) textures downloaded to public\textures"
