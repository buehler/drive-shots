import { app } from 'electron';

import { startup } from './main';

async function electronStart(): Promise<void> {
  await app.whenReady();
  startup();
}

electronStart().catch(err => console.error(err));
