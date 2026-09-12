import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    UpdateCommand,
    ScanCommand
} from "@aws-sdk/lib-dynamodb";


const client = new DynamoDBClient({
    region: "ap-south-1"
});

const db =
    DynamoDBDocumentClient.from(client);

const TABLE_NAME =
    "portfolio-rebalancer";


export async function savePortfolio(
    portfolio: any
) {

    await db.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: portfolio
        })
    );

    return portfolio;
}


export async function getPortfolio(
    userId: string,
    portfolioId: string
) {

    const result =
        await db.send(
            new GetCommand({
                TableName: TABLE_NAME,

                Key: {
                    userId,
                    portfolioId
                }
            })
        );

    return result.Item;
}


export async function updateHoldings(
    userId: string,
    portfolioId: string,
    holdings: any[]
) {

    const result =
        await db.send(
            new UpdateCommand({
                TableName: TABLE_NAME,

                Key: {
                    userId,
                    portfolioId
                },

                UpdateExpression:
                    "SET holdings = :holdings",

                ExpressionAttributeValues: {
                    ":holdings": holdings
                },

                ReturnValues: "ALL_NEW"
            })
        );

    return result.Attributes;
}


export async function updateEmailSettings(
    userId: string,
    portfolioId: string,
    emailAlertsEnabled: boolean,
    alertTime: string,
    email: string
) {

    const result =
        await db.send(
            new UpdateCommand({
                TableName: TABLE_NAME,

                Key: {
                    userId,
                    portfolioId
                },

                UpdateExpression:
                    "SET emailAlertsEnabled = :enabled, alertTime = :time, email = :email",

                ExpressionAttributeValues: {
                    ":enabled": emailAlertsEnabled,
                    ":time": alertTime,
                    ":email": email
                },

                ReturnValues: "ALL_NEW"
            })
        );

    return result.Attributes;
}


export async function getAllPortfolios() {

    const result =
        await db.send(
            new ScanCommand({
                TableName: TABLE_NAME
            })
        );

    return result.Items || [];
}