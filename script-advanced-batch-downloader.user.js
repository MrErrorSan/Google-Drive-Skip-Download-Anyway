// ==UserScript==
// @name         Google Drive Advanced Batch Downloader (Experimental)
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  [EXPERIMENTAL] Advanced batch downloader with side panel, file selection, and Google Drive theme
// @author       You
// @match        https://drive.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        autoSkipDialog: GM_getValue('autoSkipDialog', true),
        fileSizeThreshold: 100 * 1024 * 1024, // 100MB
        panelWidth: 320
    };

    // State
    let fileList = [];
    let selectedFiles = new Set();
    let downloadQueue = [];
    let isProcessing = false;
    let observer = null;
    let scanDebounceTimer = null;
    let lastScanTime = 0;
    let panelVisible = false;

    // Add custom styles matching Google Drive theme
    GM_addStyle(`
        #gdrive-batch-downloader {
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
        }
        
        #gdrive-batch-trigger {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            background: #1a73e8;
            color: white;
            padding: 12px 8px;
            border-radius: 8px 0 0 8px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: -2px 0 8px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        
        #gdrive-batch-trigger:hover {
            background: #1557b0;
            padding-right: 12px;
        }
        
        #gdrive-batch-panel {
            position: fixed;
            right: -${CONFIG.panelWidth}px;
            top: 0;
            width: ${CONFIG.panelWidth}px;
            height: 100vh;
            background: white;
            box-shadow: -2px 0 8px rgba(0,0,0,0.15);
            z-index: 9998;
            transition: right 0.3s ease;
            overflow-y: auto;
            overflow-x: hidden;
        }
        
        #gdrive-batch-panel.visible {
            right: 0;
        }
        
        #gdrive-batch-panel-header {
            background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
            color: white;
            padding: 20px;
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        #gdrive-batch-panel-header h2 {
            margin: 0 0 10px 0;
            font-size: 18px;
            font-weight: 500;
        }
        
        #gdrive-batch-panel-header .subtitle {
            font-size: 12px;
            opacity: 0.9;
        }
        
        #gdrive-batch-panel-content {
            padding: 16px;
        }
        
        .gdrive-control-section {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e8eaed;
        }
        
        .gdrive-control-section:last-child {
            border-bottom: none;
        }
        
        .gdrive-control-section h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 500;
            color: #202124;
        }
        
        .gdrive-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
        }
        
        .gdrive-toggle label {
            font-size: 13px;
            color: #5f6368;
            cursor: pointer;
            flex: 1;
        }
        
        .gdrive-switch {
            position: relative;
            width: 40px;
            height: 20px;
            background: #dadce0;
            border-radius: 20px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .gdrive-switch.active {
            background: #1a73e8;
        }
        
        .gdrive-switch::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: left 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .gdrive-switch.active::after {
            left: 22px;
        }
        
        .gdrive-button {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            width: 100%;
            transition: background 0.2s;
            margin-bottom: 8px;
        }
        
        .gdrive-button:hover {
            background: #1557b0;
        }
        
        .gdrive-button:active {
            background: #0d47a1;
        }
        
        .gdrive-button:disabled {
            background: #dadce0;
            color: #80868b;
            cursor: not-allowed;
        }
        
        .gdrive-button.secondary {
            background: #f1f3f4;
            color: #202124;
        }
        
        .gdrive-button.secondary:hover {
            background: #e8eaed;
        }
        
        .gdrive-button.danger {
            background: #ea4335;
        }
        
        .gdrive-button.danger:hover {
            background: #c5221f;
        }
        
        .gdrive-button.success {
            background: #34a853;
        }
        
        .gdrive-button.success:hover {
            background: #2d8e47;
        }
        
        .gdrive-file-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e8eaed;
            border-radius: 4px;
            margin-top: 12px;
        }
        
        .gdrive-file-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #f1f3f4;
            transition: background 0.1s;
        }
        
        .gdrive-file-item:last-child {
            border-bottom: none;
        }
        
        .gdrive-file-item:hover {
            background: #f8f9fa;
        }
        
        .gdrive-file-item.selected {
            background: #e8f0fe;
        }
        
        .gdrive-file-checkbox {
            margin-right: 12px;
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #1a73e8;
        }
        
        .gdrive-file-info {
            flex: 1;
            min-width: 0;
        }
        
        .gdrive-file-name {
            font-size: 13px;
            color: #202124;
            font-weight: 400;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px;
        }
        
        .gdrive-file-size {
            font-size: 11px;
            color: #5f6368;
        }
        
        .gdrive-stats {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 12px;
            color: #5f6368;
            margin-top: 12px;
        }
        
        .gdrive-stats strong {
            color: #202124;
        }
        
        .gdrive-select-all {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f8f9fa;
            border-bottom: 1px solid #e8eaed;
            font-size: 13px;
            font-weight: 500;
            color: #202124;
        }
        
        .gdrive-select-all label {
            cursor: pointer;
            display: flex;
            align-items: center;
        }
        
        .gdrive-select-all input {
            margin-right: 8px;
            accent-color: #1a73e8;
        }
        
        .gdrive-empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #5f6368;
        }
        
        .gdrive-empty-state-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        
        .gdrive-empty-state-text {
            font-size: 14px;
        }
        
        .gdrive-progress {
            margin-top: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 12px;
            color: #5f6368;
        }
        
        .gdrive-progress-bar {
            width: 100%;
            height: 4px;
            background: #e8eaed;
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
        }
        
        .gdrive-progress-fill {
            height: 100%;
            background: #1a73e8;
            transition: width 0.3s;
        }
    `);

    // Create side panel
    function createSidePanel() {
        // Remove existing if any
        const existing = document.getElementById('gdrive-batch-downloader');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'gdrive-batch-downloader';

        // Trigger button
        const trigger = document.createElement('div');
        trigger.id = 'gdrive-batch-trigger';
        trigger.textContent = '📥 Batch Download';
        trigger.addEventListener('click', togglePanel);

        // Side panel
        const panel = document.createElement('div');
        panel.id = 'gdrive-batch-panel';
        
        panel.innerHTML = `
            <div id="gdrive-batch-panel-header">
                <h2>📥 Batch Downloader</h2>
                <div class="subtitle">Select and download files</div>
            </div>
            <div id="gdrive-batch-panel-content">
                <div class="gdrive-control-section">
                    <h3>Settings</h3>
                    <div class="gdrive-toggle">
                        <label for="auto-skip-toggle">Auto-skip "Download anyway"</label>
                        <div class="gdrive-switch ${CONFIG.autoSkipDialog ? 'active' : ''}" id="auto-skip-switch"></div>
                    </div>
                </div>
                
                <div class="gdrive-control-section">
                    <h3>Actions</h3>
                    <button class="gdrive-button secondary" id="scan-files-btn">🔍 Scan Files</button>
                    <button class="gdrive-button success" id="download-selected-btn" disabled>⬇️ Download Selected</button>
                    <button class="gdrive-button" id="download-all-btn" disabled>⬇️ Download All</button>
                </div>
                
                <div class="gdrive-control-section">
                    <h3>Files</h3>
                    <div id="file-list-container">
                        <div class="gdrive-empty-state">
                            <div class="gdrive-empty-state-icon">📁</div>
                            <div class="gdrive-empty-state-text">Click "Scan Files" to find files</div>
                        </div>
                    </div>
                    <div class="gdrive-stats" id="file-stats" style="display: none;">
                        <div><strong id="total-files">0</strong> files</div>
                        <div><strong id="selected-count">0</strong> selected</div>
                    </div>
                </div>
                
                <div class="gdrive-progress" id="download-progress" style="display: none;">
                    <div>Downloading: <strong id="current-file-name">-</strong></div>
                    <div class="gdrive-progress-bar">
                        <div class="gdrive-progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                    <div style="margin-top: 4px; font-size: 11px;">
                        <span id="progress-text">0 / 0</span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(trigger);
        container.appendChild(panel);
        document.body.appendChild(container);

        // Event listeners
        document.getElementById('auto-skip-switch').addEventListener('click', () => {
            CONFIG.autoSkipDialog = !CONFIG.autoSkipDialog;
            GM_setValue('autoSkipDialog', CONFIG.autoSkipDialog);
            document.getElementById('auto-skip-switch').classList.toggle('active', CONFIG.autoSkipDialog);
        });

        document.getElementById('scan-files-btn').addEventListener('click', scanFiles);
        document.getElementById('download-selected-btn').addEventListener('click', downloadSelected);
        document.getElementById('download-all-btn').addEventListener('click', downloadAllFiles);

        return { trigger, panel };
    }

    // Toggle panel visibility
    function togglePanel() {
        const panel = document.getElementById('gdrive-batch-panel');
        panelVisible = !panelVisible;
        panel.classList.toggle('visible', panelVisible);
    }

    // Find file elements
    function findFileElements() {
        const files = [];
        const processedIds = new Set();

        const mainContent = document.querySelector('[role="main"]') || 
                          document.querySelector('[role="grid"]') ||
                          document.querySelector('table') ||
                          document.body;
        
        const rows = mainContent.querySelectorAll('tr[role="row"][data-id], tr[data-id][role="row"]');
        
        rows.forEach((row, index) => {
            if (row.querySelector('th') || row.closest('thead')) {
                return;
            }

            let fileId = row.getAttribute('data-id');
            
            if (!fileId || fileId.startsWith('_') || fileId.length < 10 || processedIds.has(fileId)) {
                return;
            }

            const dataTarget = row.getAttribute('data-target');
            if (dataTarget === 'folder' || dataTarget === 'collection') {
                return;
            }

            processedIds.add(fileId);

            let fileName = null;
            const firstCell = row.querySelector('[role="gridcell"]:first-child, td:first-child');
            
            if (firstCell) {
                const nameElement = firstCell.querySelector('[data-name]') ||
                                  firstCell.querySelector('[data-tooltip]') ||
                                  firstCell.querySelector('span[title]') ||
                                  firstCell.querySelector('div[title]') ||
                                  firstCell.querySelector('a');
                
                if (nameElement) {
                    fileName = nameElement.getAttribute('data-name') || 
                              nameElement.getAttribute('data-tooltip') ||
                              nameElement.getAttribute('title') ||
                              nameElement.textContent?.trim();
                }
                
                if (!fileName || fileName.length === 0) {
                    fileName = firstCell.textContent?.trim();
                }
            }

            if (!fileName || fileName.length === 0) {
                fileName = `File ${index + 1}`;
            }

            fileName = fileName.replace(/\s+/g, ' ').trim();

            const sizeText = row.textContent.match(/([\d.]+)\s*(KB|MB|GB|TB|Bytes?)/i);
            let fileSize = 0;
            if (sizeText) {
                const size = parseFloat(sizeText[1]);
                const unit = sizeText[2].toUpperCase();
                if (unit.includes('KB')) {
                    fileSize = size * 1024;
                } else if (unit.includes('MB')) {
                    fileSize = size * 1024 * 1024;
                } else if (unit.includes('GB')) {
                    fileSize = size * 1024 * 1024 * 1024;
                } else if (unit.includes('TB')) {
                    fileSize = size * 1024 * 1024 * 1024 * 1024;
                }
            }

            const isFolder = row.getAttribute('data-target') === 'folder' ||
                            row.getAttribute('data-target') === 'collection' ||
                            row.querySelector('[aria-label*="Folder"]') !== null ||
                            fileName.toLowerCase().includes('folder');

            if (!isFolder && fileId && fileId.length >= 10) {
                files.push({
                    id: fileId,
                    name: fileName,
                    size: fileSize,
                    element: row
                });
            }
        });

        return files;
    }

    // Render file list
    function renderFileList() {
        const container = document.getElementById('file-list-container');
        const stats = document.getElementById('file-stats');
        const totalFilesEl = document.getElementById('total-files');
        const selectedCountEl = document.getElementById('selected-count');
        const downloadSelectedBtn = document.getElementById('download-selected-btn');
        const downloadAllBtn = document.getElementById('download-all-btn');

        if (fileList.length === 0) {
            container.innerHTML = `
                <div class="gdrive-empty-state">
                    <div class="gdrive-empty-state-icon">📁</div>
                    <div class="gdrive-empty-state-text">No files found. Click "Scan Files" to search.</div>
                </div>
            `;
            stats.style.display = 'none';
            downloadSelectedBtn.disabled = true;
            downloadAllBtn.disabled = true;
            return;
        }

        stats.style.display = 'flex';
        totalFilesEl.textContent = fileList.length;
        selectedCountEl.textContent = selectedFiles.size;
        downloadSelectedBtn.disabled = selectedFiles.size === 0;
        downloadAllBtn.disabled = false;

        const fileListHTML = `
            <div class="gdrive-select-all">
                <label>
                    <input type="checkbox" id="select-all-checkbox" ${selectedFiles.size === fileList.length ? 'checked' : ''}>
                    Select All
                </label>
            </div>
            <div class="gdrive-file-list">
                ${fileList.map((file, index) => `
                    <div class="gdrive-file-item ${selectedFiles.has(file.id) ? 'selected' : ''}" data-file-id="${file.id}">
                        <input type="checkbox" class="gdrive-file-checkbox" 
                               data-file-id="${file.id}" 
                               ${selectedFiles.has(file.id) ? 'checked' : ''}>
                        <div class="gdrive-file-info">
                            <div class="gdrive-file-name" title="${file.name}">${file.name}</div>
                            <div class="gdrive-file-size">${formatFileSize(file.size)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = fileListHTML;

        // Select all checkbox
        document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
            if (e.target.checked) {
                fileList.forEach(file => selectedFiles.add(file.id));
            } else {
                selectedFiles.clear();
            }
            renderFileList();
        });

        // Individual file checkboxes
        container.querySelectorAll('.gdrive-file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const fileId = e.target.dataset.fileId;
                if (e.target.checked) {
                    selectedFiles.add(fileId);
                } else {
                    selectedFiles.delete(fileId);
                }
                renderFileList();
            });
        });
    }

    // Scan files
    function scanFiles() {
        console.log('Scanning for files...');
        fileList = findFileElements();
        selectedFiles.clear();
        renderFileList();
        lastScanTime = Date.now();
        console.log(`✓ Found ${fileList.length} files`);
    }

    // Download selected files
    function downloadSelected() {
        if (selectedFiles.size === 0) {
            alert('Please select at least one file to download.');
            return;
        }

        downloadQueue = fileList.filter(file => selectedFiles.has(file.id));
        startBatchDownload();
    }

    // Download all files
    function downloadAllFiles() {
        if (fileList.length === 0) {
            alert('No files found. Please scan files first.');
            return;
        }

        downloadQueue = [...fileList];
        startBatchDownload();
    }

    // Start batch download
    function startBatchDownload() {
        if (isProcessing) return;

        isProcessing = true;
        const progressDiv = document.getElementById('download-progress');
        const progressFill = document.getElementById('progress-fill');
        const currentFileName = document.getElementById('current-file-name');
        const progressText = document.getElementById('progress-text');
        
        progressDiv.style.display = 'block';
        
        let currentIndex = 0;
        const total = downloadQueue.length;

        function downloadNext() {
            if (currentIndex >= total) {
                isProcessing = false;
                progressDiv.style.display = 'none';
                progressFill.style.width = '0%';
                return;
            }

            const file = downloadQueue[currentIndex];
            currentIndex++;
            
            const progress = Math.round((currentIndex / total) * 100);
            progressFill.style.width = progress + '%';
            currentFileName.textContent = file.name;
            progressText.textContent = `${currentIndex} / ${total}`;

            downloadFile(file, () => {
                setTimeout(downloadNext, 500);
            });
        }

        downloadNext();
    }

    // Download a single file
    function downloadFile(file, callback) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        
        if (file.size > CONFIG.fileSizeThreshold) {
            if (CONFIG.autoSkipDialog) {
                const confirmUrl = `https://drive.google.com/uc?export=download&id=${file.id}&confirm=t`;
                startDownload(confirmUrl, file.name, callback);
            } else {
                showSizeWarningDialog(file, downloadUrl, callback);
            }
        } else {
            startDownload(downloadUrl, file.name, callback);
        }
    }

    // Show size warning dialog
    function showSizeWarningDialog(file, downloadUrl, callback) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; border: 2px solid #4285f4; border-radius: 8px;
            padding: 20px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Roboto, Arial, sans-serif; min-width: 300px;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #1a73e8;">File Too Large</h3>
            <p style="margin: 0 0 15px 0; color: #5f6368;">
                The file "<strong>${file.name}</strong>" is ${formatFileSize(file.size)}.
            </p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancel-download" style="background: #ea4335; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="download-anyway" style="background: #34a853; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Download Anyway</button>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById('cancel-download').addEventListener('click', () => {
            dialog.remove();
            if (callback) callback();
        });

        document.getElementById('download-anyway').addEventListener('click', () => {
            const confirmUrl = `https://drive.google.com/uc?export=download&id=${file.id}&confirm=t`;
            startDownload(confirmUrl, file.name, callback);
            dialog.remove();
        });
    }

    // Start download
    function startDownload(url, fileName, callback) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            if (callback) callback();
        }, 1000);
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Monitor for download dialog (auto-click)
    function monitorDownloadDialog() {
        if (!CONFIG.autoSkipDialog) return;

        setInterval(() => {
            const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
            dialogs.forEach(dialog => {
                const dialogText = dialog.textContent.toLowerCase();
                if (dialogText.includes('download anyway') || 
                    dialogText.includes('virus scan') ||
                    dialogText.includes('large file')) {
                    
                    const buttons = dialog.querySelectorAll('button, [role="button"]');
                    buttons.forEach(button => {
                        const buttonText = button.textContent.toLowerCase().trim();
                        if (buttonText.includes('download anyway') || 
                            (buttonText.includes('download') && 
                             !buttonText.includes('cancel'))) {
                            button.click();
                        }
                    });
                }
            });
        }, 100);
    }

    // Watch for changes
    function watchForChanges() {
        observer = new MutationObserver((mutations) => {
            const now = Date.now();
            if (now - lastScanTime < 2000) return;

            const hasSignificantChanges = mutations.some(mutation => {
                return mutation.addedNodes.length > 0 && 
                       Array.from(mutation.addedNodes).some(node => 
                           node.nodeType === 1 && 
                           (node.matches && (node.matches('tr[data-id]') || node.querySelector('tr[data-id]')))
                       );
            });

            if (hasSignificantChanges && fileList.length === 0) {
                clearTimeout(scanDebounceTimer);
                scanDebounceTimer = setTimeout(() => {
                    lastScanTime = Date.now();
                    scanFiles();
                }, 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        if (!window.location.hostname.includes('drive.google.com')) {
            return;
        }

        createSidePanel();
        monitorDownloadDialog();
        watchForChanges();

        setTimeout(() => {
            lastScanTime = Date.now();
            scanFiles();
        }, 3000);
    }

    init();
})();

