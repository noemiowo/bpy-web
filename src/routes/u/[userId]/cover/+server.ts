import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { hashCode } from '$lib/intUtil.js';

const defaultCovers: { [key: string]: Buffer } = {};
const coversFolder = path.join(process.cwd(), 'covers');
if (!existsSync(coversFolder)) mkdirSync(coversFolder);

export async function GET({ params, setHeaders }) {
	const userId = params.userId;
	const coverPath = path.join(coversFolder, `${userId}.jpg`);
	if (existsSync(coverPath)) {
		const cover = await readFile(coverPath);
		setHeaders({
			'Content-Type': 'image/jpeg'
		});
		return new Response(cover, {
			status: 200
		});
	}
	for (let i = 1; i < 9; i++) {
		const defaultCoverPath = path.join(coversFolder, `default${i}.jpg`);
		if (!existsSync(defaultCoverPath)) {
			console.log(`Downloading default cover ${i}...`);
			const response = await fetch(`https://osu.ppy.sh/images/headers/profile-covers/c${i}.jpg`, {
				method: 'GET'
			});
			const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
			const buffer: Uint8Array = new Uint8Array(Buffer.from(arrayBuffer));
			await writeFile(defaultCoverPath, buffer);
			defaultCovers[i] = Buffer.from(arrayBuffer);
		} else {
			if (!defaultCovers[i]) {
				const cover = await readFile(defaultCoverPath);
				defaultCovers[i] = cover;
			}
		}
	}

	const userIDHash = hashCode(parseInt(userId));
	const usersRandomDefaultCover = defaultCovers[(userIDHash % 8) + 1];

	return new Response(usersRandomDefaultCover, {
		status: 200
	});
}
