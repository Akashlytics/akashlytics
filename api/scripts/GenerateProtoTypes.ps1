$ErrorActionPreference = "Stop"
$protocExe="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\protoc_win\bin\protoc.exe"
$protocGenTsCmd="C:\Sources\akashlytics\api\node_modules\.bin\protoc-gen-ts_proto.cmd"
$outputFolder="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\generated"
$srcFolder="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\akash-src-proto\akash-0.12.1\proto\"
$gogoProto="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\other_proto"
$cosmosProto="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\cosmos\cosmos-sdk-master\proto"
$googleProto="C:\Users\max_m\OneDrive\Documents\docker\akash-proto-gen\google\googleapis-master"

$protoFilesFull = Get-ChildItem -Path $srcFolder -Recurse -File | Group-Object "FullName" | Foreach {"$($_.Name)"}
$protoFilesLocal = $protoFilesFull | Foreach {"$($_.Replace($srcFolder,''))"}
#["/akash.cert.v1beta1.MsgCreateCertificate", MsgCreateCertificate]

New-Item -ItemType Directory -Force -Path $outputFolder

#Generate proto types
& $protocExe --plugin="protoc-gen-ts_proto=$protocGenTsCmd" --ts_proto_out="$outputFolder" --proto_path="$srcFolder" --proto_path="$gogoProto" --proto_path=$googleProto --proto_path=$cosmosProto --ts_proto_opt="esModuleInterop=true,forceLong=long,useOptionals=messages" $protoFilesFull

$imports = New-Object System.Collections.ArrayList
$types = New-Object System.Collections.ArrayList
Foreach ($file in $protoFilesLocal)
{
    $fileNameNoExt = $file.Replace(".proto","")
    $outputPath="$outputFolder\$fileNameNoExt.ts"
    $fileContent = (Get-Content -Path $outputPath)
    $varName = $file.Replace("\","_").Replace(".proto","_types");
    $msgMatches = [Regex]::Matches($fileContent, "export interface (?<msg>Msg[A-Za-z]+)")
    If ($msgMatches.Count -gt 0){
        $msgDefs = $msgMatches | Foreach { "[""/$((Split-Path -Path $fileNameNoExt).Replace("\",".")).$($_.Groups["msg"])"",$($varName).$($_.Groups["msg"])]" }
        $types.AddRange($msgDefs)
        $imports.Add("import * as $($varName) from ""./$($file.Replace("\","/").Replace(".proto",'"'));")
    }
}

echo $types

$indexContent = "import { GeneratedType } from ""@cosmjs/proto-signing"";`r`n$($imports -join "`r`n")`r`nexport const akashTypes: ReadonlyArray<[string, GeneratedType]> = [$($types -join ",`r`n")];" 

$indexOutput = "C:\Sources\akashlytics\api\src\proto\index.ts"
if(!(Test-Path -Path $indexOutput )){
New-Item $indexOutput
}
Set-Content $indexOutput $indexContent

$akashTypes = $protoFilesLocal | Foreach { "[""/$($_.Replace("\","."))"",$($_)]," }
#echo $akashTypes
#echo $protoFilesFull
