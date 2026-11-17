# Security checks

## Prevent secrets in new commits

Install Gitleaks on the development machine using the official installation
instructions: https://github.com/gitleaks/gitleaks#installing

On Windows, one supported installation method is:

```powershell
winget install -e --id Gitleaks.Gitleaks
```

From the repository root, enable the local Git hook once:

```bash
npm run security:install-hooks
```

After setup, every local `git commit` scans staged changes with Gitleaks.
A finding blocks the commit. If Gitleaks is not installed, the hook also
fails closed and blocks the commit instead of silently skipping the check.

To scan all locally available Git refs and their history manually:

```bash
npm run security:scan
```

## GitHub scanning

The `.github/workflows/gitleaks.yml` workflow scans the full Git history on
every push and pull request. A finding fails the workflow. It also supports
manual runs from the GitHub Actions tab.

The workflow is a CI backstop; it runs after a push reaches GitHub. To block
secrets at the server before a push is accepted, enable GitHub Push Protection
in the repository settings:
Settings → Advanced Security → Secret Protection → Push protection.
