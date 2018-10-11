export interface AuthToken {
    access_token: string;
    expiry_date: number;
    refresh_token: string;
    token_type: string;
}
