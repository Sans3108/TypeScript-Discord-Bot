import { Client } from 'undici';

export async function pastecord(data: string) {
  const BASE_URL = 'https://pastecord.com';

  const undici = new Client(BASE_URL);

  const { body } = await undici.request({
    path: '/documents',
    method: 'POST',
    body: data
  });

  const json: { key: string } = JSON.parse(await body.text());
  const key = json.key;

  return `${BASE_URL}/${key}`;
}
