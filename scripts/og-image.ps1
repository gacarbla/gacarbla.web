# Genera assets/og.png (1200x630) para las vistas previas de Discord, WhatsApp, etc.
# Generates assets/og.png (1200x630) for Discord, WhatsApp, etc. link previews.
# Uso / Usage: powershell -ExecutionPolicy Bypass -File scripts/og-image.ps1

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "assets/og.png"
$portraitPath = Join-Path $root "assets/gacarbla.png"

$w = 1200
$h = 630
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$paper = [System.Drawing.ColorTranslator]::FromHtml("#14110c")
$ink = [System.Drawing.ColorTranslator]::FromHtml("#f2ede3")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#a89e8a")
$accent = [System.Drawing.ColorTranslator]::FromHtml("#e08a4c")
$line = [System.Drawing.ColorTranslator]::FromHtml("#2e2a24")

$g.Clear($paper)

# Trama de puntos tenue, como la malla del fondo.
$dot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, $line))
for ($x = 54; $x -lt $w; $x += 48) {
  for ($y = 40; $y -lt $h; $y += 48) {
    $g.FillEllipse($dot, $x, $y, 2, 2)
  }
}
$dot.Dispose()

# Barra de acento.
$accentBrush = New-Object System.Drawing.SolidBrush($accent)
$g.FillRectangle($accentBrush, 80, 118, 7, 112)

# Tipografías.
$eyebrowFont = New-Object System.Drawing.Font("Consolas", 23, [System.Drawing.FontStyle]::Bold)
$titleFont = New-Object System.Drawing.Font("Segoe UI", 96, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 33, [System.Drawing.FontStyle]::Regular)
$bodyFont = New-Object System.Drawing.Font("Segoe UI", 29, [System.Drawing.FontStyle]::Regular)
$urlFont = New-Object System.Drawing.Font("Consolas", 25, [System.Drawing.FontStyle]::Bold)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$accentText = New-Object System.Drawing.SolidBrush($accent)
$linePen = New-Object System.Drawing.Pen($line, 1)

$g.DrawString("PORTFOLIO PERSONAL", $eyebrowFont, $accentText, 110, 114)
$g.DrawString("GACARBLA", $titleFont, $inkBrush, 100, 152)
$g.DrawString("Gabriel · Desarrollador web", $subFont, $mutedBrush, 106, 306)
$g.DrawString("Webs rápidas y cuidadas", $bodyFont, $inkBrush, 106, 376)
$g.DrawString("con tecnología propia, sin frameworks.", $bodyFont, $mutedBrush, 106, 418)
$g.DrawLine($linePen, 108, 500, 440, 500)
$g.DrawString("gacarbla.es", $urlFont, $accentText, 106, 534)

# Retrato pixel-art a la derecha, conservando proporción.
$portrait = [System.Drawing.Image]::FromFile($portraitPath)
$ph = 630
$pw = [int]([math]::Round($portrait.Width * $ph / $portrait.Height))
$px = $w - $pw
$g.DrawImage($portrait, $px, 0, $pw, $ph)
$portrait.Dispose()

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

$eyebrowFont.Dispose()
$titleFont.Dispose()
$subFont.Dispose()
$bodyFont.Dispose()
$urlFont.Dispose()
$inkBrush.Dispose()
$mutedBrush.Dispose()
$accentText.Dispose()
$accentBrush.Dispose()
$linePen.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "og.png generado / generated: $out"
