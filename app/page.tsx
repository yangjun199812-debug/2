"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";

type RedeemState = "idle" | "loading" | "success" | "error";
type Mode = "redeem" | "status";
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
const languages = ["中", "EN", "VI", "RU", "TR"];

const faqItems = [
  {
    title: "卡密多久完成？",
    body: "自动卡密通常即时到账；人工代付类订单会进入处理队列，一般数分钟到数小时内完成。"
  },
  {
    title: "卡密失败怎么办？",
    body: "如果处理失败，卡密会恢复为可用状态或进入退款流程。你可以通过状态查询随时查看结果。"
  },
  {
    title: "为什么不用登录？",
    body: "本页面只校验卡密本身，不要求用户注册登录。卡密就是充值凭证，请妥善保存。"
  },
  {
    title: "安全说明",
    body: "请勿把卡密发给他人。页面不会索要账号密码，人工代付也只需要按业务要求提交必要信息。"
  }
];

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function readCards(): CardRecord[] {
  if (typeof window === "undefined") return [];
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

function queryCard(code: string, index = 0) {
  const cards = readCards();
  const hit = cards.find((item) => item.code.toLowerCase() === code.toLowerCase());
  if (hit) {
    return {
      code: hit.code,
      account: hit.account || "-",
      status: hit.status === "used" ? "充值成功" : hit.status === "disabled" ? "已禁用" : "未使用",
      createdAt: hit.createdAt,
      finishedAt: hit.usedAt || "-"
    };
  }

  const states = ["未找到", "等待验证", "处理中"];
  const status = states[(code.length + index) % states.length];
  return {
    code,
    account: "-",
    status,
    createdAt: "-",
    finishedAt: "-"
  };
}

export default function Page() {
  const [language, setLanguage] = useState("中");
  const [mode, setMode] = useState<Mode>("redeem");
  const [cardKey, setCardKey] = useState("");
  const [redeemState, setRedeemState] = useState<RedeemState>("idle");
  const [redeemMessage, setRedeemMessage] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [statusResult, setStatusResult] = useState<ReturnType<typeof queryCard> | null>(null);
  const [showBatch, setShowBatch] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchResults, setBatchResults] = useState<ReturnType<typeof queryCard>[]>([]);

  const badgeText = useMemo(() => {
    if (redeemState === "success") return "已提交";
    if (redeemState === "error") return "未通过";
    if (redeemState === "loading") return "验证中";
    return "待验证";
  }, [redeemState]);

  function redeem() {
    const code = cardKey.trim();
    if (!code) {
      setRedeemState("error");
      setRedeemMessage("请输入卡密后再兑换。");
      return;
    }

    setRedeemState("loading");
    setRedeemMessage("正在提交兑换请求...");

    window.setTimeout(() => {
      const cards = readCards();
      const index = cards.findIndex((item) => item.code.toLowerCase() === code.toLowerCase());

      if (index < 0) {
        setRedeemState("error");
        setRedeemMessage("卡密不存在，请先在后台生成或导入。");
        return;
      }

      const card = cards[index];
      if (card.status === "used") {
        setRedeemState("error");
        setRedeemMessage("这张卡密已经兑换过了。");
        return;
      }

      if (card.status === "disabled") {
        setRedeemState("error");
        setRedeemMessage("这张卡密已被后台禁用。");
        return;
      }

      cards[index] = {
        ...card,
        status: "used",
        account: "self-service@example.com",
        usedAt: nowText()
      };
      writeCards(cards);
      setRedeemState("success");
      setRedeemMessage("卡密已提交，系统正在安排充值。");
    }, 650);
  }

  function queryStatus() {
    if (!statusCode.trim()) return;
    setStatusResult(queryCard(statusCode.trim()));
  }

  function queryBatch() {
    const rows = batchText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    setBatchResults(rows.map((row, index) => queryCard(row, index)));
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <h1>AI 自助充值中心</h1>
          <div className="language" aria-label="语言切换">
            {languages.map((item) => (
              <button
                key={item}
                type="button"
                className={language === item ? "active" : ""}
                onClick={() => setLanguage(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <a className="admin-entry" href="/admin">
            后台
          </a>
        </header>

        <section className="hero">
          <div className="hero-icon">
            <Sparkles size={22} />
          </div>
          <h2>AI 服务 · 卡密秒充</h2>
          <p>ChatGPT / Claude / SuperGrok 官方渠道充值，输入卡密即可完成，全程自助。</p>
          <div className="chips">
            <span>官方渠道</span>
            <span>极速到账</span>
            <span>失败可退</span>
          </div>
        </section>

        <section className="card redeem-card">
          <div className="card-head">
            <div>
              <p>按步骤完成充值</p>
              <h3>{mode === "redeem" ? "卡密兑换" : "充值状态查询"}</h3>
            </div>
            <span className={`status-badge ${redeemState}`}>{badgeText}</span>
          </div>

          {mode === "redeem" ? (
            <>
              <div className="notice">
                人工代付 ChatGPT Plus：提交后由管理员在浏览器内为你的账号完成官方新购，无需账号密码，处理失败可退。
              </div>
              <label className="field">
                <span>
                  <b>1</b> 输入 Plus 代付卡密
                </span>
                <input
                  value={cardKey}
                  onChange={(event) => setCardKey(event.target.value)}
                  placeholder="请输入 xiaojiu 开头的 Plus 代付卡密"
                  autoComplete="off"
                />
              </label>
              <button className="primary" type="button" onClick={redeem} disabled={redeemState === "loading"}>
                {redeemState === "loading" ? "提交中..." : "兑换卡密"}
              </button>
              <button className="secondary" type="button" onClick={() => setMode("status")}>
                查充值状态
              </button>
              {redeemMessage && (
                <div className={`result ${redeemState}`}>
                  {redeemState === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{redeemMessage}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="field">
                <span>
                  <b>1</b> 输入要查询的卡密
                </span>
                <input
                  value={statusCode}
                  onChange={(event) => setStatusCode(event.target.value)}
                  placeholder="请输入卡密查询充值状态"
                  autoComplete="off"
                />
              </label>
              <button className="primary" type="button" onClick={queryStatus}>
                <Search size={17} /> 查询状态
              </button>
              <button className="secondary" type="button" onClick={() => setMode("redeem")}>
                返回兑换
              </button>
              {statusResult && <StatusCard item={statusResult} />}
            </>
          )}
        </section>

        <section className="link-panel">
          <button type="button" onClick={() => setShowBatch((value) => !value)}>
            <ChevronDown className={showBatch ? "open" : ""} size={15} />
            批量查询卡密状态（充到哪个账号 / 成功失败）
          </button>
          {showBatch && (
            <div className="card inner-card">
              <h4>批量查询卡密状态</h4>
              <p>一行输入一个卡密，支持一次查询多个。</p>
              <textarea
                rows={5}
                value={batchText}
                onChange={(event) => setBatchText(event.target.value)}
                placeholder={"xiaojiu-xxxx-1\nxiaojiu-xxxx-2\nxiaojiu-xxxx-3"}
              />
              <button className="primary" type="button" onClick={queryBatch}>
                批量查询
              </button>
              <div className="batch-list">
                {batchResults.map((item) => (
                  <StatusCard key={item.code} item={item} compact />
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={() => setShowFaq((value) => !value)}>
            <ChevronDown className={showFaq ? "open" : ""} size={15} />
            常见问题 / 安全说明
          </button>
          {showFaq && (
            <div className="card inner-card">
              <h4>常见问题 / 安全说明</h4>
              <div className="faq-list">
                {faqItems.map((item) => (
                  <details key={item.title} open>
                    <summary>{item.title}</summary>
                    <p>{item.body}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>

        <footer>
          <p>© 2026 AI 自助充值中心</p>
          <p>卡密即凭证 · 请勿泄露给他人 · 处理失败可退</p>
        </footer>
      </div>
    </main>
  );
}

function StatusCard({
  item,
  compact = false
}: {
  item: ReturnType<typeof queryCard>;
  compact?: boolean;
}) {
  return (
    <div className={`status-card ${compact ? "compact" : ""}`}>
      <div className="status-title">
        <Clock3 size={16} />
        <strong>{item.status}</strong>
      </div>
      <dl>
        <div>
          <dt>卡密</dt>
          <dd>{item.code}</dd>
        </div>
        <div>
          <dt>充值账号</dt>
          <dd>{item.account}</dd>
        </div>
        <div>
          <dt>提交时间</dt>
          <dd>{item.createdAt}</dd>
        </div>
        <div>
          <dt>完成时间</dt>
          <dd>{item.finishedAt}</dd>
        </div>
      </dl>
      <div className="safe-line">
        <ShieldCheck size={14} />
        官方渠道状态回执
      </div>
    </div>
  );
}
