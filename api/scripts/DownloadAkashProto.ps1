$workingDir="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen"
$zipPath="$workingDir/archive.zip"
$akashDownloadUrl="https://github.com/ovrclk/akash/archive/refs/tags/v0.12.1.zip"
$extractPath="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\akash-src-proto"
Invoke-WebRequest -Uri $akashDownloadUrl -OutFile $zipPath

# ensure the output folder exists
$exists = Test-Path -Path $extractPath
if ($exists -eq $false)
{
  New-Item -Path $extractPath -ItemType Directory -Force
}

# load ZIP methods
Add-Type -AssemblyName System.IO.Compression.FileSystem

# open ZIP archive for reading
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

# find all files in ZIP that match the filter (i.e. file extension)
$zip.Entries | 
  Where-Object { $_.FullName -like "*.proto" } |
  ForEach-Object { 
    # extract the selected items from the ZIP archive
    # and copy them to the out folder
   # echo $_.FullName
    $FileName = $_.FullName
    $OutPath =  "$extractPath\$FileName"
    $FolderPath = Split-Path -Path $OutPath
    New-Item -Type Directory -Force -Path $FolderPath
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($_, $OutPath, $true)
    }

# close ZIP file
$zip.Dispose()