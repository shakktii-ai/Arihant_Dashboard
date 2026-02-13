import dbConnect from "../../../lib/db";
import Company from "../../../models/company";
import CompanyOnboarding from "../../../models/CompanyOnboarding";
import Payment from "../../../models/CompanyPayment";
import InterviewSession from "../../../models/InterviewSession";
import { verifyTokenFromReq } from "../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const user = verifyTokenFromReq(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    const enriched = await Promise.all(
      companies.map(async (company) => {

        // 🔹 OLD Credits (Onboarding)
        const onboarding = await CompanyOnboarding.findOne({
          companyId: company._id,
        });

        const onboardingCredits =
          onboarding?.creditsRemaining ?? 0;

        // 🔹 NEW Credits (Payment)
        const payment = await Payment.findOne({
          companyId: company._id,
        }).sort({ createdAt: -1 }); // latest payment

        const paymentCredits =
          payment?.creditsRemaining ?? 0;

        // 🔹 FINAL PRIORITY LOGIC
        let finalCredits = 0;

        if (paymentCredits > 0) {
          finalCredits = paymentCredits;
        } else {
          finalCredits = onboardingCredits;
        }

        // 🔹 Total interviews
        const totalInterviews = await InterviewSession.countDocuments({
          companyId: company._id,
        });

        return {
          _id: company._id,
          name: company.name,
          onboardingCompleted: company.onboardingCompleted,

          // return all for transparency
          onboardingCredits,
          paymentCredits,
          credits: finalCredits,

          totalInterviews,
          createdAt: company.createdAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      companies: enriched,
    });

  } catch (error) {
    console.error("Company fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
