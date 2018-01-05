interface About {
    get(params: any, options?: any): Promise<any>;
}

interface Files {
    create(params: any, options?: any): Promise<any>;
    get(params: any, options?: any): Promise<any>;
    list(params?: any, options?: any): Promise<any>;
}

interface Permissions {
    create(params: any, options?: any): Promise<any>;
}

export default interface DriveApi {
    about: About;
    files: Files;
    permissions: Permissions;
}
