import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const margin = 10;

  const usableWidth =
    pageWidth - margin * 2;

  const usableHeight =
    pageHeight - margin * 2;

  const imageWidth = usableWidth;

  const imageHeight =
    (canvas.height * imageWidth) /
    canvas.width;

  let remainingHeight = imageHeight;
  let position = margin;

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    margin,
    position,
    imageWidth,
    imageHeight
  );

  remainingHeight -= usableHeight;

  while (remainingHeight > 0) {
    position =
      margin -
      (imageHeight - remainingHeight);

    pdf.addPage();

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      position,
      imageWidth,
      imageHeight
    );

    remainingHeight -= usableHeight;
  }

  pdf.save(filename);
}
