# Move to orphan branch to start fresh
git checkout --orphan new_main

# Unstage everything (keep files on disk)
git rm -rf --cached . | Out-Null

# Get all tracked files (relative paths)
$files = git ls-files --others --exclude-standard

Write-Host "Found $($files.Count) files to commit individually..."

foreach ($file in $files) {
    if (Test-Path $file) {
        git add $file
        $msg = "add: $file"
        git commit -m $msg
        Write-Host "Committed: $file"
    }
}

# Switch to main
git branch -D main
git branch -m new_main main

Write-Host "Done! Pushing to GitHub..."
git push -u origin main --force
Write-Host "All commits pushed successfully!"
