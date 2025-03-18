import fetch from 'node-fetch';
import GoogleFontFamily from './font';

export default class GoogleApi {
	static async getGoogleFonts(): Promise<GoogleFontFamily[]> {
		const response = await fetch(
			'https://www.googleapis.com/webfonts/v1/webfonts?sort=trending&key=AIzaSyBVwVbN-QhwcaSToxnk1zCEpLuoNXBtFdo'
		);
		const json = await response.json();
		return json.items;
	}

	/**
	 * Creates a final URL to reach a Google Fonts stylesheet
	 * @param font The Google Font API item
	 */
	static generateUrl(font: GoogleFontFamily): string {
		const fontUrl = ['https://fonts.googleapis.com/css?family='];
		fontUrl.push(font.family.replace(/ /g, '+'));
		if (font.variants) {
			fontUrl.push(':');
			fontUrl.push(font.variants.join(','));
		}
		fontUrl.push('&display=swap');
		return fontUrl.join('');
	}
}
