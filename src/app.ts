import { injectable } from 'inversify';

@injectable()
export default class App {
    public start(): void {
        console.log('start');
    }
}
