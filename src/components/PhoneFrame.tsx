import Image from "next/image";

// Bezel: apple-iphone-15-pro-max-black-titanium-portrait.png (1530×3036)
// Screen hole constants derived from the existing app-store-screenshots tool.
const SC_L = (120 / 1530) * 100; // 7.843%
const SC_T = (120 / 3036) * 100; // 3.953%
const SC_W = (1290 / 1530) * 100; // 84.314%
const SC_H = (2796 / 3036) * 100; // 92.095%
const SC_RX = (165 / 1290) * 100; // 12.791% horizontal border-radius
const SC_RY = (165 / 2796) * 100; // 5.901% vertical border-radius

interface PhoneFrameProps {
  src: string;
  alt: string;
  width: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function PhoneFrame({ src, alt, width, className, style }: PhoneFrameProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        aspectRatio: "1530 / 3036",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${SC_L}%`,
          top: `${SC_T}%`,
          width: `${SC_W}%`,
          height: `${SC_H}%`,
          borderRadius: `${SC_RX}% / ${SC_RY}%`,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      <Image
        src="/iphone-bezel.png"
        alt=""
        fill
        style={{ zIndex: 2, pointerEvents: "none" }}
        sizes={`${width}px`}
      />
    </div>
  );
}
