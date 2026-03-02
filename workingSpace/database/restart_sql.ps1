$svcName = "MSSQL" + "$" + "SQLEXP2025"
$svc = Get-WmiObject Win32_Service -Filter "Name='$svcName'"
if ($svc) {
    Write-Host "Leállítás..."
    $svc.StopService() | Out-Null
    Start-Sleep -Seconds 4
    Write-Host "Indítás..."
    $svc.StartService() | Out-Null
    Start-Sleep -Seconds 5
    $status = (Get-WmiObject Win32_Service -Filter "Name='$svcName'").State
    Write-Host "Service status: $status"
} else {
    Write-Host "Service not found: $svcName"
}
