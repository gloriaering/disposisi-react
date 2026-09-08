Option Explicit

Dim shell
Dim fso
Dim installerDir
Dim appDir
Dim nodeExe
Dim serverJs

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

installerDir = fso.GetParentFolderName(WScript.ScriptFullName)
appDir = fso.BuildPath(installerDir, "app")

nodeExe = fso.BuildPath(appDir, "node.exe")
serverJs = fso.BuildPath(appDir, "server.js")

If Not fso.FileExists(nodeExe) Then
    MsgBox "node.exe tidak ditemukan.", vbCritical, "Scanner Disposisi"
    WScript.Quit 1
End If

If Not fso.FileExists(serverJs) Then
    MsgBox "server.js tidak ditemukan.", vbCritical, "Scanner Disposisi"
    WScript.Quit 1
End If

shell.CurrentDirectory = appDir

shell.Run """" & nodeExe & """ """ & serverJs & """", 0, False

Set fso = Nothing
Set shell = Nothing