import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import fss from "fs";
import csv from "csv-parser";
import fontkit from "@pdf-lib/fontkit";

async function loadCsv(): Promise<any[]> {
  const result: any[] = [];
  return new Promise<any[]>((res, rej) => {
    fss
      .createReadStream("jurizare.csv")
      .pipe(csv())
      .on("data", (row) => result.push(row))
      .on("error", rej)
      .on("end", () => res(result));
  });
}

async function addText(
  pdfVariants: { prize: Uint8Array; noPrize: Uint8Array },
  {
    prize,
    coordinator,
    grade,
    name,
    school,
    section,
  }: {
    prize?: string;
    section: string;
    name: string;
    grade: string;
    school: string;
    coordinator: string;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(
    prize ? pdfVariants.prize : pdfVariants.noPrize
  );
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await fs.readFile("Roboto-Bold.ttf"));
  const color = rgb(145 / 255, 45 / 255, 38 / 255);
  const page = doc.getPage(0);

  if (prize) {
    page.drawText(prize, {
      x: 500,
      y: 260,
      size: 40,
      font,
      color,
    });
  }
  page.drawText(section, {
    x: 395,
    y: 227,
    size: 20,
    font,
    color,
  });
  page.drawText(name, {
    // x: 250,
    x: 270,
    y: 190,
    size: 25,
    font,
    color,
  });
  page.drawText(grade, {
    x: 170,
    y: 153,
    size: 20,
    font,
    color,
  });
  page.drawText(school, {
    x: 295,
    y: 153,
    size: 20,
    font,
    color,
  });
  page.drawText(coordinator, {
    x: 270,
    y: 118,
    size: 20,
    font,
    color,
  });

  return await doc.save();
}

async function main() {
  const students = await loadCsv().then((all) =>
    all.map((item) => ({
      ...item,
      prize: item.prize === "Mentiune" ? undefined : item.prize,
    }))
  );

  const pdfVariants = {
    noPrize: await fs.readFile("in-pdf/mentiune.pdf"),
    prize: await fs.readFile("in-pdf/premiu.pdf"),
  };

  await Promise.all(
    students.map(async (student) => {
      const bytes = await addText(pdfVariants, student);
      const filename = student.name.trim().replace(/ /g, "_");
      await fs.writeFile(`out-pdf/${filename}.pdf`, bytes);
    })
  );
}

main();
