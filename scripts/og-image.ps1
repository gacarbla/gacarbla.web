# Genera assets/og.png (1200x630) para las vistas previas de Discord, WhatsApp, etc.
# Generates assets/og.png (1200x630) for Discord, WhatsApp, etc. link previews.
# Uso / Usage: powershell -ExecutionPolicy Bypass -File scripts/og-image.ps1

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "assets/og.png"
$portraitPath = Join-Path $root "assets/gacarbla.png"

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

$w = 1200
$h = 630
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

$paper = [System.Drawing.ColorTranslator]::FromHtml("#14110c")
$panel = [System.Drawing.ColorTranslator]::FromHtml("#1d1913")
$ink = [System.Drawing.ColorTranslator]::FromHtml("#f2ede3")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#a89e8a")
$accent = [System.Drawing.ColorTranslator]::FromHtml("#e08a4c")
$accent2 = [System.Drawing.ColorTranslator]::FromHtml("#b3541e")
$line = [System.Drawing.ColorTranslator]::FromHtml("#2e2a24")

# Fondo con gradiente cálido.
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $bgRect,
  [System.Drawing.ColorTranslator]::FromHtml("#1a150f"),
  [System.Drawing.ColorTranslator]::FromHtml("#0f0d09"),
  45
)
$g.FillRectangle($bgBrush, $bgRect)

# Trama de puntos muy tenue.
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, $line))
for ($x = 32; $x -lt $w; $x += 40) {
  for ($y = 32; $y -lt $h; $y += 40) {
    $g.FillEllipse($dotBrush, $x, $y, 2, 2)
  }
}

# Halo cálido detrás del retrato.
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(660, 30, 620, 620)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glow.CenterColor = [System.Drawing.Color]::FromArgb(32, $accent)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $accent))
$g.FillPath($glow, $glowPath)

# Marca superior.
$accentBrush = New-Object System.Drawing.SolidBrush($accent)
$g.FillRectangle($accentBrush, 84, 86, 10, 10)
$brandFont = New-Object System.Drawing.Font("Consolas", 20, [System.Drawing.FontStyle]::Bold)
$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$g.DrawString("GABRIEL", $brandFont, $inkBrush, 104, 76)

$linePen = New-Object System.Drawing.Pen($line, 1)
$g.DrawLine($linePen, 84, 128, 700, 128)

# Etiqueta y titular.
$eyebrowFont = New-Object System.Drawing.Font("Consolas", 18, [System.Drawing.FontStyle]::Bold)
$accentText = New-Object System.Drawing.SolidBrush($accent)
$g.DrawString("PORTFOLIO · 2026", $eyebrowFont, $accentText, 84, 150)

$barRect = New-Object System.Drawing.Rectangle(58, 190, 4, 92)
$barBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($barRect, $accent, $accent2, 90)
$g.FillRectangle($barBrush, $barRect)

$titleFont = New-Object System.Drawing.Font("Bahnschrift SemiBold", 80, [System.Drawing.FontStyle]::Regular)
$g.DrawString("GACARBLA", $titleFont, $inkBrush, 80, 180)

$subFont = New-Object System.Drawing.Font("Segoe UI", 30, [System.Drawing.FontStyle]::Regular)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$g.DrawString("Desarrollador web", $subFont, $mutedBrush, 84, 300)

$bodyFont = New-Object System.Drawing.Font("Segoe UI", 26, [System.Drawing.FontStyle]::Regular)
$g.DrawString("Webs rápidas y cuidadas", $bodyFont, $inkBrush, 84, 368)
$g.DrawString("Tecnología propia, sin frameworks.", $bodyFont, $mutedBrush, 84, 406)

# Pie.
$g.DrawLine($linePen, 84, 520, 420, 520)
$urlFont = New-Object System.Drawing.Font("Consolas", 22, [System.Drawing.FontStyle]::Bold)
$g.DrawString("gacarbla.es", $urlFont, $accentText, 84, 534)

# Marco del retrato.
$shadowPath1 = New-RoundedPath 760 82 360 490 24
$shadowBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 0, 0, 0))
$g.FillPath($shadowBrush1, $shadowPath1)
$shadowPath2 = New-RoundedPath 760 76 360 490 24
$shadowBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(52, 0, 0, 0))
$g.FillPath($shadowBrush2, $shadowPath2)

$framePath = New-RoundedPath 760 70 360 490 24
$panelBrush = New-Object System.Drawing.SolidBrush($panel)
$g.FillPath($panelBrush, $framePath)
$framePen = New-Object System.Drawing.Pen($line, 1)
$g.DrawPath($framePen, $framePath)

# Retrato completo, escalado con píxeles nítidos.
$portrait = [System.Drawing.Image]::FromFile($portraitPath)
$innerW = 324
$innerH = [int]([math]::Round($portrait.Height * $innerW / $portrait.Width))
$innerX = 760 + [int]((360 - $innerW) / 2)
$innerY = 70 + [int]((490 - $innerH) / 2)
$dest = New-Object System.Drawing.Rectangle($innerX, $innerY, $innerW, $innerH)
$g.DrawImage($portrait, $dest)
$portrait.Dispose()

# Pie del retrato.
$captionFont = New-Object System.Drawing.Font("Consolas", 15, [System.Drawing.FontStyle]::Bold)
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center
$captionRect = New-Object System.Drawing.RectangleF(760, 576, 360, 30)
$g.DrawString("GACARBLA · 2026", $captionFont, $mutedBrush, $captionRect, $center)

# Detalle de píxel en la esquina superior derecha.
$g.FillRectangle($accentBrush, 1132, 42, 10, 10)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

$brandFont.Dispose()
$eyebrowFont.Dispose()
$titleFont.Dispose()
$subFont.Dispose()
$bodyFont.Dispose()
$urlFont.Dispose()
$captionFont.Dispose()
$inkBrush.Dispose()
$mutedBrush.Dispose()
$accentBrush.Dispose()
$accentText.Dispose()
$dotBrush.Dispose()
$bgBrush.Dispose()
$glow.Dispose()
$glowPath.Dispose()
$linePen.Dispose()
$barBrush.Dispose()
$shadowBrush1.Dispose()
$shadowBrush2.Dispose()
$panelBrush.Dispose()
$framePen.Dispose()
$framePath.Dispose()
$shadowPath1.Dispose()
$shadowPath2.Dispose()
$center.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "og.png generado / generated: $out"
