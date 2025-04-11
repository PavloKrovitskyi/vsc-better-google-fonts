import fetch from 'node-fetch';

export interface Font {
	family: string;
	variants: string[];
	subsets?: string[];
	axes?: { tag: string; min: number; max: number }[];
}

export async function getFonts(): Promise<Font[]> {
	const API_KEY = 'AIzaSyAjdoSTUaoRlI8yMnIG1er_eQuaI0Bu8Y4';
	const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=alpha`;

	const response = await fetch(url);
	const data = await response.json();

	return data.items.map((item: any) => ({
		family: item.family,
		variants: item.variants,
		subsets: item.subsets || [],
		axes: item.axes || [],
	}));
}

export function generateGoogleFontsURL(fonts: Font[]): string {
	const baseUrl = 'https://fonts.googleapis.com/css2?';

	const families = fonts.map((font) => {
		const { family, variants, axes } = font;

		const italicWeights: number[] = [];
		const normalWeights: number[] = [];

		for (const variant of variants) {
			if (variant.includes('italic')) {
				const weight = parseInt(variant.replace('italic', ''), 10) || 400;
				italicWeights.push(weight);
			} else if (variant === 'regular') {
				normalWeights.push(400);
			} else {
				const weight = parseInt(variant, 10);
				normalWeights.push(weight);
			}
		}

		const unique = (arr: number[]) => [...new Set(arr)].sort((a, b) => a - b);

		const normal = unique(normalWeights);
		const italic = unique(italicWeights);

		const isItalic = italic.length > 0;
		const isVariable = axes && axes.length > 0;
		const hasOpsz = isVariable && axes.some((a) => a.tag === 'opsz');
		const opsz = axes?.find((a) => a.tag === 'opsz');
		const opszRange = opsz ? `${opsz.min}..${opsz.max}` : null;

		let pairs: string[] = [];

		if (isItalic && normal.length > 0) {
			pairs = [
				...normal.map((w) => `0${hasOpsz ? `,${opszRange}` : ''},${w}`),
				...italic.map((w) => `1${hasOpsz ? `,${opszRange}` : ''},${w}`),
			];
		} else if (isItalic) {
			pairs = italic.map((w) => `1${hasOpsz ? `,${opszRange}` : ''},${w}`);
		} else {
			pairs = normal.map((w) => (hasOpsz ? `${opszRange},${w}` : `${w}`));
		}

		const axesParts = [];
		if (isItalic) axesParts.push('ital');
		if (hasOpsz) axesParts.push('opsz');
		axesParts.push('wght');

		return `family=${encodeURIComponent(family)}:${axesParts.join(
			','
		)}@${pairs.join(';')}`;
	});

	return `${baseUrl}${families.join('&')}&display=swap`;
}
