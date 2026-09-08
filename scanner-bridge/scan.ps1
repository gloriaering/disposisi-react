$ErrorActionPreference = "Stop"

try {

    # =====================================================
    # FOLDER HASIL SCAN
    # =====================================================

    $outputFolder = Join-Path $PSScriptRoot "scans"

    if (!(Test-Path $outputFolder)) {
        New-Item `
            -ItemType Directory `
            -Path $outputFolder `
            -Force | Out-Null
    }


    # =====================================================
    # NAMA FILE
    # =====================================================

    $fileName =
        "scan_" +
        (Get-Date -Format "yyyyMMdd_HHmmss") +
        ".jpg"

    $outputPath =
        Join-Path $outputFolder $fileName


    Write-Host "================================="
    Write-Host "MEMULAI SCAN EPSON L3210"
    Write-Host "================================="


    # =====================================================
    # BUKA WIA
    # =====================================================

    Write-Host "Membuka Windows Image Acquisition..."

    $deviceManager =
        New-Object -ComObject WIA.DeviceManager


    if ($null -eq $deviceManager) {
        throw "WIA DeviceManager tidak dapat dibuka."
    }


    # =====================================================
    # CARI EPSON
    # =====================================================

    Write-Host "Mencari scanner Epson..."


    $scanner = $null


    foreach ($deviceInfo in $deviceManager.DeviceInfos) {

        try {

            $deviceName =
                $deviceInfo.Properties.Item("Name").Value

            Write-Host "Perangkat ditemukan:" $deviceName

        }
        catch {

            Write-Host "Perangkat ditemukan, tetapi nama tidak dapat dibaca."

            $deviceName = ""
        }


        # Type 1 = Scanner
        if ($deviceInfo.Type -eq 1) {

            # Prioritaskan Epson
            if (
                $deviceName -like "*EPSON*" -or
                $deviceName -like "*L3210*"
            ) {

                $scanner = $deviceInfo

                Write-Host "EPSON L3210 DITEMUKAN!"

                break
            }
        }
    }


    # =====================================================
    # JIKA EPSON TIDAK DITEMUKAN
    # =====================================================

    if ($null -eq $scanner) {

        Write-Host ""
        Write-Host "Scanner Epson tidak ditemukan."
        Write-Host ""

        throw `
            "EPSON L3210 tidak ditemukan oleh Windows WIA. Pastikan USB Epson terhubung dan Epson Scan 2 dapat mendeteksi scanner."
    }


    # =====================================================
    # CONNECT KE SCANNER
    # =====================================================

    Write-Host "Menghubungkan ke Epson L3210..."

    $device = $scanner.Connect()


    if ($null -eq $device) {

        throw `
            "Gagal menghubungkan ke Epson L3210."
    }


    Write-Host "Berhasil terhubung ke scanner."


    # =====================================================
    # AMBIL ITEM SCANNER
    # =====================================================

    Write-Host "Mencari item scanner..."


    if ($device.Items.Count -lt 1) {

        throw `
            "Epson L3210 tidak memiliki item scanner yang dapat digunakan."
    }


    $item = $device.Items.Item(1)


    if ($null -eq $item) {

        throw `
            "Item scanner Epson tidak ditemukan."
    }


    Write-Host "Item scanner berhasil ditemukan."


    # =====================================================
    # SETTING SCAN
    # =====================================================

    Write-Host "Menyiapkan scanner..."


    try {

        # 6147 = Horizontal Resolution
        $item.Properties.Item(6147).Value = 300

        # 6148 = Vertical Resolution
        $item.Properties.Item(6148).Value = 300

        Write-Host "Resolusi scan: 300 DPI"

    }
    catch {

        Write-Host `
            "Resolusi scanner tidak dapat diatur. Menggunakan setting default Epson."
    }


    # =====================================================
    # FORMAT JPEG
    # =====================================================

    $jpegFormat =
        "{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"


    # =====================================================
    # MULAI SCAN
    # =====================================================

    Write-Host ""
    Write-Host "================================="
    Write-Host "SCANNER SIAP"
    Write-Host "SILAKAN TUNGGU..."
    Write-Host "================================="


    try {

        $image =
            $item.Transfer($jpegFormat)

    }
    catch {

        Write-Host ""
        Write-Host "================================="
        Write-Host "ERROR SAAT TRANSFER SCAN"
        Write-Host "================================="
        Write-Host $_.Exception.Message
        Write-Host ""

        throw `
            "Epson gagal mengambil gambar dari scanner. Pastikan tidak ada aplikasi Epson Scan 2 lain yang sedang menggunakan scanner, lalu coba lagi."
    }


    # =====================================================
    # CEK HASIL SCAN
    # =====================================================

    if ($null -eq $image) {

        throw `
            "Epson tidak menghasilkan gambar."
    }


    Write-Host "Gambar berhasil diterima."


    # =====================================================
    # SIMPAN FILE
    # =====================================================

    Write-Host "Menyimpan hasil scan..."

    $image.SaveFile($outputPath)


    # =====================================================
    # CEK FILE
    # =====================================================

    if (!(Test-Path $outputPath)) {

        throw `
            "File hasil scan tidak berhasil dibuat."
    }


    $fileInfo =
        Get-Item $outputPath


    if ($fileInfo.Length -le 0) {

        throw `
            "File hasil scan kosong."
    }


    # =====================================================
    # BERHASIL
    # =====================================================

    Write-Host ""
    Write-Host "================================="
    Write-Host "SCAN BERHASIL!"
    Write-Host "================================="
    Write-Host "File:" $outputPath
    Write-Host "Ukuran:" $fileInfo.Length "bytes"
    Write-Host "================================="


    # PENTING:
    # Baris terakhir hanya lokasi file
    # untuk dibaca oleh server.js

    Write-Output $outputPath


}
catch {

    Write-Host ""
    Write-Host "================================="
    Write-Host "SCAN GAGAL"
    Write-Host "================================="
    Write-Host "ERROR:"
    Write-Host $_.Exception.Message
    Write-Host "================================="

    Write-Error $_.Exception.Message

    exit 1
} 