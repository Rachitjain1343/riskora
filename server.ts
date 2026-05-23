import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // Initialization of Gemini GenAI with User-Agent for platform telemetry
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for Risk & Financial Impact Analysis
  app.post("/api/analyze-risks", async (req, res) => {
    try {
      const { profileType, domain, scaleValue, currency, region, geopoliticalScenario, isDeepAnalysis } = req.body;

      if (!profileType || !domain) {
        return res.status(400).json({ error: "profileType and domain parameters are required" });
      }

      const currencySymbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

      // Build a strict system instruction to compute proper financial impacts
      const systemInstruction = `You are a world-class financial risk intelligence analyst, geopolitical strategist, and quantitative auditor.
Given a profile type (${profileType}), industry/domain (${domain}), scale context ("${scaleValue || 'average size/income'}"), currency symbol ("${currencySymbol}"), operating region ("${region || 'Global'}"), and a specific tracking geopolitical scenario ("${geopoliticalScenario || 'General Geopolitical Fractures'}"), generate a comprehensive, reality-grounded risk intelligence report that models both qualitative risk vectors and quantifies their financial impact.
${isDeepAnalysis ? "This is a PREMIUM DEEP RISK INTELLIGENCE REPORT. Conduct deep stress-testing on logistics, raw energy inputs, systemic cash flows, interest/currency fluctuations, and operational sustainability. Detail precise threat vectors." : "Conduct a standard risk transmission and operational hazard assessment."}

You MUST perform this risk analysis strictly region-wise. Compute how global macro-hostilities or supply shocks propagate down to local operating levels:
- For example, if a business or individual operates in India: under the scenario of an Iran-USA conflict, model the specific impact of crude oil price spikes on commercial LPG (liquefied petroleum gas) cylinder prices, trade logistics across the Strait of Hormuz, container freight surcharges, and raw energy inputs.
- If they are a farmer in India (or other agricultural regions): model how fertilizer prices rise due to imported petroleum and chemical precursors, how diesel surge raises mechanical tilling and harvest costs, and how global grain supply-demand changes impact domestic farmgate prices.
- Clearly link at least 2 of the high/medium risks generated directly to the targeted geopolitical shock transmission channels (e.g., fuel pricing, transport gridlocks, imported component inflation, currency depletion).

Each risk's financial impact MUST be calculated realistically based on the provided scale:
- "minLoss" and "maxLoss" should reflect the worst-case financial impact/loss (revenue lost, operational disruption, compliance penalties, or capital depreciation) that would likely occur over the timeframe if the risk materializes and is not mitigated. Make sure they are calculated proportionally to the input scale.
- "mitigationCost" is the standard industry expenditure required to proactively address or insure against this risk.
- "roiMultiplier" measures the cost-effectiveness of resolving it (e.g., if we spend $5k to prevent a $50k loss, ROI multiplier is 10.0x).
- Include distinct, hyper-specific risk mitigation strategies.
- For business profiles, focus on operational bottlenecks, supply chains, regulatory fines, customer churn, competitor response, under-capitalization, and technology disruption.
- For individual profiles, focus on core income volatility, skill obsolescence, capital losses, health/burnout, freelancer client concentration risk, and tax penalties.

You MUST follow the schema. Keep names exact. All financial units should match the currencySymbol provided: "${currencySymbol}".`;

      const numRisks = isDeepAnalysis ? 10 : 6;
      const prompt = `Perform region-wise risk modeling and financial impact simulation for a ${profileType} operating in "${domain}" based in "${region || 'Global'}" under the active geopolitical escalation scenario of "${geopoliticalScenario || 'General Geopolitical Fractures'}". Detail the direct and indirect impacts of these geographical and geopolitical elements on their operations (e.g. fuel prices, commercial LPG, energy costs, raw material imports, or agricultural inputs depending on the sector/domain). All financial impacts should use the "${currencySymbol}" currency symbol. Provide exactly ${numRisks} distinct and realistic risks (${isDeepAnalysis ? '3 high severity, 3 medium severity, 4 low severity' : '2 high severity, 2 medium severity, 2 low severity'}) and format the totals carefully.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique report identifier, prefixed with 'rep_' and 8 hex digits." },
          profileType: { type: Type.STRING },
          domain: { type: Type.STRING },
          scaleEstimate: { type: Type.STRING },
          region: { type: Type.STRING, description: "The resolved operating region for geopolitical transmission analysis." },
          geopoliticalScenario: { type: Type.STRING, description: "The active tracked geopolitical escalation scenario modeled." },
          isDeepAnalysis: { type: Type.BOOLEAN, description: "Whether this report utilized the premium personalized deep risk assessment algorithm." },
          risks: {
            type: Type.ARRAY,
            description: `List of exactly ${numRisks} risks, categorized by severity.`,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                level: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" },
                description: { type: Type.STRING, description: "2-3 precise analytical sentences describing current triggers, root causes, and business relevance." },
                timeframe: { type: Type.STRING, description: "Specific timeframe, e.g., '3-6 months' or 'Within 1 year'" },
                score: { type: Type.INTEGER, description: "Severity score value between 1 and 100. High severity should be 70-100, Medium 35-69, Low 10-34." },
                mitigationStrategy: { type: Type.STRING, description: "A detailed concrete operational step to inoculate the customer from this financial loss." },
                financialImpact: {
                  type: Type.OBJECT,
                  properties: {
                    minLoss: { type: Type.NUMBER, description: "Estimated minimal financial loss in selected currency." },
                    maxLoss: { type: Type.NUMBER, description: "Estimated maximal financial loss in selected currency." },
                    mitigationCost: { type: Type.NUMBER, description: "Cost to completely implement mitigation." },
                    roiMultiplier: { type: Type.NUMBER, description: "Direct financial return multiplier calculated as: (maxLoss - minLoss + 1) / (mitigationCost + 1) rounded to 1 decimal place." },
                    currencySymbol: { type: Type.STRING }
                  },
                  required: ["minLoss", "maxLoss", "mitigationCost", "roiMultiplier", "currencySymbol"]
                }
              },
              required: ["id", "title", "level", "description", "timeframe", "score", "mitigationStrategy", "financialImpact"]
            }
          },
          summary: { type: Type.STRING, description: "Executive summary explaining risk posture in 3-4 professional, concise sentences, followed by one core strategic imperative." },
          financialSummary: {
            type: Type.OBJECT,
            properties: {
              totalEstimatedLossMin: { type: Type.NUMBER, description: "Sum of minLoss across all risks." },
              totalEstimatedLossMax: { type: Type.NUMBER, description: "Sum of maxLoss across all risks." },
              totalMitigationCost: { type: Type.NUMBER, description: "Sum of mitigationCost across all risks." },
              overallHealthScore: { type: Type.NUMBER, description: "An aggregate metric between 1 and 100 representing overall risk resilience (Higher is better)." },
              currencySymbol: { type: Type.STRING }
            },
            required: ["totalEstimatedLossMin", "totalEstimatedLossMax", "totalMitigationCost", "overallHealthScore", "currencySymbol"]
          }
        },
        required: ["id", "profileType", "domain", "scaleEstimate", "risks", "summary", "financialSummary", "region", "geopoliticalScenario"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7,
        },
      });

      if (!response.text) {
        throw new Error("Unable to obtain content response from Gemini API.");
      }

      const reportData = JSON.parse(response.text.trim());
      reportData.isDeepAnalysis = !!isDeepAnalysis;
      res.json(reportData);

    } catch (error: any) {
      console.error("AI Risk Assessment Error:", error);
      res.status(500).json({ error: error.message || "Internal risk calculation server failure" });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RiskLens Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
