import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export type AssetType =
    | "INDIAN_STOCK"
    | "US_STOCK"
    | "CRYPTO";

let cachedUsdInrRate: number | null = null;
let cachedAt = 0;

const FX_CACHE_MS = 5 * 60 * 1000;

export async function getPrice(
    symbol: string,
    assetType: AssetType
) {
    if (assetType === "INDIAN_STOCK") {
        return getIndianStockPrice(symbol);
    }

    if (assetType === "US_STOCK") {
        return getUSStockPrice(symbol);
    }

    if (assetType === "CRYPTO") {
        return getCryptoPrice(symbol);
    }

    throw new Error("Unsupported asset type");
}


async function getIndianStockPrice(symbol: string) {
    const response = await axios.get(
        `https://bharatstockapi.com/v1/stocks/${symbol}`,
        {
            headers: {
                "X-API-Key": process.env.BHARATSTOCK_API_KEY
            }
        }
    );

    return {
        symbol,
        assetType: "INDIAN_STOCK" as const,
        price: response.data.latest_price.close,
        currency: "INR"
    };
}


async function getUSStockPrice(symbol: string) {
    const response = await axios.get(
        "https://www.alphavantage.co/query",
        {
            params: {
                function: "GLOBAL_QUOTE",
                symbol,
                apikey: process.env.ALPHA_VANTAGE_API_KEY
            }
        }
    );

    const quote = response.data["Global Quote"];

    if (!quote || !quote["05. price"]) {
        throw new Error(`Unable to get price for ${symbol}`);
    }

    return {
        symbol,
        assetType: "US_STOCK" as const,
        price: Number(quote["05. price"]),
        currency: "USD" as const
    };
}


async function getCryptoPrice(symbol: string) {
    const cryptoIds: Record<string, string> = {
        BTC: "bitcoin",
        ETH: "ethereum",
        SOL: "solana"
    };

    const id = cryptoIds[symbol.toUpperCase()];

    if (!id) {
        throw new Error(`Unsupported crypto: ${symbol}`);
    }

    const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
            params: {
                ids: id,
                vs_currencies: "usd"
            }
        }
    );

    if (!response.data[id]?.usd) {
        throw new Error(`Unable to get crypto price for ${symbol}`);
    }

    return {
        symbol,
        assetType: "CRYPTO" as const,
        price: response.data[id].usd,
        currency: "USD" as const
    };
}


export async function getUsdInrRate(): Promise<number> {
    const now = Date.now();

    // Reuse rate for 5 minutes
    if (
        cachedUsdInrRate !== null &&
        now - cachedAt < FX_CACHE_MS
    ) {
        return cachedUsdInrRate;
    }

    const response = await axios.get(
        "https://www.alphavantage.co/query",
        {
            params: {
                function: "CURRENCY_EXCHANGE_RATE",
                from_currency: "USD",
                to_currency: "INR",
                apikey: process.env.ALPHA_VANTAGE_API_KEY
            }
        }
    );

    const rate =
        response.data?.["Realtime Currency Exchange Rate"]?.[
            "5. Exchange Rate"
        ];

    if (!rate) {
        throw new Error(
            "Unable to get live USD to INR exchange rate"
        );
    }

    cachedUsdInrRate = Number(rate);
    cachedAt = now;

    console.log(
        `Live USD/INR rate: ${cachedUsdInrRate}`
    );

    return cachedUsdInrRate;
}