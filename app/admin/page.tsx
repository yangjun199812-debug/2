"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, KeyRound, Plus, Trash2, Upload } from "lucide-react";

type CardStatus = "unused" | "used" | "disabled";

type CardRecord = {
  id: string;
  code: string;
  product: string;
  status: CardStatus;
  account?: string;
  createdAt: string;
  usedAt?: string;
};

const STORAGE_KEY = "cdk_cards";

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function createCode(prefix: string) {
  const body = crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase();
  return `${prefix}-${body.slice(0, 5)}-${body.slice(5, 10)}-${body.slice(10, 15)}-${body.slice(15, 20)}`;
}

function readCards(): CardRecord[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeCards(cards: CardRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export default function AdminPage() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [prefix, setPrefix] = useState("xiaojiu");
  const [product, setProduct] = useState("ChatGPT Plus");
  const [count, setCount] = useState(10);
  const [importText, setImportText] = useState("");
  const [filter, setFilter] = useState<"all" | CardStatus>("all");

  useEffect(() => {
    setCards(readCards());
  }, []);

  const stats = useMemo(() => {
    return {
      total: cards.length,
      unused: cards.filter((item) => item.status === "unused").length,
      used: cards.filter((item) => item.status === "used").length,
      disabled: cards.filter((item) => item.status === "disabled").length
    };
  }, [cards]);

  const visibleCards = useMemo(() => {
    if (filter === "all") return cards;
    return cards.filter((item) => item.status === filter);
  }, [cards, filter]);

  function save(nextCards: CardRecord[]) {
    setCards(nextCards);
    writeCards(nextCards);
  }

  function generateCards() {
    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 500);
    const created = Array.from({ length: safeCount }, () => ({
      id: crypto.randomUUID(),
      code: createCode(prefix.trim() || "xiaojiu"),
      product,
      status: "unused" as const,
      createdAt: nowText()
    }));
    save([...created, ...cards]);
  }

  function importCards() {
    const rows = importText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const existing = new Set(cards.map((item) => item.code.toLowerCase()));
    const imported = rows
      .filter((code) => !existing.has(code.toLowerCase()))
      .map((code) => ({
        id: crypto.randomUUID(),
        code,
        product,
        status: "unused" as const,
        createdAt: nowText()
      }));
    save([...imported, ...cards]);
    setImportText("");
  }

  function updateStatus(id: string, status: CardStatus) {
    save(cards.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function removeCard(id: string) {
    save(cards.filter((item) => item.id !== id));
  }

  function exportCards() {
    const text = cards.map((item) => item.code).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cdk-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearUsed() {
    save(cards.filter((item) => item.status !== "used"));
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p>CDK Admin</p>
            <h1>卡密后台</h1>
          </div>
          <a href="/">返回兑换页</a>
        </header>

        <section className="admin-stats">
          <Stat label="总卡密" value={stats.total} />
          <Stat label="未使用" value={stats.unused} />
          <Stat label="已兑换" value={stats.used} />
          <Stat label="已禁用" value={stats.disabled} />
        </section>

        <section className="admin-grid">
          <div className="admin-card">
            <h2>
              <Plus size={18} /> 生成卡密
            </h2>
            <label>
              前缀
              <input value={prefix} onChange={(event) => setPrefix(event.target.value)} />
            </label>
            <label>
              产品
              <input value={product} onChange={(event) => setProduct(event.target.value)} />
            </label>
            <label>
              数量
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              />
            </label>
            <button className="primary" type="button" onClick={generateCards}>
              生成
            </button>
          </div>

          <div className="admin-card">
            <h2>
              <Upload size={18} /> 导入卡密
            </h2>
            <p>一行一个 CDK，重复卡密会自动跳过。</p>
            <textarea
              rows={8}
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder={"xiaojiu-AAAAA-BBBBB-CCCCC-DDDDD\nxiaojiu-11111-22222-33333-44444"}
            />
            <button className="primary" type="button" onClick={importCards}>
              导入
            </button>
          </div>
        </section>

        <section className="admin-card table-card">
          <div className="table-head">
            <h2>
              <KeyRound size={18} /> 卡密列表
            </h2>
            <div className="table-actions">
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
                <option value="all">全部</option>
                <option value="unused">未使用</option>
                <option value="used">已兑换</option>
                <option value="disabled">已禁用</option>
              </select>
              <button type="button" onClick={exportCards}>
                <Download size={15} /> 导出
              </button>
              <button type="button" onClick={clearUsed}>
                清理已兑换
              </button>
            </div>
          </div>

          <div className="card-table">
            {visibleCards.length === 0 ? (
              <div className="empty">暂无卡密，先生成或导入。</div>
            ) : (
              visibleCards.map((item) => (
                <article key={item.id} className="card-row">
                  <div>
                    <strong>{item.code}</strong>
                    <span>{item.product} · {item.createdAt}</span>
                    {item.account && <span>兑换账号：{item.account}</span>}
                  </div>
                  <div className="row-actions">
                    <select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as CardStatus)}>
                      <option value="unused">未使用</option>
                      <option value="used">已兑换</option>
                      <option value="disabled">已禁用</option>
                    </select>
                    <button type="button" onClick={() => removeCard(item.id)} aria-label="删除卡密">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
