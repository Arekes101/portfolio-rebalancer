import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import {
  register,
  confirmRegistration,
  login
} from "./cognito";

const API_URL =
  "https://yxdcyk8nfc.execute-api.ap-south-1.amazonaws.com";


function App() {

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [confirmationRequired, setConfirmationRequired] =
    useState(false);

  const [loggedIn, setLoggedIn] = useState(false);

  const [portfolioId, setPortfolioId] = useState(
    localStorage.getItem("portfolioId")
  );

  const [portfolioName, setPortfolioName] =
    useState("My Portfolio");

  const [holdings, setHoldings] = useState([]);

  const [analysis, setAnalysis] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailSettingsLoading, setEmailSettingsLoading] =
    useState(false);

  const [isDirty, setIsDirty] = useState(false);

  const [emailAlertsEnabled, setEmailAlertsEnabled] =
    useState(true);

  const [alertTime, setAlertTime] =
    useState("12:00");

  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] =
    useState("INDIAN_STOCK");
  const [quantity, setQuantity] = useState("");
  const [targetAllocation, setTargetAllocation] =
    useState("");


  /* =====================================================
     LOAD PORTFOLIO
  ===================================================== */

  const loadPortfolio = async (
    userEmail,
    savedPortfolioId
  ) => {

    try {

      const response = await axios.get(
        `${API_URL}/portfolio/${savedPortfolioId}?userId=${encodeURIComponent(userEmail)}`
      );

      const portfolio = response.data;

      setPortfolioName(portfolio.name);
      setHoldings(portfolio.holdings || []);
      setIsDirty(false);
      setAnalysis([]);

    } catch (error) {

      console.error(
        "Failed to load portfolio:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to load portfolio"
      );
    }
  };


  /* =====================================================
     LOAD EMAIL SETTINGS
  ===================================================== */

  const loadEmailSettings = async (
    userEmail,
    savedPortfolioId
  ) => {

    try {

      const response = await axios.get(
        `${API_URL}/portfolio/${savedPortfolioId}/settings?userId=${encodeURIComponent(userEmail)}`
      );

      setEmailAlertsEnabled(
        response.data.emailAlertsEnabled ?? true
      );

      setAlertTime(
        response.data.alertTime || "12:00"
      );

    } catch (error) {

      console.error(
        "Failed to load email settings:",
        error
      );
    }
  };


  /* =====================================================
     RESTORE LOGIN
  ===================================================== */

  useEffect(() => {

    const savedEmail =
      localStorage.getItem("userEmail");

    const savedPortfolioId =
      localStorage.getItem("portfolioId");

    if (
      savedEmail &&
      savedPortfolioId
    ) {

      setEmail(savedEmail);
      setPortfolioId(savedPortfolioId);
      setLoggedIn(true);

      loadPortfolio(
        savedEmail,
        savedPortfolioId
      );

      loadEmailSettings(
        savedEmail,
        savedPortfolioId
      );
    }

  }, []);


  /* =====================================================
     REGISTER
  ===================================================== */

  const handleRegister = async () => {

    try {

      if (!email || !password) {
        alert("Enter email and password.");
        return;
      }

      await register(
        email,
        password
      );

      setConfirmationRequired(true);

      alert(
        "Check your email for the verification code."
      );

    } catch (error) {

      alert(error.message);
    }
  };


  /* =====================================================
     CONFIRM REGISTRATION
  ===================================================== */

  const handleConfirm = async () => {

    try {

      if (!code) {
        alert("Enter the verification code.");
        return;
      }

      await confirmRegistration(
        email,
        code
      );

      alert(
        "Email verified. You can now login."
      );

      setConfirmationRequired(false);
      setMode("login");
      setCode("");

    } catch (error) {

      alert(error.message);
    }
  };


  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = async () => {

    try {

      if (!email || !password) {
        alert("Enter email and password.");
        return;
      }

      setLoading(true);

      const result =
        await login(email, password);

      const userEmail =
        result.getIdToken().payload.email;

      localStorage.setItem(
        "userEmail",
        userEmail
      );

      const response =
        await axios.post(
          `${API_URL}/portfolio`,
          {
            userId: userEmail,
            name: "My Portfolio"
          }
        );

      const portfolio =
        response.data;

      localStorage.setItem(
        "portfolioId",
        portfolio.id
      );

      setPortfolioId(portfolio.id);
      setPortfolioName(portfolio.name);
      setHoldings(portfolio.holdings || []);
      setAnalysis([]);
      setIsDirty(false);
      setLoggedIn(true);

      loadEmailSettings(
        userEmail,
        portfolio.id
      );

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        error.message
      );

    } finally {

      setLoading(false);
    }
  };


  /* =====================================================
     ADD HOLDING
     Local only until SAVE
  ===================================================== */

  const addHolding = () => {

    if (
      !symbol ||
      !quantity ||
      !targetAllocation
    ) {

      alert(
        "Please fill all holding fields."
      );

      return;
    }

    const normalizedSymbol =
      symbol.trim().toUpperCase();

    const newQuantity =
      Number(quantity);

    const newTarget =
      Number(targetAllocation);


    if (newQuantity <= 0) {

      alert(
        "Quantity must be greater than 0."
      );

      return;
    }


    if (
      newTarget < 0 ||
      newTarget > 100
    ) {

      alert(
        "Target allocation must be between 0 and 100."
      );

      return;
    }


    const duplicate =
      holdings.some(
        holding =>
          holding.symbol === normalizedSymbol &&
          holding.assetType === assetType
      );

    if (duplicate) {

      alert(
        `${normalizedSymbol} already exists in your portfolio.`
      );

      return;
    }


    const newHolding = {
      symbol: normalizedSymbol,
      assetType,
      quantity: newQuantity,
      targetAllocation: newTarget
    };


    setHoldings([
      ...holdings,
      newHolding
    ]);

    setAnalysis([]);
    setIsDirty(true);

    setSymbol("");
    setQuantity("");
    setTargetAllocation("");
  };


  /* =====================================================
     EDIT HOLDING
     Local only until SAVE
  ===================================================== */

  const updateHoldingField = (
    index,
    field,
    value
  ) => {

    const updated =
      [...holdings];

    updated[index] = {
      ...updated[index],
      [field]:
        field === "quantity" ||
        field === "targetAllocation"
          ? Number(value)
          : value
    };

    setHoldings(updated);
    setAnalysis([]);
    setIsDirty(true);
  };


  /* =====================================================
     DELETE HOLDING
     Local only until SAVE
  ===================================================== */

  const deleteHolding = (
    index
  ) => {

    const holding =
      holdings[index];

    const confirmed =
      window.confirm(
        `Remove ${holding.symbol} from your portfolio?`
      );

    if (!confirmed) {
      return;
    }

    const updated =
      holdings.filter(
        (_, i) => i !== index
      );

    setHoldings(updated);
    setAnalysis([]);
    setIsDirty(true);
  };


  /* =====================================================
     SAVE HOLDINGS
  ===================================================== */

  const saveChanges = async () => {

    try {

      if (holdings.length === 0) {

        alert(
          "Add at least one holding before saving."
        );

        return;
      }


      for (const holding of holdings) {

        if (
          !holding.quantity ||
          holding.quantity <= 0
        ) {

          alert(
            `${holding.symbol}: quantity must be greater than 0.`
          );

          return;
        }

        if (
          holding.targetAllocation < 0 ||
          holding.targetAllocation > 100
        ) {

          alert(
            `${holding.symbol}: target allocation must be between 0 and 100.`
          );

          return;
        }
      }


      setSaving(true);

      const userEmail =
        localStorage.getItem("userEmail");


      const response =
        await axios.put(
          `${API_URL}/portfolio/${portfolioId}/holdings`,
          {
            userId: userEmail,
            holdings
          }
        );


      const portfolio =
        response.data;


      setHoldings(
        portfolio.holdings
      );

      setIsDirty(false);
      setAnalysis([]);


      alert(
        "Changes saved successfully."
      );

    } catch (error) {

      console.error(
        "Save error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to save changes"
      );

    } finally {

      setSaving(false);
    }
  };


  /* =====================================================
     SAVE EMAIL SETTINGS
  ===================================================== */

  const saveEmailSettings = async () => {

    try {

      setEmailSettingsLoading(true);

      const userEmail =
        localStorage.getItem("userEmail");


      const response =
        await axios.put(
          `${API_URL}/portfolio/${portfolioId}/settings`,
          {
            userId: userEmail,
            emailAlertsEnabled,
            alertTime,
            email: userEmail
          }
        );


      setEmailAlertsEnabled(
        response.data.emailAlertsEnabled
      );

      setAlertTime(
        response.data.alertTime
      );


      alert(
        "Email settings saved successfully."
      );

    } catch (error) {

      console.error(
        "Save email settings error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to save email settings"
      );

    } finally {

      setEmailSettingsLoading(false);
    }
  };


  /* =====================================================
     TEST EMAIL
  ===================================================== */

  const sendTestEmail = async () => {

    try {

      setEmailSettingsLoading(true);

      const userEmail =
        localStorage.getItem("userEmail");


      await axios.post(
        `${API_URL}/portfolio/${portfolioId}/settings/test-email`,
        {
          userId: userEmail,
          email: userEmail
        }
      );


      alert(
        "Test email sent. Check your inbox."
      );

    } catch (error) {

      console.error(
        "Test email error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to send test email"
      );

    } finally {

      setEmailSettingsLoading(false);
    }
  };


  /* =====================================================
     ANALYZE
  ===================================================== */

  const analyzePortfolio = async () => {

    if (isDirty) {

      alert(
        "Please save your changes before analyzing."
      );

      return;
    }


    const totalTarget =
      holdings.reduce(
        (sum, holding) =>
          sum +
          Number(
            holding.targetAllocation || 0
          ),
        0
      );


    if (
      Math.abs(totalTarget - 100) >
      0.001
    ) {

      alert(
        `Target allocation must equal 100%. Current total: ${totalTarget.toFixed(2)}%.`
      );

      return;
    }


    try {

      setLoading(true);

      const userEmail =
        localStorage.getItem("userEmail");


      const response =
        await axios.post(
          `${API_URL}/portfolio/${portfolioId}/analyze?userId=${encodeURIComponent(userEmail)}`
        );


      setPortfolioName(
        response.data.portfolioName
      );

      setAnalysis(
        response.data.analysis
      );

    } catch (error) {

      console.error(
        "Analysis error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to analyze portfolio"
      );

    } finally {

      setLoading(false);
    }
  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {

    localStorage.removeItem(
      "userEmail"
    );

    localStorage.removeItem(
      "portfolioId"
    );

    setLoggedIn(false);
    setPortfolioId(null);
    setHoldings([]);
    setAnalysis([]);
    setEmail("");
    setPassword("");
    setIsDirty(false);
  };


  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const targetTotal =
    holdings.reduce(
      (sum, holding) =>
        sum +
        Number(
          holding.targetAllocation || 0
        ),
      0
    );


  const targetIsValid =
    Math.abs(targetTotal - 100) <
    0.001;


  const portfolioValue =
    analysis.reduce(
      (sum, item) =>
        sum +
        Number(
          item.currentValue || 0
        ),
      0
    );


  const canAnalyze =
    holdings.length > 0 &&
    !isDirty &&
    targetIsValid;


  /* =====================================================
     AUTH SCREEN
  ===================================================== */

  if (!loggedIn) {

    return (
      <div className="auth-page">

        <div className="auth-card">

          <div className="brand-mark">
            PR
          </div>

          <h1>
            Portfolio Rebalancer
          </h1>

          <p className="auth-subtitle">
            Monitor and rebalance your investments.
          </p>


          {confirmationRequired ? (

            <>
              <h2>
                Verify your email
              </h2>

              <p>
                Enter the verification code
                sent to your email.
              </p>

              <input
                type="text"
                placeholder="Verification code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
              />

              <button
                className="primary-button"
                onClick={handleConfirm}
              >
                Verify Email
              </button>
            </>

          ) : (

            <>

              <div className="auth-form">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />


                <label>
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />


                {mode === "login" ? (

                  <button
                    className="primary-button"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading
                      ? "Signing in..."
                      : "Sign In"}
                  </button>

                ) : (

                  <button
                    className="primary-button"
                    onClick={handleRegister}
                  >
                    Create Account
                  </button>

                )}

              </div>


              <div className="auth-switch">

                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  onClick={() =>
                    setMode(
                      mode === "login"
                        ? "register"
                        : "login"
                    )
                  }
                >
                  {mode === "login"
                    ? "Create one"
                    : "Sign in"}
                </button>

              </div>

            </>
          )}

        </div>

      </div>
    );
  }


  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon">
            PR
          </div>

          <div>
            <strong>
              Portfolio
            </strong>

            <strong>
              Rebalancer
            </strong>
          </div>

        </div>


        <nav>

          <div className="nav-item active">
            <span>▦</span>
            Portfolio
          </div>

          <div
            className="nav-item"
            onClick={() =>
              document
                .getElementById("analysis")
                ?.scrollIntoView({
                  behavior: "smooth"
                })
            }
          >
            <span>◫</span>
            Analysis
          </div>

        </nav>

      </aside>


      {/* MAIN */}

      <main className="main-content">

        {/* TOP BAR */}

        <div className="topbar">

          <div className="topbar-user">

            <span>
              {email}
            </span>

            <div className="avatar">
              {email.charAt(0).toUpperCase()}
            </div>

            <button
              className="logout-button"
              onClick={logout}
            >
              ↪ &nbsp; Logout
            </button>

          </div>

        </div>


        {/* PAGE HEADER */}

        <section className="page-header">

          <h1>
            {portfolioName}
          </h1>

          <p>
            Manage your holdings and analyze your portfolio.
          </p>

        </section>


        {/* SUMMARY */}

        <section className="summary-card">

          <div className="summary-item">

            <span className="summary-label">
              Total Holdings
            </span>

            <strong className="summary-value">
              {holdings.length}
            </strong>

          </div>


          <div className="summary-divider" />


          <div className="summary-item">

            <span className="summary-label">
              Target Allocation
            </span>

            <strong className="summary-value">
              {targetTotal.toFixed(2)}%
            </strong>

            <span
              className={
                targetIsValid
                  ? "status valid"
                  : "status invalid"
              }
            >
              {targetIsValid
                ? "✓ Target allocation is valid"
                : `Target is ${targetTotal.toFixed(2)}%`}
            </span>

          </div>


          <div className="summary-divider" />


          <div className="summary-item">

            <span className="summary-label">
              Analysis Status
            </span>

            <strong className="summary-value">
              {analysis.length > 0
                ? "Completed"
                : "Not analyzed"}
            </strong>

            <span className="summary-muted">
              {isDirty
                ? "Unsaved changes"
                : "Data is saved"}
            </span>

          </div>


          <div className="summary-divider" />


          <div className="summary-item">

            <span className="summary-label">
              Portfolio Value
            </span>

            <strong className="summary-value">

              {analysis.length > 0
                ? `₹${portfolioValue.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 0
                    }
                  )}`
                : "—"}

            </strong>

            <span className="summary-muted">
              {analysis.length > 0
                ? `Live market valuation${
                    analysis[0]?.usdInrRate
                      ? ` · USD/INR: ₹${analysis[0].usdInrRate}`
                      : ""
                  }`
                : "Analyze to calculate"}
            </span>

          </div>

        </section>


        {/* =================================================
            HOLDINGS
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div className="section-title-row">

              <span className="section-icon">
                ▱
              </span>

              <div>

                <h2>
                  My Holdings
                </h2>

                <p>
                  Add, edit or remove your investments.
                  Save to persist changes.
                </p>

              </div>

            </div>


            <button
              className="primary-action"
              onClick={saveChanges}
              disabled={
                !isDirty ||
                saving ||
                holdings.length === 0
              }
            >
              {saving
                ? "Saving..."
                : "▣  Save Changes"}
            </button>

          </div>


          <div className="table-wrapper">

            <table className="professional-table">

              <thead>

                <tr>

                  <th>#</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>
                    Target Allocation (%)
                  </th>
                  <th>Actions</th>

                </tr>

              </thead>


              <tbody>

                {holdings.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty-state"
                    >
                      No holdings yet. Add your
                      first investment below.
                    </td>

                  </tr>

                ) : (

                  holdings.map(
                    (holding, index) => (

                      <tr
                        key={`${holding.symbol}-${holding.assetType}`}
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <strong>
                            {holding.symbol}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={
                              holding.assetType ===
                              "CRYPTO"
                                ? "type-badge crypto"
                                : holding.assetType ===
                                  "US_STOCK"
                                ? "type-badge us"
                                : "type-badge indian"
                            }
                          >
                            {holding.assetType ===
                            "INDIAN_STOCK"
                              ? "Indian Stock"
                              : holding.assetType ===
                                "US_STOCK"
                              ? "US Stock"
                              : "Crypto"}
                          </span>

                        </td>

                        <td>

                          <input
                            className="table-input"
                            type="number"
                            min="0"
                            step="any"
                            value={
                              holding.quantity
                            }
                            onChange={(e) =>
                              updateHoldingField(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                          />

                        </td>

                        <td>

                          <div className="percentage-input">

                            <input
                              className="table-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                holding.targetAllocation
                              }
                              onChange={(e) =>
                                updateHoldingField(
                                  index,
                                  "targetAllocation",
                                  e.target.value
                                )
                              }
                            />

                            <span>%</span>

                          </div>

                        </td>

                        <td>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteHolding(index)
                            }
                          >
                            ×
                          </button>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>


          <div className="holdings-footer">

            <div>

              <span className="target-total-label">
                Total Target Allocation
              </span>

              <strong
                className={
                  targetIsValid
                    ? "target-total valid-text"
                    : "target-total invalid-text"
                }
              >
                {targetTotal.toFixed(2)}%
              </strong>

              <span
                className={
                  targetIsValid
                    ? "allocation-note valid-note"
                    : "allocation-note"
                }
              >
                {targetIsValid
                  ? "✓ Ready to analyze"
                  : "Must equal 100% to analyze"}
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            ADD HOLDING
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div className="section-title-row">

              <span className="section-icon">
                +
              </span>

              <div>

                <h2>
                  Add New Holding
                </h2>

                <p>
                  Add an investment to your portfolio.
                </p>

              </div>

            </div>

          </div>


          <div className="add-form">

            <div className="form-field">

              <label>
                Symbol
              </label>

              <input
                type="text"
                placeholder="e.g. RELIANCE"
                value={symbol}
                onChange={(e) =>
                  setSymbol(
                    e.target.value.toUpperCase()
                  )
                }
              />

            </div>


            <div className="form-field">

              <label>
                Asset Type
              </label>

              <select
                value={assetType}
                onChange={(e) =>
                  setAssetType(e.target.value)
                }
              >

                <option value="INDIAN_STOCK">
                  Indian Stock
                </option>

                <option value="US_STOCK">
                  US Stock
                </option>

                <option value="CRYPTO">
                  Crypto
                </option>

              </select>

            </div>


            <div className="form-field">

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value)
                }
              />

            </div>


            <div className="form-field">

              <label>
                Target Allocation (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 20"
                value={targetAllocation}
                onChange={(e) =>
                  setTargetAllocation(
                    e.target.value
                  )
                }
              />

            </div>


            <button
              className="primary-action add-button"
              onClick={addHolding}
            >
              + &nbsp; Add Holding
            </button>

          </div>

        </section>


        {/* =================================================
            EMAIL ALERTS
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div className="section-title-row">

              <span className="section-icon">
                ✉
              </span>

              <div>

                <h2>
                  Email Alerts
                </h2>

                <p>
                  Control when your portfolio sends
                  rebalancing notifications.
                </p>

              </div>

            </div>

          </div>


          <div className="email-settings">

            <div className="email-setting-row">

              <div>

                <strong>
                  Daily Portfolio Alerts
                </strong>

                <p>
                  Receive an email when your portfolio
                  requires rebalancing.
                </p>

              </div>


              <button
                className={
                  emailAlertsEnabled
                    ? "toggle enabled"
                    : "toggle"
                }
                onClick={() =>
                  setEmailAlertsEnabled(
                    !emailAlertsEnabled
                  )
                }
              >

                <span />

                {emailAlertsEnabled
                  ? "ON"
                  : "OFF"}

              </button>

            </div>


            <div className="email-setting-divider" />


            <div className="email-setting-row">

              <div>

                <strong>
                  Alert Time
                </strong>

                <p>
                  Daily check time in India Standard Time.
                </p>

              </div>


              <select
                className="alert-time-select"
                value={alertTime}
                onChange={(e) =>
                  setAlertTime(
                    e.target.value
                  )
                }
              >

                <option value="08:00">
                  8:00 AM
                </option>

                <option value="09:00">
                  9:00 AM
                </option>

                <option value="10:00">
                  10:00 AM
                </option>

                <option value="11:00">
                  11:00 AM
                </option>

                <option value="12:00">
                  12:00 PM
                </option>

                <option value="13:00">
                  1:00 PM
                </option>

                <option value="14:00">
                  2:00 PM
                </option>

                <option value="15:00">
                  3:00 PM
                </option>

                <option value="16:00">
                  4:00 PM
                </option>

                <option value="17:00">
                  5:00 PM
                </option>

                <option value="18:00">
                  6:00 PM
                </option>

                <option value="19:00">
                  7:00 PM
                </option>

                <option value="20:00">
                  8:00 PM
                </option>

              </select>

            </div>


            <div className="email-info">

              <span>
                ✓
              </span>

              <div>
                Emails are sent only when
                <strong> INCREASE </strong>
                or
                <strong> REDUCE </strong>
                is detected.
              </div>

            </div>


            <div className="email-actions">

              <button
                className="secondary-action"
                onClick={sendTestEmail}
                disabled={
                  emailSettingsLoading
                }
              >
                {emailSettingsLoading
                  ? "Sending..."
                  : "Send Test Email"}
              </button>


              <button
                className="primary-action"
                onClick={saveEmailSettings}
                disabled={
                  emailSettingsLoading
                }
              >
                {emailSettingsLoading
                  ? "Saving..."
                  : "Save Email Settings"}
              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            ANALYSIS
        ================================================= */}

        <section
          className="panel"
          id="analysis"
        >

          <div className="panel-header">

            <div className="section-title-row">

              <span className="section-icon">
                ▥
              </span>

              <div>

                <h2>
                  Portfolio Analysis
                </h2>

                <p>
                  Live valuation and rebalancing
                  recommendations based on
                  current market prices.
                </p>

              </div>

            </div>


            <button
              className="primary-action"
              onClick={analyzePortfolio}
              disabled={
                loading ||
                !canAnalyze
              }
            >
              {loading
                ? "Analyzing..."
                : "▥  Analyze Portfolio"}
            </button>

          </div>


          {isDirty && (

            <div className="info-message">
              Save your changes before analyzing the portfolio.
            </div>

          )}


          {!isDirty &&
            holdings.length > 0 &&
            !targetIsValid && (

              <div className="warning-message">
                Target allocation must equal 100% before analysis.
              </div>

            )}


          {analysis.length > 0 ? (

            <div className="table-wrapper">

              <table className="professional-table analysis-table">

                <thead>

                  <tr>

                    <th>#</th>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Current Price</th>
                    <th>Current Value</th>
                    <th>Current %</th>
                    <th>Target %</th>
                    <th>Deviation</th>
                    <th>Action</th>
                    <th>Suggested Amount</th>

                  </tr>

                </thead>


                <tbody>

                  {analysis.map(
                    (item, index) => (

                      <tr
                        key={`${item.symbol}-${item.assetType}`}
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <strong>
                            {item.symbol}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={
                              item.assetType ===
                              "CRYPTO"
                                ? "type-badge crypto"
                                : item.assetType ===
                                  "US_STOCK"
                                ? "type-badge us"
                                : "type-badge indian"
                            }
                          >
                            {item.assetType ===
                            "INDIAN_STOCK"
                              ? "Indian Stock"
                              : item.assetType ===
                                "US_STOCK"
                              ? "US Stock"
                              : "Crypto"}
                          </span>

                        </td>

                        <td>
                          {item.quantity}
                        </td>

                        <td>
                          ₹
                          {Number(
                            item.currentPrice
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 2
                            }
                          )}
                        </td>

                        <td>
                          ₹
                          {Number(
                            item.currentValue
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 2
                            }
                          )}
                        </td>

                        <td>
                          {item.currentAllocation}%
                        </td>

                        <td>
                          {item.targetAllocation}%
                        </td>

                        <td>

                          <span
                            className={
                              Math.abs(
                                item.deviation
                              ) > 5
                                ? "deviation-alert"
                                : "deviation-ok"
                            }
                          >
                            {item.deviation > 0
                              ? "+"
                              : ""}
                            {item.deviation}%
                          </span>

                        </td>

                        <td>

                          <span
                            className={
                              item.action ===
                              "REDUCE"
                                ? "action-badge reduce"
                                : item.action ===
                                  "INCREASE"
                                ? "action-badge increase"
                                : "action-badge hold"
                            }
                          >
                            {item.action}
                          </span>

                        </td>

                        <td>

                          ₹
                          {Number(
                            item.suggestedAmount
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 2
                            }
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="analysis-empty">

              <div className="analysis-empty-icon">
                ▥
              </div>

              <h3>
                No analysis yet
              </h3>

              <p>
                Save your holdings with a
                100% target allocation, then
                analyze your portfolio.
              </p>

            </div>

          )}

        </section>


        <footer className="app-footer">

          <span>
            Invest smarter. Stay balanced.
          </span>

          <span>
            Portfolio Rebalancer
          </span>

        </footer>

      </main>

    </div>
  );
}


export default App;