#define MyAppName "Scanner Disposisi"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Scanner Disposisi"

[Setup]
AppId={{8B8F7B6E-5E4C-4A5B-9D7A-9F3A1C2E6B11}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}

DefaultDirName={localappdata}\Scanner Disposisi
DisableProgramGroupPage=yes
PrivilegesRequired=lowest

OutputDir=output
OutputBaseFilename=Scanner_Disposisi_Setup

Compression=lzma
SolidCompression=yes
WizardStyle=modern

Uninstallable=yes

[Files]
Source: "app\*"; DestDir: "{app}\app"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "start-scanner.vbs"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{userstartup}\Scanner Disposisi"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\start-scanner.vbs"""; WorkingDir: "{app}"

[Run]
Filename: "{sys}\wscript.exe"; Parameters: """{app}\start-scanner.vbs"""; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent