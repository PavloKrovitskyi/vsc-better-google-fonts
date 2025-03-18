'use strict';

import * as vscode from 'vscode';
import GoogleFontFamily from './font';
import GoogleApi from './google.api';

// Holds the pick options for the user :
const pickOptions = {
	matchOnDescription: true,
	matchOnDetail: true,
	placeHolder: 'Type Google Font name',
};

/**
 * Allows to insert any text inside the editor
 * @param text The text you want to insert in the editor at the position where the cursor is
 */
function insertText(text: string) {
	var editor = vscode.window.activeTextEditor;
	if (!editor) return;

	editor
		.edit((editBuilder) => {
			editBuilder.delete(editor.selection);
		})
		.then(() => {
			editor.edit((editBuilder) => {
				editBuilder.insert(editor.selection.start, text);
			});
		});
}

/**
 * Fetches Google Fonts API and lets the user choose a font and its variants.
 */
async function getGoogleFontFamilyItem(): Promise<GoogleFontFamily> {
	const fontsOptions = await GoogleApi.getGoogleFonts();

	return vscode.window
		.showQuickPick(
			fontsOptions.map((item) => item.family),
			pickOptions
		)
		.then((family) => {
			const font = fontsOptions.find((item) => item.family === family);
			if (!font) return null;

			return vscode.window
				.showQuickPick(font.variants, { canPickMany: true })
				.then((variants) => {
					font.variants = variants || [];
					return font;
				});
		});
}

/**
 * Manage the possibility to insert a <link href=".." /> inside the editor
 */
async function insertFontLink() {
	const font = await getGoogleFontFamilyItem();
	if (!font) return;

	// Creating the <link> markup
	const snippet = `<link href="${GoogleApi.generateUrl(
		font
	)}" rel="stylesheet">`;
	// Inserting the link markup inside the editor
	insertText(snippet);
}

/**
 * Manages the possibility to insert a @import url(..) inside the editor
 */
async function insertFontCssImport() {
	const font = await getGoogleFontFamilyItem();
	if (!font) return;

	// Creating the @import url(...) snippet
	const snippet = `@import url("${GoogleApi.generateUrl(font)}");`;
	// Inserting the @import inside the editor
	insertText(snippet);
}

export function activate(context: vscode.ExtensionContext) {
	let insertLink = vscode.commands.registerCommand(
		'extension.insertLink',
		() => {
			var editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage(
					"You can't use this extension if you're not in an HTML file context!"
				);
				return;
			}
			insertFontLink();
		}
	);

	let insertImport = vscode.commands.registerCommand(
		'extension.insertImport',
		() => {
			var editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage(
					"You can't use this extension if you're not in an HTML file context!"
				);
				return;
			}
			insertFontCssImport();
		}
	);

	context.subscriptions.push(insertLink);
	context.subscriptions.push(insertImport);
}

export function deactivate() {}
