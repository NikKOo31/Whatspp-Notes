// ==UserScript==
// @name         Notas en whatsapp web
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Notas en whatsapp web
// @author       Nico
// @match        https://web.whatsapp.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @grant        none
// @updateURL    https://github.com/NikKOo31/Whatspp-Notes/raw/refs/heads/main/whatsapp-notes.user.js
// @downloadURL  https://github.com/NikKOo31/Whatspp-Notes/raw/refs/heads/main/whatsapp-notes.user.js
// ==/UserScript==

/*
Changelog:
v0.1 (14-07-2025)
- Versión inicial: guarda notas por contacto en WhatsApp Web.
*/

(function () {
    'use strict';

    let currentContact = '';

    function applyStyles() {
        if (document.getElementById('chatnotes-style')) return;

        const style = document.createElement('style');
        style.id = 'chatnotes-style';
        style.textContent = `
            #chatnotes-panel {
                padding: 10px;
                background: #161717;
                border-top: 1px solid #ccc;
                font-size: 14px;
                color: #333;
                display: flex;
                flex-direction: column;
                gap: 6px;
                z-index: 99999;
            }

            #chatnotes-panel .chatnotes-textarea {
                width: 100%;
                height: 80px;
                resize: vertical;
                font-size: 14px;
                padding: 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }

            #chatnotes-panel .chatnotes-button-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #chatnotes-panel .chatnotes-status {
                flex: 1;
                color: #d9534f;
                font-size: 13px;
            }

            #chatnotes-panel .chatnotes-button {
                align-self: flex-end;
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                background: #f8f9fa;
                color: #000;
                cursor: pointer;
            }

            #chatnotes-panel .chatnotes-button:disabled {
                background: #999;
            }
        `;
        document.head.appendChild(style);
    }

    function createNotesPanel(contactName) {
        const container = document.createElement('div');
        container.id = 'chatnotes-panel';

        const textArea = document.createElement('textarea');
        textArea.className = 'chatnotes-textarea';
        textArea.placeholder = 'Escribí tus notas para este contacto...';
        let originalValue = localStorage.getItem('notes_' + contactName) || '';
        textArea.value = originalValue;

        const status = document.createElement('span');
        status.className = 'chatnotes-status';
        status.textContent = '';

        const saveButton = document.createElement('button');
        saveButton.className = 'chatnotes-button';
        saveButton.textContent = '💾 Guardar';

        saveButton.addEventListener('click', () => {
            const newValue = textArea.value.trim();
            localStorage.setItem('notes_' + contactName, newValue);
            originalValue = newValue;
            status.textContent = '';
            saveButton.textContent = '✅ Guardado';
            saveButton.disabled = true;
            setTimeout(() => {
                saveButton.textContent = '💾 Guardar';
                saveButton.disabled = false;
            }, 1500);
        });

        textArea.addEventListener('input', () => {
            const currentValue = textArea.value.trim();
            if (currentValue !== originalValue) {
                status.textContent = 'Cambios sin guardar';
            } else {
                status.textContent = '';
            }
        });

        const controls = document.createElement('div');
        controls.className = 'chatnotes-button-container';
        controls.appendChild(status);
        controls.appendChild(saveButton);

        container.appendChild(textArea);
        container.appendChild(controls);
        return container;
    }

    function insertOrReplacePanel(contactName) {
        currentContact = contactName;

        const mainHeader = document.querySelector('#main header');
        if (!mainHeader) return;

        const parent = mainHeader.parentElement;
        if (!parent) return;

        // Eliminar si ya existe
        const oldPanel = document.getElementById('chatnotes-panel');
        if (oldPanel) oldPanel.remove();

        // Crear e insertar
        const panel = createNotesPanel(contactName);
        parent.insertBefore(panel, mainHeader.nextSibling);
    }

    function observePage() {
        const observer = new MutationObserver(() => {
            const main = document.querySelector('#main span');
            const contactName = main?.textContent || '';

            if (main && contactName.length > 0 && contactName !== currentContact) {
                insertOrReplacePanel(contactName);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    const init = setInterval(() => {
        const app = document.querySelector('#app');
        if (app) {
            clearInterval(init);
            applyStyles();
            observePage();

            const contactName = document.querySelector('#main span')?.textContent;
            if (contactName) insertOrReplacePanel(contactName);
        }
    }, 500);
})();
