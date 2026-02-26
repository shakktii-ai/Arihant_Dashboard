import dbConnect from "../../../lib/db";
import Company from '../../../models/company';
import { verifyTokenFromReq } from "../../../lib/verifyToken";

export default async function handler(req, res) {
  await dbConnect();

  const user = verifyTokenFromReq(req);
  if (!user) return res.status(401).json({ success: false });

  const { name } = req.body;

  const company = await Company.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") }
  });

  if (!company) {
    return res.status(404).json({
      success: false,
      message: "Company not found"
    });
  }

  return res.status(200).json({
    success: true,
    companyId: company._id
  });
}
