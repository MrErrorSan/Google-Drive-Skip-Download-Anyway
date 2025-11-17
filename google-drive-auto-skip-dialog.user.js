// ==UserScript==
// @name         Google Drive Auto-Skip Download Dialog
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically clicks "Download anyway" when Google Drive shows the warning dialog
// @author       MrErrorSan
// @match        https://drive.google.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Google Drive Auto-Skip Dialog: Active');

    // Monitor for Google Drive's "download anyway" dialog
    function monitorDownloadDialog() {
        setInterval(() => {
            // Look for Google Drive's download warning dialog
            const dialogSelectors = [
                '[role="dialog"]',
                '[role="alertdialog"]',
                '[jsname]',
                '[data-dialog]'
            ];

            dialogSelectors.forEach(selector => {
                const dialogs = document.querySelectorAll(selector);
                dialogs.forEach(dialog => {
                    const dialogText = dialog.textContent.toLowerCase();
                    
                    // Check for various warning messages
                    if (dialogText.includes('download anyway') || 
                        dialogText.includes('virus scan') ||
                        dialogText.includes('large file') ||
                        dialogText.includes('cannot scan') ||
                        dialogText.includes('download this file anyway')) {
                        
                        // Find the "Download anyway" button
                        let clicked = false;
                        
                        // Method 1: Look for buttons with specific text
                        const buttons = dialog.querySelectorAll('button, [role="button"], a[role="button"]');
                        buttons.forEach(button => {
                            if (clicked) return;
                            const buttonText = button.textContent.toLowerCase().trim();
                            if (buttonText.includes('download anyway') || 
                                (buttonText.includes('download') && 
                                 !buttonText.includes('cancel') && 
                                 !buttonText.includes('close'))) {
                                try {
                                    button.click();
                                    clicked = true;
                                    console.log('✓ Auto-clicked "Download anyway"');
                                } catch (e) {
                                    console.log('Error clicking button:', e);
                                }
                            }
                        });
                        
                        // Method 2: Look for specific aria-labels
                        if (!clicked) {
                            const downloadButtons = dialog.querySelectorAll('[aria-label*="Download anyway"], [aria-label*="download anyway"]');
                            downloadButtons.forEach(btn => {
                                if (!clicked) {
                                    try {
                                        btn.click();
                                        clicked = true;
                                        console.log('✓ Auto-clicked via aria-label');
                                    } catch (e) {
                                        console.log('Error clicking button:', e);
                                    }
                                }
                            });
                        }
                    }
                });
            });
        }, 100); // Check every 100ms
    }

    // Start monitoring when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', monitorDownloadDialog);
    } else {
        monitorDownloadDialog();
    }
})();

