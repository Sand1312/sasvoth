import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const backendUrl = `${process.env.BACKEND_URL}/auth/validate`;

    const response = await fetch(backendUrl, {
      // Backend validate endpoint only supports GET.
      method: "GET",
      headers: {
        cookie: req.headers.cookie || "",
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return res.status(200).json({ message: "Authorized" });
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (err) {
    console.error("Error validating auth:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
