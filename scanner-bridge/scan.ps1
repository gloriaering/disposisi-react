$ErrorActionPreference = "Stop"

try {
    # Folder untuk menyimpan hasil scan
    $outputFolder = Join-Path $PSScriptRoot "scans"

    if (!(Test-Path $outputFolder)) {
        New-Item -ItemType Directory -Path $outputFolder | Out-Null
    }

    # Nama file hasil scan
    $fileName = "scan_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".jpg"
    $outputPath = Join-Path $outputFolder $fileName

    # Membuka Windows Image Acquisition (WIA)
    $deviceManager = New-Object -ComObject WIA.DeviceManager

    $scanner = $null

    # Mencari perangkat scanner
    foreach ($device in $deviceManager.DeviceInfos) {
        if ($device.Type -eq 1) {
            $scanner = $device
            break
        }
    }

    # Jika scanner tidak ditemukan
    if ($null -eq $scanner) {
        throw "Scanner tidak ditemukan. Pastikan HP OfficeJet 7612 terhubung ke komputer."
    }

    # Hubungkan ke scanner
    $device = $scanner.Connect()

    if ($null -eq $device) {
        throw "Gagal terhubung ke scanner."
    }

    # Ambil item scanner
    $item = $device.Items.Item(1)

    if ($null -eq $item) {
        throw "Item scanner tidak ditemukan."
    }

    # Format JPEG
    $jpegFormat = "{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"

    # Mulai scan
    $image = $item.Transfer($jpegFormat)

    if ($null -eq $image) {
        throw "Scanner tidak menghasilkan gambar."
    }

    # Simpan hasil scan
    $image.SaveFile($outputPath)

    # Pastikan file berhasil dibuat
    if (!(Test-Path $outputPath)) {
        throw "File hasil scan tidak berhasil dibuat."
    }

    # Kirim lokasi file ke server
    Write-Output $outputPath
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}