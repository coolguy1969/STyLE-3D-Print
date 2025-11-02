import formidable from "formidable";
import fs from "fs";
import { parseSTL } from "stl-utils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({});
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    try {
      const material = fields.material[0];
      const file = files.stlFile[0];
      const buffer = fs.readFileSync(file.filepath);

      // Parse STL file
      const geometry = await parseSTL(buffer);
      const volumeCm3 = geometry.volume / 1000; // mm³ → cm³

      // Filament density (PLA: 1.24 g/cm³, TPU: 1.21 g/cm³)
      const density = material === "tpu" ? 1.21 : 1.24;
      const grams = volumeCm3 * density;

      // Cost calculations
      const pricePerKg = material === "tpu" ? 37 : 28;
      const baseCost = (grams / 1000) * pricePerKg;
      const finalCost = baseCost * 1.3; // 30% markup

      res.status(200).json({
        volumeCm3,
        grams,
        baseCost,
        finalCost,
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to process STL file" });
    }
  });
}
