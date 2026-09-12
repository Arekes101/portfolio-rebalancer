export interface Holding {
    symbol: string;
    assetType: "INDIAN_STOCK" | "US_STOCK" | "CRYPTO";
    quantity: number;
    targetAllocation: number;
}

export interface Portfolio {
    id: string;
    userId: string;
    name: string;
    holdings: Holding[];
}