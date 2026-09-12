import { Request, Response } from "express";

import {
    createPortfolio,
    getPortfolio,
    addHolding,
    saveHoldings,
    deleteHolding
} from "../services/portfolioService";

import { analyzePortfolio } from "../finance/rebalancingService";
import { Holding } from "../models/portfolio";

import {
    getEmailSettings,
    saveEmailSettings
} from "../services/portfolioService";

import {
    SESClient,
    SendEmailCommand
} from "@aws-sdk/client-ses";

const ses = new SESClient({
    region: "ap-south-1"
});


export async function getEmailSettingsController(
    req: Request,
    res: Response
) {

    try {

        const portfolioId =
            req.params.id as string;

        const userId =
            req.query.userId as string;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        const settings =
            await getEmailSettings(
                userId,
                portfolioId
            );

        if (!settings) {
            return res.status(404).json({
                message: "Portfolio not found"
            });
        }

        return res.json(settings);

    } catch (error) {

        console.error(
            "Get email settings error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get email settings"
        });
    }
}


export async function saveEmailSettingsController(
    req: Request,
    res: Response
) {

    try {

        const portfolioId =
            req.params.id as string;

        const {
            userId,
            emailAlertsEnabled,
            alertTime,
            email
        } = req.body;

        if (!userId) {

            return res.status(400).json({
                message: "userId is required"
            });
        }

        if (
            typeof emailAlertsEnabled !==
            "boolean"
        ) {

            return res.status(400).json({
                message:
                    "emailAlertsEnabled must be true or false"
            });
        }

        if (
            !alertTime ||
            !/^\d{2}:\d{2}$/.test(alertTime)
        ) {

            return res.status(400).json({
                message:
                    "alertTime must be in HH:MM format"
            });
        }

        const alertHour =
            Number(alertTime.split(":")[0]);

        if (
            alertHour < 0 ||
            alertHour > 23
        ) {

            return res.status(400).json({
                message:
                    "Invalid alert time"
            });
        }

        const savedEmail =
            email || userId;

        const settings =
            await saveEmailSettings(
                userId,
                portfolioId,
                emailAlertsEnabled,
                alertTime,
                savedEmail
            );

        return res.json(settings);

    } catch (error) {

        console.error(
            "Save email settings error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to save email settings"
        });
    }
}


export async function testEmailController(
    req: Request,
    res: Response
) {

    try {

        const {
            userId,
            email
        } = req.body;

        if (!userId && !email) {

            return res.status(400).json({
                message:
                    "userId or email is required"
            });
        }

        const recipient =
            email || userId;

        await ses.send(
            new SendEmailCommand({

                Source:
                    process.env.ALERT_EMAIL ||
                    recipient,

                Destination: {
                    ToAddresses: [
                        recipient
                    ]
                },

                Message: {

                    Subject: {
                        Data:
                            "Portfolio Rebalancer Test Email"
                    },

                    Body: {

                        Text: {
                            Data:
                                "Your Portfolio Rebalancer email alerts are working correctly."
                        }
                    }
                }
            })
        );

        return res.json({
            message:
                "Test email sent successfully"
        });

    } catch (error) {

        console.error(
            "Test email error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to send test email"
        });
    }
}

export async function createPortfolioController(
    req: Request,
    res: Response
) {
    try {
        const { userId, name } = req.body;

        if (!userId || !name) {
            return res.status(400).json({
                message: "userId and name are required"
            });
        }

        const portfolio = await createPortfolio(
            userId,
            name
        );

        return res.status(201).json(portfolio);

    } catch (error) {
        console.error("Create portfolio error:", error);

        return res.status(500).json({
            message: "Failed to create portfolio"
        });
    }
}


export async function getPortfolioController(
    req: Request,
    res: Response
) {
    try {
        const portfolioId = req.params.id as string;
        const userId = req.query.userId as string;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        const portfolio = await getPortfolio(
            userId,
            portfolioId
        );

        if (!portfolio) {
            return res.status(404).json({
                message: "Portfolio not found"
            });
        }

        return res.json(portfolio);

    } catch (error) {
        console.error("Get portfolio error:", error);

        return res.status(500).json({
            message: "Failed to get portfolio"
        });
    }
}


export async function addHoldingController(
    req: Request,
    res: Response
) {
    try {
        const portfolioId = req.params.id as string;
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        const holding: Holding = {
            symbol: req.body.symbol,
            assetType: req.body.assetType,
            quantity: Number(req.body.quantity),
            targetAllocation: Number(req.body.targetAllocation)
        };

        const portfolio = await addHolding(
            userId,
            portfolioId,
            holding
        );

        if (!portfolio) {
            return res.status(404).json({
                message: "Portfolio not found"
            });
        }

        return res.json(portfolio);

    } catch (error) {
        console.error("Add holding error:", error);

        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to add holding"
        });
    }
}


export async function saveHoldingsController(
    req: Request,
    res: Response
) {
    try {
        const portfolioId = req.params.id as string;
        const { userId, holdings } = req.body;

        if (!userId || !holdings) {
            return res.status(400).json({
                message: "userId and holdings are required"
            });
        }

        const portfolio = await saveHoldings(
            userId,
            portfolioId,
            holdings
        );

        if (!portfolio) {
            return res.status(404).json({
                message: "Portfolio not found"
            });
        }

        return res.json(portfolio);

    } catch (error) {
        console.error("Save holdings error:", error);

        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to save holdings"
        });
    }
}


export async function deleteHoldingController(
    req: Request,
    res: Response
) {
    try {
        const portfolioId = req.params.id as string;
        const symbol = req.params.symbol as string;
        const assetType =
            req.query.assetType as Holding["assetType"];
        const userId = req.query.userId as string;

        if (!userId || !assetType) {
            return res.status(400).json({
                message: "userId and assetType are required"
            });
        }

        const portfolio = await deleteHolding(
            userId,
            portfolioId,
            symbol,
            assetType
        );

        if (!portfolio) {
            return res.status(404).json({
                message: "Portfolio not found"
            });
        }

        return res.json(portfolio);

    } catch (error) {
        console.error("Delete holding error:", error);

        return res.status(400).json({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to delete holding"
        });
    }
}


export async function analyzePortfolioController(
    req: Request,
    res: Response
) {
    try {
        const portfolioId = req.params.id as string;
        const userId = req.query.userId as string;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        const portfolio = await getPortfolio(
            userId,
            portfolioId
        );

        if (!portfolio) {
            return res.status(404).json({
                message: "Portfolio not found"
            });
        }

        if (portfolio.holdings.length === 0) {
            return res.status(400).json({
                message: "Portfolio has no holdings"
            });
        }

        // Target allocation must be exactly 100%
        const totalTargetAllocation =
            portfolio.holdings.reduce(
                (sum, holding) =>
                    sum + holding.targetAllocation,
                0
            );

        if (
            Math.abs(totalTargetAllocation - 100) > 0.001
        ) {
            return res.status(400).json({
                message:
                    `Target allocation must equal 100%. Current total: ${totalTargetAllocation}%`
            });
        }

        const analysis = await analyzePortfolio(
            portfolio.holdings
        );

        return res.json({
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            analysis
        });

    } catch (error) {
        console.error(
            "Portfolio analysis error:",
            error
        );

        return res.status(500).json({
            message: "Failed to analyze portfolio"
        });
    }
}