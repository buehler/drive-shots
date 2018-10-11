import { app } from 'electron';

console.log('asdfasdf');
async function start(): Promise<void> {
  await app.whenReady();
  console.log('ye');
}

start()
  .then(() => console.log('when ready'))
  .catch(err => console.error(err));
