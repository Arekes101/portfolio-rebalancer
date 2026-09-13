import express from "express";
import cors from "cors";
import portfolioRoutes from "./routes/portfolioRoutes";

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://d39l33auoopriu.cloudfront.net"
    ]
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Portfolio Rebalancing Bot API is running!"
    });
});

app.use("/portfolio", portfolioRoutes);

export default app;