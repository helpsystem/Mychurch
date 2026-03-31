# Release Process (Quick)

## Create a new tag
- `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- `git push origin vX.Y.Z`

## Prepare notes file
- Create `GITHUB_RELEASE_vX.Y.Z.md` in repo root.
- Use `.github/release-template.md` as base.

## Create draft release via script
- `powershell -ExecutionPolicy Bypass -File scripts/create-draft-release.ps1 -Tag vX.Y.Z -Title "vX.Y.Z" -NotesFile GITHUB_RELEASE_vX.Y.Z.md`

## Publish draft
- Open GitHub Releases page.
- Review notes and click Publish release.
