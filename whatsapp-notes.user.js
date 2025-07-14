// ==UserScript==
// @name         Notas en whatsapp web
// @namespace    http://tampermonkey.net/
// @version      0.3
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
v0.3
- Notas ocultas por defecto
- Indicador de lineas existentes en la nota
- Botón para mostrar/ocultar notas
- Botón para eliminacion de notas
- Corrección de estilos

v0.2
- Aviso de datos sin guardar en la nota
- Mejora de estilos

v0.1 (14-07-2025)
- Versión inicial: guardado de notas por contacto en WhatsApp Web.
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
                border: 1px solid #ccc;
                font-size: 14px;
                color: #333;
                display: flex;
                flex-direction: column;
                z-index: 99999;
            }

            #chatnotes-panel .chatnotes-toggle {
                background: transparent;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 14px;
                padding: 0;
            }

            #chatnotes-panel .chatnotes-content {
                overflow: hidden;
                max-height: 0;
                opacity: 0;
                transition: max-height 0.3s ease, opacity 0.3s ease;
            }

            #chatnotes-panel .chatnotes-content.chatnotes-visible {
                max-height: 300px;
                margin-top: 6px;
                opacity: 1;
            }

            #chatnotes-panel .chatnotes-content.chatnotes-hidden {
                max-height: 0;
                margin-top: 0px;
                opacity: 0;
            }

            #chatnotes-panel .chatnotes-textarea {
                width: 100%;
                height: 80px;
                resize: vertical;
                padding: 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-sizing: border-box;
                line-height: 1.4em;
                font-size: 14px;
                height: calc(1.4em * 5 + 12px); /* 5 líneas + padding */
            }

            #chatnotes-panel .chatnotes-textarea {
                overflow-y: scroll; /* en lugar de auto */
            }

            #chatnotes-panel .chatnotes-controls-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 6px;
            }

            #chatnotes-panel .chatnotes-status {
                flex: 1;
                color: #d9534f;
                font-size: 13px;
            }

            #chatnotes-panel .chatnotes-button-group {
                display: flex;
                gap: 6px;
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

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'chatnotes-content chatnotes-hidden';

        const textArea = document.createElement('textarea');
        textArea.className = 'chatnotes-textarea';
        textArea.id = 'chatnotes-textarea';
        textArea.placeholder = 'Escribí tus notas para este contacto...';

        let originalValue = localStorage.getItem('notes_' + contactName) || '';
        textArea.value = originalValue;

        textArea.addEventListener('input', () => {
            const currentValue = textArea.value.trim();
            if (currentValue !== originalValue) {
                status.textContent = 'Cambios sin guardar';
            } else {
                status.textContent = '';
            }
        });

        function countNonEmptyLines(text) {
            return text
                .split('\n')
                .filter(line => line.trim() !== '')
                .length;
        }

        const status = document.createElement('span');
        status.className = 'chatnotes-status';
        status.textContent = '';

        const saveButton = document.createElement('button');
        saveButton.className = 'chatnotes-button chatnotes-save';
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

            updateToggleButton();
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'chatnotes-button chatnotes-delete';
        deleteButton.textContent = '🗑 Borrar';

        deleteButton.addEventListener('click', () => {
            if (confirm('¿Seguro que querés borrar esta nota?')) {
                localStorage.removeItem('notes_' + contactName);
                textArea.value = '';
                originalValue = '';
                status.textContent = '';
                updateToggleButton();
            }
        });

        const toggleButton = document.createElement('button');
        let lineCount = countNonEmptyLines(originalValue);
        toggleButton.textContent = `📝 Mostrar notas (${lineCount})`;
        toggleButton.className = 'chatnotes-toggle';

        toggleButton.addEventListener('click', () => {
            const isHidden = contentWrapper.classList.contains('chatnotes-hidden');
            contentWrapper.classList.toggle('chatnotes-hidden', !isHidden);
            contentWrapper.classList.toggle('chatnotes-visible', isHidden);
            if (isHidden) {
                setTimeout(() => {
                    textArea.focus();
                }, 300);
            }

            updateToggleButton();
        });

        function updateToggleButton() {
            lineCount = countNonEmptyLines(textArea.value.trim());
            const isHidden = contentWrapper.classList.contains('chatnotes-hidden');
            toggleButton.textContent = isHidden ? `📝 Ocultar notas (${lineCount})` : `📝 Mostrar notas (${lineCount})`;
        }

        const btnGroup = document.createElement('div');
        btnGroup.className = 'chatnotes-button-group';
        btnGroup.appendChild(saveButton);
        btnGroup.appendChild(deleteButton);

        const controls = document.createElement('div');
        controls.className = 'chatnotes-controls-container';
        controls.appendChild(status);
        controls.appendChild(btnGroup);

        contentWrapper.appendChild(textArea);
        contentWrapper.appendChild(controls);

        container.appendChild(toggleButton);
        container.appendChild(contentWrapper);
        return container;
    }

    function insertPanel(contactName) {
        currentContact = contactName;

        const mainHeader = document.querySelector('#main header');
        if (!mainHeader) return;

        const parent = mainHeader.parentElement;
        if (!parent) return;

        const oldPanel = document.getElementById('chatnotes-panel');
        if (oldPanel) oldPanel.remove();

        const panel = createNotesPanel(contactName);
        parent.insertBefore(panel, mainHeader.nextSibling);
    }

    function observePage() {
        const observer = new MutationObserver(() => {
            const main = document.querySelector('#main span');
            const contactName = main?.textContent || '';

            if (main && contactName.length > 0 && contactName !== currentContact) {
                insertPanel(contactName);
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
            if (contactName) insertPanel(contactName);
        }
    }, 500);
})();
