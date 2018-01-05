interface Url {
    insert(params: any, options?: any): Promise<any>;
}

export default interface UrlshortenerApi {
    url: Url;
}
