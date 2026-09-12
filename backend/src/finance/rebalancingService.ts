import { Holding } from "../models/portfolio";
import {
    getPrice,
    getUsdInrRate
} from "../market/marketService";

const THRESHOLD = 5;

export async function analyzePortfolio(
    holdings: Holding[]
) {
    const results: any[] = [];

    const hasUsdAssets = holdings.some(
        holding =>
            holding.assetType === "US_STOCK" ||
            holding.assetType === "CRYPTO"
    );

    // Get USD → INR once for this analysis
    const usdInr = hasUsdAssets
        ? await getUsdInrRate()
        : null;

    for (const holding of holdings) {

        const market = await getPrice(
            holding.symbol,
            holding.assetType
        );

        let priceINR = market.price;

        if (market.currency === "USD") {

            if (!usdInr) {
                throw new Error(
                    "USD/INR exchange rate unavailable"
                );
            }

            priceINR =
                market.price * usdInr;
        }

        const currentValue =
            holding.quantity * priceINR;

        results.push({
            symbol: holding.symbol,
            assetType: holding.assetType,
            quantity: holding.quantity,
            targetAllocation:
                holding.targetAllocation,
            currentPrice: Number(
                priceINR.toFixed(2)
            ),
            currentValue: Number(
                currentValue.toFixed(2)
            )
        });
    }

    const totalValue =
        results.reduce(
            (sum, item) =>
                sum + item.currentValue,
            0
        );

    if (totalValue <= 0) {
        throw new Error(
            "Portfolio value must be greater than zero"
        );
    }

    return results.map(item => {

        const currentAllocation =
            (item.currentValue / totalValue) * 100;

        const deviation =
            currentAllocation -
            item.targetAllocation;

        let action:
            | "INCREASE"
            | "HOLD"
            | "REDUCE";

        if (deviation > THRESHOLD) {
            action = "REDUCE";
        } else if (deviation < -THRESHOLD) {
            action = "INCREASE";
        } else {
            action = "HOLD";
        }

        const targetValue =
            totalValue *
            (item.targetAllocation / 100);

        const difference =
            targetValue -
            item.currentValue;

        return {
            ...item,

            currentAllocation:
                Number(
                    currentAllocation.toFixed(2)
                ),

            deviation:
                Number(
                    deviation.toFixed(2)
                ),

            action,

            suggestedAmount:
                Number(
                    Math.abs(difference).toFixed(2)
                ),

            usdInrRate:
                usdInr
                    ? Number(usdInr.toFixed(2))
                    : null
        };
    });
}