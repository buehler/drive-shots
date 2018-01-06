import { app } from 'electron';

app.on('ready', () => {
    require('./main');
});
