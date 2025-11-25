import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  data: string;
  title?: string;
  description?: string;
}

export const QRCodeDisplay = ({ data, title, description }: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(
        canvasRef.current,
        data,
        {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }
  }, [data]);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{title || "Your QR Code"}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas ref={canvasRef} className="rounded-lg border-2 border-border" />
      </CardContent>
    </Card>
  );
};
