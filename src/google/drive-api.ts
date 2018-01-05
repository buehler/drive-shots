interface About {
    get(params: { fields: string }, options?: any): Promise<any>;
}

interface Files {

}

interface Permissions {

}

export default interface DriveApi {
    about: About;
    files: Files;
    permissions: Permissions;
}
