import { Portfolio, Holding } from "../models/portfolio";

import {
    savePortfolio,
    getPortfolio as getPortfolioFromDB,
    updateHoldings,
    updateEmailSettings
} from "./dynamoService";

export async function getEmailSettings(
    userId: string,
    portfolioId: string
) {

    const portfolio =
        await getPortfolioFromDB(
            userId,
            portfolioId
        );

    if (!portfolio) {
        return undefined;
    }

    return {
        emailAlertsEnabled:
            portfolio.emailAlertsEnabled ?? true,

        alertTime:
            portfolio.alertTime ?? "12:00",

        email:
            portfolio.email ?? userId
    };
}


export async function saveEmailSettings(
    userId: string,
    portfolioId: string,
    emailAlertsEnabled: boolean,
    alertTime: string,
    email: string
) {

    const updated =
        await updateEmailSettings(
            userId,
            portfolioId,
            emailAlertsEnabled,
            alertTime,
            email
        );

    return {
        emailAlertsEnabled:
            updated?.emailAlertsEnabled ?? emailAlertsEnabled,

        alertTime:
            updated?.alertTime ?? alertTime,

        email:
            updated?.email ?? email
    };
}

export async function createPortfolio(
    userId: string,
    name: string
): Promise<Portfolio> {

    const existing = await getPortfolioFromDB(
        userId,
        "default"
    );

    if (existing) {
        return {
            id: existing.portfolioId,
            userId: existing.userId,
            name: existing.name,
            holdings: existing.holdings || []
        };
    }

    const portfolio: Portfolio = {
        id: "default",
        userId,
        name,
        holdings: []
    };

    await savePortfolio({
        userId: portfolio.userId,
        portfolioId: portfolio.id,
        name: portfolio.name,
        holdings: portfolio.holdings
    });

    return portfolio;
}


export async function getPortfolio(
    userId: string,
    portfolioId: string
): Promise<Portfolio | undefined> {

    const item = await getPortfolioFromDB(
        userId,
        portfolioId
    );

    if (!item) {
        return undefined;
    }

    return {
        id: item.portfolioId,
        userId: item.userId,
        name: item.name,
        holdings: item.holdings || []
    };
}


/* ADD HOLDING */

export async function addHolding(
    userId: string,
    portfolioId: string,
    holding: Holding
): Promise<Portfolio | undefined> {

    if (holding.quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
    }

    if (
        holding.targetAllocation <= 0 ||
        holding.targetAllocation > 100
    ) {
        throw new Error(
            "Target allocation must be between 0 and 100"
        );
    }

    const portfolio = await getPortfolio(
        userId,
        portfolioId
    );

    if (!portfolio) {
        return undefined;
    }

    const existingIndex = portfolio.holdings.findIndex(
        h =>
            h.symbol === holding.symbol &&
            h.assetType === holding.assetType
    );

    const newHoldings = [...portfolio.holdings];

    if (existingIndex !== -1) {
        newHoldings[existingIndex] = holding;
    } else {
        newHoldings.push(holding);
    }

    const totalTarget = newHoldings.reduce(
        (sum, h) => sum + h.targetAllocation,
        0
    );

    if (totalTarget > 100) {
        throw new Error(
            `Target allocation cannot exceed 100%. Current total: ${totalTarget}%`
        );
    }

    const updated = await updateHoldings(
        userId,
        portfolioId,
        newHoldings
    );

    return {
        id: updated!.portfolioId,
        userId: updated!.userId,
        name: updated!.name,
        holdings: updated!.holdings
    };
}


/* SAVE EDITED HOLDINGS */

export async function saveHoldings(
    userId: string,
    portfolioId: string,
    holdings: Holding[]
): Promise<Portfolio | undefined> {

    if (!holdings || holdings.length === 0) {
        throw new Error("Portfolio must contain at least one holding");
    }

    for (const holding of holdings) {

        if (holding.quantity <= 0) {
            throw new Error(
                `${holding.symbol}: quantity must be greater than 0`
            );
        }

        if (
            holding.targetAllocation < 0 ||
            holding.targetAllocation > 100
        ) {
            throw new Error(
                `${holding.symbol}: target allocation must be between 0 and 100`
            );
        }
    }

    const duplicateCheck = new Set<string>();

    for (const holding of holdings) {

        const key =
            `${holding.symbol}_${holding.assetType}`;

        if (duplicateCheck.has(key)) {
            throw new Error(
                `Duplicate holding: ${holding.symbol}`
            );
        }

        duplicateCheck.add(key);
    }

    const totalTarget = holdings.reduce(
        (sum, holding) =>
            sum + holding.targetAllocation,
        0
    );

    // IMPORTANT:
    // Save is allowed even when total is not 100%.
    // Analyze will enforce 100%.

    const portfolio = await getPortfolio(
        userId,
        portfolioId
    );

    if (!portfolio) {
        return undefined;
    }

    const updated = await updateHoldings(
        userId,
        portfolioId,
        holdings
    );

    return {
        id: updated!.portfolioId,
        userId: updated!.userId,
        name: updated!.name,
        holdings: updated!.holdings
    };
}


/* DELETE HOLDING */

export async function deleteHolding(
    userId: string,
    portfolioId: string,
    symbol: string,
    assetType: Holding["assetType"]
): Promise<Portfolio | undefined> {

    const portfolio = await getPortfolio(
        userId,
        portfolioId
    );

    if (!portfolio) {
        return undefined;
    }

    const newHoldings = portfolio.holdings.filter(
        holding =>
            !(
                holding.symbol === symbol &&
                holding.assetType === assetType
            )
    );

    if (newHoldings.length === portfolio.holdings.length) {
        throw new Error("Holding not found");
    }

    const updated = await updateHoldings(
        userId,
        portfolioId,
        newHoldings
    );

    return {
        id: updated!.portfolioId,
        userId: updated!.userId,
        name: updated!.name,
        holdings: updated!.holdings
    };
}