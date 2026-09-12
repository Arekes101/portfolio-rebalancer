import { Router } from "express";

import {
    createPortfolioController,
    getPortfolioController,
    addHoldingController,
    saveHoldingsController,
    deleteHoldingController,
    analyzePortfolioController,
    getEmailSettingsController,
    saveEmailSettingsController,
    testEmailController
} from "../controllers/portfolioController";


const router = Router();


router.post(
    "/",
    createPortfolioController
);


router.get(
    "/:id",
    getPortfolioController
);


router.post(
    "/:id/holdings",
    addHoldingController
);


router.put(
    "/:id/holdings",
    saveHoldingsController
);


router.delete(
    "/:id/holdings/:symbol",
    deleteHoldingController
);


router.post(
    "/:id/analyze",
    analyzePortfolioController
);


router.get(
    "/:id/settings",
    getEmailSettingsController
);


router.put(
    "/:id/settings",
    saveEmailSettingsController
);


router.post(
    "/:id/settings/test-email",
    testEmailController
);


export default router;