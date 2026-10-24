$lines = @(Get-Content 'C:\Users\Asus\.gemini\antigravity-ide\brain\2813c523-8379-41ae-a775-f3bf4c52349e\.system_generated\logs\transcript_full.jsonl')
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '"step_index":100,' -and $lines[$i] -match 'PricingPage') {
        Write-Host "Found at file line $i, length=$($lines[$i].Length)"
        # Extract just the CodeContent from the JSON
        if ($lines[$i] -match '"CodeContent":"(.*?)",\s*"Description"') {
            $code = $Matches[1]
            # Unescape
            $code = $code -replace '\\n', "`n"
            $code = $code -replace '\\"', '"'
            $code = $code -replace '\\\\', '\'
            $code | Out-File -FilePath 'd:\Projects\real-estate-main\original_pricing.jsx' -Encoding UTF8
            Write-Host "Saved to original_pricing.jsx"
        } else {
            Write-Host "Could not extract CodeContent"
        }
        break
    }
}
