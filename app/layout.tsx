import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 自助充值中心",
  description: "AI 服务卡密自助兑换、状态查询与批量查码"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
