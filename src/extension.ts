import * as vscode from 'vscode';
import { Font, getFonts, generateGoogleFontsURL } from './google.api';

let previewPanel: vscode.WebviewPanel | undefined;

async function selectFont(): Promise<Font | undefined> {
	const fonts = await getFonts();

	const previewButton: vscode.QuickInputButton = {
		iconPath: new vscode.ThemeIcon('eye'),
		tooltip: 'Preview font',
	};

	return new Promise((resolve) => {
		const quickPick = vscode.window.createQuickPick<{
			label: string;
			font: Font;
			buttons?: vscode.QuickInputButton[];
		}>();

		quickPick.items = fonts.map((f) => {
			const isVariable = f.axes && f.axes.length > 0;
			const tag = isVariable ? ' (Variable)' : '';
			const subsets = f.subsets.length ? ` [${f.subsets.join(', ')}]` : '';
			return {
				label: `${f.family}${tag}`,
				description: subsets,
				font: f,
				buttons: [previewButton],
			};
		});

		quickPick.placeholder = 'Select a font';

		// Залишається відкритим до явного вибору
		quickPick.onDidAccept(() => {
			const selected = quickPick.selectedItems[0];
			quickPick.hide();
			previewPanel?.dispose(); // закриваємо прев’ю
			resolve(selected?.font);
		});

		quickPick.onDidTriggerItemButton(async (e) => {
			if (e.button === previewButton) {
				const selectedFont = e.item.font;
				const fontUrl = generateGoogleFontsURL([
					{
						family: selectedFont.family,
						variants: selectedFont.variants,
					},
				]);

				const sampleText = 'Work smart, not hard';

				if (!previewPanel) {
					previewPanel = vscode.window.createWebviewPanel(
						'fontPreview',
						`Font Preview`,
						{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
						{ enableScripts: true, retainContextWhenHidden: true }
					);

					previewPanel.onDidDispose(() => {
						previewPanel = undefined;
					});
				}

				previewPanel.title = `Font Preview: ${selectedFont.family}`;
				previewPanel.webview.html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <link href="${fontUrl}" rel="stylesheet">
            <style>
              *{
                margin: 0;
                padding: 0;
              }
              body {
                font-family: '${selectedFont.family}';
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin: 0;
                color: #fff;
                line-height: 1.2;
                text-align: center;
                background: #1e1e1e;
              }
              h1 {
                font-size: 50px;
              }
            </style>
          </head>
          <body>
            <h1>${sampleText}</h1>
          </body>
          </html>
        `;
			}
		});

		// Автоматичне закриття прев’ю при закритті QuickPick
		quickPick.onDidHide(() => {
			previewPanel?.dispose();
			previewPanel = undefined;
		});

		quickPick.show();
	});
}

export function activate(context: vscode.ExtensionContext) {
	let disposableImport = vscode.commands.registerCommand(
		'extension.insertImport',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const font = await selectFont();
			if (!font) return;

			const selectedVariants = await vscode.window.showQuickPick(
				font.variants,
				{
					canPickMany: true,
					placeHolder: 'Select font weights and styles (italic, 400, etc)',
				}
			);

			if (!selectedVariants || selectedVariants.length === 0) return;

			const fontUrl = generateGoogleFontsURL([
				{ family: font.family, variants: selectedVariants },
			]);
			editor.insertSnippet(
				new vscode.SnippetString(`@import url('${fontUrl}');`)
			);
		}
	);

	const insertLink = vscode.commands.registerCommand(
		'extension.insertLink',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const font = await selectFont();
			if (!font) return;

			const selectedVariants = await vscode.window.showQuickPick(
				font.variants,
				{
					canPickMany: true,
					placeHolder: 'Select font weights and styles (italic, 400, etc)',
				}
			);

			if (!selectedVariants || selectedVariants.length === 0) return;

			const fontUrl = generateGoogleFontsURL([
				{ family: font.family, variants: selectedVariants },
			]);

			const documentText = editor.document.getText();

			const needsPreconnect =
				!documentText.includes('https://fonts.googleapis.com') ||
				!documentText.includes('https://fonts.gstatic.com');

			const preconnectSnippet = needsPreconnect
				? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
`
				: '';

			editor.insertSnippet(
				new vscode.SnippetString(
					`${preconnectSnippet}<link href="${fontUrl}" rel="stylesheet">`
				)
			);
		}
	);

	context.subscriptions.push(insertLink);
	context.subscriptions.push(disposableImport);
}

export function deactivate() {}
