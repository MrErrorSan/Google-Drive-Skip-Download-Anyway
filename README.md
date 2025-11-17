# Google Drive Auto-Skip Download Dialog

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![CI](https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/workflows/CI/badge.svg)](https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/actions)
[![PR Checks](https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/workflows/Pull%20Request%20Checks/badge.svg)](https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/actions)

A simple, lightweight userscript that automatically clicks "Download anyway" when Google Drive shows the virus scan warning dialog for large files.

## 📋 Description

When downloading large files from Google Drive, you often encounter a warning dialog that says "Google Drive can't scan this file for viruses" with an option to "Download anyway". This userscript automatically clicks that button for you, saving time and clicks.

## ✨ Features

- **Automatic**: Works in the background without any user interaction
- **Lightweight**: Minimal code, no UI overhead
- **Fast**: Detects and clicks the dialog within 100ms
- **Reliable**: Works with Google Drive's various dialog implementations

## 🚀 Installation

### Prerequisites

You need a userscript manager browser extension:

- **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
- **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
- **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Quick Install (Recommended)

1. Install one of the userscript managers above
2. Click on the raw file link: [google-drive-auto-skip-dialog.user.js](https://raw.githubusercontent.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/main/google-drive-auto-skip-dialog.user.js)
3. Your userscript manager will automatically detect the script and show an installation prompt
4. Click "Install" or "Confirm installation"
5. Done! The script is now active

### Manual Install (Alternative)

If automatic installation doesn't work:

1. Install one of the userscript managers above
2. Open the userscript manager dashboard
3. Click "Create a new script" or "New script"
4. Copy and paste the contents of `google-drive-auto-skip-dialog.user.js` into the editor
5. Save the script (Ctrl+S or Cmd+S)
6. Navigate to [Google Drive](https://drive.google.com)
7. The script will automatically activate

## 📖 Usage

Once installed, the script works automatically:

1. Go to Google Drive
2. Click download on any file
3. If the virus scan warning appears, the script will automatically click "Download anyway"
4. Your download will proceed without manual intervention

**Note**: The script only activates on `drive.google.com` domains.

## 🔧 How It Works

The script monitors the page for Google Drive's download warning dialogs. When it detects a dialog containing phrases like:
- "Download anyway"
- "Virus scan"
- "Large file"
- "Cannot scan"

It automatically finds and clicks the "Download anyway" button.

## ⚠️ Disclaimer

This script automatically bypasses Google Drive's virus scan warning. Use at your own risk. Only download files from trusted sources.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### CI/CD Pipeline

This repository uses GitHub Actions for automated testing and validation:

- ✅ **Automated Linting**: Validates userscript syntax and structure
- ✅ **Security Checks**: Scans for potential security issues
- ✅ **PR Validation**: Automatically checks pull requests
- ✅ **Release Automation**: Creates releases when tags are pushed

All checks must pass before a PR can be merged. See [.github/README.md](.github/README.md) for detailed CI/CD documentation.

## 🐛 Issues

If you encounter any issues or have suggestions, please open an issue on [GitHub](https://github.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/issues).

## 📄 Related Scripts

- **[Google Drive Advanced Batch Downloader](https://raw.githubusercontent.com/MrErrorSan/Google-Drive-Skip-Download-Anyway/main/script-advanced-batch-downloader.user.js)** (⚠️ Experimental) - Advanced batch downloader with side panel, file selection, and Google Drive theme matching. Use at your own risk as it's still in development.

## 🙏 Acknowledgments

- Built for the Google Drive community
- Inspired by the need to streamline file downloads

