import {
    SESClient,
    SendEmailCommand
} from "@aws-sdk/client-ses";

import {
    analyzePortfolio
} from "./finance/rebalancingService";

import {
    getAllPortfolios
} from "./services/dynamoService";


const ses = new SESClient({
    region: "ap-south-1"
});


function getCurrentIndiaHour() {

    const hour = new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            hour12: false
        }
    ).format(
        new Date()
    );

    return Number(hour);
}


export async function scheduledAnalysis() {

    const currentHour =
        getCurrentIndiaHour();

    console.log(
        "Current India hour:",
        currentHour
    );


    const portfolios =
        await getAllPortfolios();


    console.log(
        "Portfolios found:",
        portfolios.length
    );


    for (const portfolio of portfolios) {

        try {

            const emailAlertsEnabled =
                portfolio.emailAlertsEnabled ??
                true;

            const alertTime =
                portfolio.alertTime ??
                "12:00";

            const alertHour =
                Number(
                    alertTime.split(":")[0]
                );

            const email =
                portfolio.email ||
                portfolio.userId;


            /* EMAIL OFF */

            if (!emailAlertsEnabled) {

                console.log(
                    `Email disabled for ${portfolio.userId}`
                );

                continue;
            }


            /* WRONG TIME */

            if (
                alertHour !==
                currentHour
            ) {

                continue;
            }


            /* NO HOLDINGS */

            if (
                !portfolio.holdings ||
                portfolio.holdings.length === 0
            ) {

                console.log(
                    `No holdings for ${portfolio.userId}`
                );

                continue;
            }


            /* TARGET MUST BE 100% */

            const totalTarget =
                portfolio.holdings.reduce(
                    (
                        sum: number,
                        holding: any
                    ) =>
                        sum +
                        Number(
                            holding.targetAllocation ||
                            0
                        ),
                    0
                );


            if (
                Math.abs(
                    totalTarget - 100
                ) > 0.001
            ) {

                console.log(
                    `Skipping ${portfolio.userId}: target allocation is ${totalTarget}%`
                );

                continue;
            }


            /* ANALYZE */

            const analysis =
                await analyzePortfolio(
                    portfolio.holdings
                );


            const alerts =
                analysis.filter(
                    (item) =>
                        item.action !==
                        "HOLD"
                );


            /* NOTHING TO REPORT */

            if (
                alerts.length === 0
            ) {

                console.log(
                    `No alerts for ${portfolio.userId}`
                );

                continue;
            }


            /* EMAIL BODY */

            const lines =
                alerts.map(
                    (item) =>
                        `${item.symbol} - ${item.action} - ` +
                        `Current: ${item.currentAllocation}% - ` +
                        `Target: ${item.targetAllocation}% - ` +
                        `Suggested Amount: ₹${item.suggestedAmount}`
                );


            const body = `
Portfolio Rebalancing Alert

Portfolio: ${portfolio.name}

${lines.join("\n")}

This is an automated portfolio monitoring alert.

Please review the suggestions before making any investment decision.
`;


            /* SEND */

            await ses.send(
                new SendEmailCommand({

                    Source:
                        process.env.ALERT_EMAIL ||
                        email,

                    Destination: {
                        ToAddresses: [
                            email
                        ]
                    },

                    Message: {

                        Subject: {
                            Data:
                                "Portfolio Rebalancing Alert"
                        },

                        Body: {

                            Text: {
                                Data: body
                            }
                        }
                    }
                })
            );


            console.log(
                "Email sent to:",
                email
            );

        } catch (error) {

            console.error(
                `Scheduler failed for ${portfolio.userId}:`,
                error
            );

        }
    }
}