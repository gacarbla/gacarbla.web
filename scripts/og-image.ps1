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

$ink = [System.Drawing.ColorTranslator]::FromHtml("#f2ede3")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#a89e8a")
$accent = [System.Drawing.ColorTranslator]::FromHtml("#e08a4c")
$accent2 = [System.Drawing.ColorTranslator]::FromHtml("#b3541e")
$line = [System.Drawing.ColorTranslator]::FromHtml("#2e2a24")
$frameLine = [System.Drawing.ColorTranslator]::FromHtml("#3a342b")
$panel = [System.Drawing.ColorTranslator]::FromHtml("#1d1913")

# Fondo sobrio: solo un gradiente cálido.
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $bgRect,
  [System.Drawing.ColorTranslator]::FromHtml("#1a150f"),
  [System.Drawing.ColorTranslator]::FromHtml("#0f0d09"),
  45
)
$g.FillRectangle($bgBrush, $bgRect)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$accentText = New-Object System.Drawing.SolidBrush($accent)
$linePen = New-Object System.Drawing.Pen($line, 1)

# Firma pequeña.
$brandFont = New-Object System.Drawing.Font("Consolas", 16, [System.Drawing.FontStyle]::Bold)
$g.DrawString("GABRIEL", $brandFont, $inkBrush, 96, 76)

$g.DrawLine($linePen, 96, 124, 640, 124)

# Titular y barra de acento.
$titleFont = New-Object System.Drawing.Font("Bahnschrift SemiBold", 64, [System.Drawing.FontStyle]::Regular)
$barRect = New-Object System.Drawing.Rectangle(72, 176, 3, 52)
$barBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($barRect, $accent, $accent2, 90)
$g.FillRectangle($barBrush, $barRect)
$g.DrawString("GACARBLA", $titleFont, $inkBrush, 96, 164)

# Bloques con más aire.
$subFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$g.DrawString("Desarrollador web", $subFont, $mutedBrush, 96, 286)

$bodyFont = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Regular)
$g.DrawString("Webs rápidas y cuidadas", $bodyFont, $inkBrush, 96, 354)
$g.DrawString("Tecnología propia, sin frameworks.", $bodyFont, $mutedBrush, 96, 384)

# Pie alineado con la base del retrato.
$g.DrawLine($linePen, 96, 524, 360, 524)
$urlFont = New-Object System.Drawing.Font("Consolas", 18, [System.Drawing.FontStyle]::Bold)
$g.DrawString("gacarbla.es", $urlFont, $accentText, 96, 540)

# Retrato más pequeño y enmarcado, sin sombras ni adornos extra.
$framePath = New-RoundedPath 788 124 316 400 18
$panelBrush = New-Object System.Drawing.SolidBrush($panel)
$g.FillPath($panelBrush, $framePath)
$framePen = New-Object System.Drawing.Pen($frameLine, 1)
$g.DrawPath($framePen, $framePath)

$portrait = [System.Drawing.Image]::FromFile($portraitPath)
$innerW = 260
$innerH = [int]([math]::Round($portrait.Height * $innerW / $portrait.Width))
$innerX = 788 + [int]((316 - $innerW) / 2)
$innerY = 124 + [int]((400 - $innerH) / 2)
$dest = New-Object System.Drawing.Rectangle($innerX, $innerY, $innerW, $innerH)
$g.DrawImage($portrait, $dest)
$portrait.Dispose()

# Pequeño pie bajo el retrato para cerrar la composición.
$captionFont = New-Object System.Drawing.Font("Consolas", 14, [System.Drawing.FontStyle]::Bold)
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center
$captionRect = New-Object System.Drawing.RectangleF(788, 550, 316, 24)
$g.DrawString("PORTFOLIO · 2026", $captionFont, $mutedBrush, $captionRect, $center)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

$brandFont.Dispose()
$titleFont.Dispose()
$subFont.Dispose()
$bodyFont.Dispose()
$urlFont.Dispose()
$captionFont.Dispose()
$center.Dispose()
$inkBrush.Dispose()
$mutedBrush.Dispose()
$accentText.Dispose()
$linePen.Dispose()
$bgBrush.Dispose()
$barBrush.Dispose()
$panelBrush.Dispose()
$framePen.Dispose()
$framePath.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "og.png generado / generated: $out"
