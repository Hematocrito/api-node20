export interface UserDto {
    merchantUserId: string;
}

export interface ProductDto {
    mcc: string;

    merchantCode: string;

    description: string;

    category?: string;
}

export interface VisualInfoDto {
    merchantName: string;

    merchantLogo?: string;
}
export class AstropayDepositDto {
    amount: number;

    currency: string;

    country: string;

    merchantDepositId: string;

    callbackUrl: string;

    user: UserDto;

    product: ProductDto;

    visualInfo: VisualInfoDto;
}
