# CI/CD Pipeline Documentation

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI (`ci.yml`)
Runs on every push and pull request to `main` and `develop` branches.

**Checks:**
- ✅ Validates userscript syntax and headers
- ✅ Checks file sizes
- ✅ Validates README and LICENSE files
- ✅ Security checks (sensitive data, eval usage)
- ✅ Console.log statement count

### 2. Pull Request Checks (`pr-checks.yml`)
Runs automatically when a PR is opened, updated, or reopened.

**Checks:**
- ✅ Validates userscript files in PR
- ✅ Checks userscript header format
- ✅ Validates version numbers
- ✅ Code quality checks (TODO/FIXME comments)
- ✅ Basic code formatting validation

### 3. Release (`release.yml`)
Automatically creates GitHub releases when a tag starting with `v` is pushed.

**Features:**
- ✅ Creates release with version number
- ✅ Includes installation links
- ✅ Attaches userscript files to release

### 4. Dependabot (`dependabot.yml`)
Automatically updates GitHub Actions dependencies.

## Status Badges

The repository includes CI/CD status badges in the README that show:
- CI workflow status
- PR checks status

## How to Use

### For Contributors

1. **Fork and Clone**: Fork the repository and clone it locally
2. **Create Branch**: Create a feature branch from `main`
3. **Make Changes**: Make your changes to the userscript files
4. **Test Locally**: Test your changes in your browser
5. **Commit**: Commit with a clear message
6. **Push**: Push to your fork
7. **Create PR**: Open a pull request - CI will run automatically

### For Maintainers

1. **Review PRs**: Check that CI passes
2. **Merge**: Merge PRs when approved
3. **Create Release**: Tag a new version to trigger release workflow:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Workflow Status

You can check workflow status at:
https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/actions

