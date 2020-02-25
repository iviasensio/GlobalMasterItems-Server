$nl = [Environment]::NewLine

If (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(`
    [Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "You do not have Administrator rights to run this script!`nPlease re-run this script as an Administrator!"
    Write-Host $nl"Press any key to continue ..."
    $x = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Break
}

# Set black background
$Host.UI.RawUI.BackgroundColor = "Black"
Clear-Host

# define some variables
$temp="c:\TempCommentaries\TempCommentariesSetup-yFH4gu"
$npm="npm-1.4.12.zip"
$config="c:\Program Files\Qlik\Sense\ServiceDispatcher"
$target="$config\Node\Commentaries-Server"

# check if module is installed
if(!(Test-Path -Path "$target\node_modules")) {

    $confirm = Read-Host "This script will install Commentaries-Server for Commentaries Qlik Sense Extension, do you want to proceed? [Y/n]"
    if ($confirm -eq 'n') {
      Break
    }

    # check if npm has been downloaded already
	if(!(Test-Path -Path "$temp\$npm")) {
        New-Item -Path "$temp" -Type directory -force | Out-Null
		Invoke-WebRequest "http://nodejs.org/dist/npm/$npm" -OutFile "$temp\$npm"
	}

    # check if module has been downloaded
    if(!(Test-Path -Path "$target\routes")) {
        New-Item -Path "$target\routes" -Type directory | Out-Null
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/commentaries-qliksense-server/master/index.js" -OutFile "$target\index.js"
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/commentaries-qliksense-server/master/db.js" -OutFile "$target\db.js"
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/commentaries-qliksense-server/master/routes/index.js" -OutFile "$target\routes\index.js"
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/commentaries-qliksense-server/master/package.json" -OutFile "$target\package.json"
    }

    # check if npm has been unzipped already
    if(!(Test-Path -Path "$temp\node_modules")) {
        Write-Host "Extracting files..."
        Add-Type -assembly "system.io.compression.filesystem"
        [io.compression.zipfile]::ExtractToDirectory("$temp\$npm", "$temp")
    }

    # install module with dependencies
	Write-Host "Installing modules..."
    Push-Location "$target"
    $env:Path=$env:Path + ";$config\Node"
	&$temp\npm.cmd config set spin=false
	&$temp\npm.cmd --prefix "$target" install
    Pop-Location

    # cleanup temporary data
    Write-Host $nl"Removing temporary files..."
    Remove-Item $temp -recurse
}

function Read-Default($text, $defaultValue) { $prompt = Read-Host "$($text) [$($defaultValue)]"; return ($defaultValue,$prompt)[[bool]$prompt]; }

# check if config has been added already
if (!(Select-String -path "$config\services.conf" -pattern "Identity=aor-commentaries-server" -quiet)) {

	$settings = @"


[commentaries-server]
Identity=aor-commentaries-server
Enabled=true
DisplayName=Commentaries Server
ExecType=nodejs
ExePath=Node\node.exe
Script=Node\commentaries-server\index.js

[commentaries-server.parameters]
auth_port=
comments_port_unsecure=
"@
	Add-Content "$config\services.conf" $settings
}

# configure module
Write-Host $nl"CONFIGURE MODULE"
Write-Host $nl"To make changes to the configuration in the future just re-run this script."

$auth_port=Read-Default $nl"Enter HTTPS port" "8200"
$comments_port_unsecure=Read-Default $nl"Enter HTTP port" "8202"

function Set-Config( $file, $key, $value )
{
    $regreplace = $("(?<=$key).*?=.*")
    $regvalue = $("=" + $value)
    if (([regex]::Match((Get-Content $file),$regreplace)).success) {
        (Get-Content $file) `
            |Foreach-Object { [regex]::Replace($_,$regreplace,$regvalue)
         } | Set-Content $file
    }
}

# write changes to configuration file
Write-Host $nl"Updating configuration..."
Set-Config -file "$config\services.conf" -key "auth_port" -value $auth_port
Set-Config -file "$config\services.conf" -key "comments_port_unsecure" -value $comments_port_unsecure

# Restart ServiceDipatcher
Write-Host $nl"Restarting ServiceDispatcher.."
net stop QlikSenseServiceDispatcher
start-sleep 5
net start QlikSenseServiceDispatcher
Write-Host $nl"'Qlik Sense Service Dispatcher' restarted."$nl

Write-Host $nl"Done! Commentaries write-back module installed."$nl
