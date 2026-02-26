// //pages/api/superAdmin/company/[companyId].js
// import dbConnect from "../../../../lib/db";
// import Company from '../../../../models/company';
// import CompanyOnboarding from "../../../../models/CompanyOnboarding";
// import InterviewSession from "../../../../models/InterviewSession";
// import { verifyTokenFromReq } from "../../../../lib/verifyToken";

// export default async function handler(req, res) {
//   await dbConnect();

//   const user = verifyTokenFromReq(req);
//   if (!user) {
//     return res.status(401).json({ success: false, message: "Unauthorized" });
//   }

//   const { companyId } = req.query;

//   try {
//     const company = await Company.findById(companyId);
//     const onboarding = await CompanyOnboarding.findOne({ companyId });
//     const interviews = await InterviewSession.find({ companyId });

//     return res.status(200).json({
//       success: true,
//       company,
//       onboarding,
//       totalInterviews: interviews.length,
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// }


 //pages/api/superAdmin/company/[companyId].js
import dbConnect from "../../../../lib/db";
import CompanyOnboarding from "../../../../models/CompanyOnboarding";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const user = verifyTokenFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false });
  }

  const { companyId } = req.query;

  try {
    const onboarding = await CompanyOnboarding.findOne({ companyId });

    if (!onboarding) {
      return res.status(404).json({ success: false });
    }

    return res.status(200).json({
      success: true,
      onboarding,
    });
  } catch {
    return res.status(500).json({ success: false });
  }
}
