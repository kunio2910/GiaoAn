"use client";

import { useMemo, useState, type DragEvent } from "react";

type View = "overview" | "plan" | "plan-form" | "objective-form";
type Status = "Đạt" | "Manh nha" | "Chưa đạt";
type NavKey = "overview" | "plan" | "other";

type Goal = {
  id: number;
  domain: string;
  icon: string;
  longTerm: string;
  shortTerm: string[];
  statuses: Status[];
};

const weeklyLabels = ["Tuần 1 - 2", "Tuần 3 - 4", "Tuần 5 - 6", "Tuần 7 - 8"];
const statusOptions: Status[] = ["Đạt", "Manh nha", "Chưa đạt"];

const initialGoals: Goal[] = [
  {
    id: 1,
    domain: "TƯƠNG TÁC XÃ HỘI",
    icon: "♣",
    longTerm: "Duy trì tương tác với giáo viên 5–10 phút",
    shortTerm: ["Ngồi tại bàn 2–3 phút.", "Ngồi học 5 phút.", "Duy trì hoạt động 10 phút (có đổi trò chơi)."],
    statuses: ["Manh nha", "Đạt", "Manh nha", "Chưa đạt"],
  },
  {
    id: 2,
    domain: "TƯƠNG TÁC XÃ HỘI",
    icon: "♣",
    longTerm: "Chơi qua lại với giáo viên",
    shortTerm: ["Lăn bóng qua lại 2 lượt.", "Lăn bóng 5 lượt.", "Chơi đưa – nhận đồ vật 5 lượt.", "Chơi trò chơi có luật (thả bóng, bỏ khối...)."],
    statuses: ["Manh nha", "Đạt", "Đạt", "Đạt"],
  },
  {
    id: 3,
    domain: "TƯƠNG TÁC XÃ HỘI",
    icon: "♣",
    longTerm: "Tăng giao tiếp bằng mắt",
    shortTerm: ["Nhìn mặt GV khi được gọi tên.", "Nhìn mặt GV khi nhận đồ.", "Nhìn mặt GV để yêu cầu tiếp tục trò chơi.", "Duy trì giao tiếp mắt 2–3 giây."],
    statuses: ["Manh nha", "Manh nha", "Đạt", "Đạt"],
  },
  {
    id: 4,
    domain: "TƯƠNG TÁC XÃ HỘI",
    icon: "♣",
    longTerm: "Đáp lại tương tác xã hội đơn giản",
    shortTerm: ["Đập tay (High-five).", "Bye bye khi kết thúc", "Bắt chước cử chỉ trong bài hát.", "Mỉm cười hoặc cười đáp lại khi chơi."],
    statuses: ["Manh nha", "Đạt", "Đạt", "Đạt"],
  },
  {
    id: 5,
    domain: "CHÚ Ý CHUNG",
    icon: "◉",
    longTerm: "Nhìn theo người lớn",
    shortTerm: ["Nhìn theo khi GV chỉ vào đồ vật gần.", "Nhìn theo khi GV chỉ vào đồ vật cách 1–2m.", "Nhìn theo khi GV tranh trong sách."],
    statuses: ["Manh nha", "Manh nha", "Đạt", "Đạt"],
  },
  {
    id: 6,
    domain: "CHÚ Ý CHUNG",
    icon: "◉",
    longTerm: "Luân phiên nhìn người – đồ vật",
    shortTerm: ["Nhìn đồ vật rồi nhìn mặt GV.", "Nhìn mặt GV rồi nhìn lại đồ vật.", "Luân phiên nhìn 2–3 lần trong cùng một hoạt động."],
    statuses: ["Chưa đạt", "Manh nha", "Đạt", "Đạt"],
  },
];

const navItems: { label: string; icon: string; key: NavKey; sub?: string }[] = [
  { label: "Tổng quan", icon: "⌂", key: "overview" },
  { label: "Kế hoạch giáo dục", icon: "▣", key: "plan" },
  { label: "Đánh giá", icon: "☑", key: "other" },
  { label: "Báo cáo", icon: "▥", key: "other" },
  { label: "Thư viện hoạt động", icon: "▤", key: "other" },
  { label: "Nhật ký", icon: "▧", key: "other" },
  { label: "Hồ sơ trẻ", icon: "♙", key: "other" },
  { label: "Cài đặt", icon: "⚙", key: "other" },
];

function Logo() {
  return (
    <div className="brand" aria-label="Kế hoạch giáo dục">
      <div className="brand-mark" aria-hidden="true">
        <i className="bubble b1" /><i className="bubble b2" /><i className="bubble b3" />
        <i className="bubble b4" /><i className="bubble b5" /><i className="bubble b6" />
        <i className="bubble b7" /><i className="bubble b8" /><i className="bubble b9" />
      </div>
      <span>KẾ HOẠCH<br />GIÁO DỤC</span>
    </div>
  );
}

function Sidebar({ active, onChange, onCreate }: { active: NavKey; onChange: (key: NavKey) => void; onCreate: () => void }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="side-nav" aria-label="Điều hướng chính">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${active === item.key && item.key !== "other" ? "active" : ""}`}
            onClick={() => onChange(item.key)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-art" aria-hidden="true">
        <span className="star star-a">✦</span><span className="star star-b">★</span><span className="star star-c">✦</span>
        <div className="toy-child">👧🏻</div>
        <div className="toy-blocks">▐▐▐</div>
        <div className="toy-bear">🧸</div>
      </div>
      <div className="profile-card">
        <div className="teacher-avatar">VK</div>
        <div><strong>Nguyễn Thị Vành Khuyên</strong><small>Người lập kế hoạch</small></div>
        <button className="logout" type="button"><span>⇥</span> Đăng xuất</button>
      </div>
      <button className="sidebar-create" onClick={onCreate} type="button">＋ Tạo kế hoạch mới</button>
    </aside>
  );
}

function Header({ title, breadcrumb, actionLabel, onAction, onBack, secondaryLabel, onSecondary }: { title: string; breadcrumb?: string[]; actionLabel?: string; onAction?: () => void; onBack?: () => void; secondaryLabel?: string; onSecondary?: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        {onBack && <button className="back-button" onClick={onBack} type="button" aria-label="Quay lại">←</button>}
        <div>
          <h1>{title}</h1>
          {breadcrumb && <div className="breadcrumb"><span>Kế hoạch giáo dục</span>{breadcrumb.map((crumb) => <span key={crumb}>› {crumb}</span>)}</div>}
        </div>
      </div>
      <div className="topbar-actions">
        <button className="icon-button notification" type="button" aria-label="Thông báo">♧<b>3</b></button>
        <div className="date-pill"><span>30/06/2026</span><span>▣</span></div>
        {secondaryLabel && <button className="button" onClick={onSecondary} type="button">{secondaryLabel}</button>}
        {actionLabel && <button className="button primary" onClick={onAction} type="button">{actionLabel}</button>}
      </div>
    </header>
  );
}

function Avatar({ large = false }: { large?: boolean }) {
  return <div className={`child-avatar ${large ? "large" : ""}`} aria-label="Ảnh của trẻ"><span>👧🏻</span></div>;
}

function SectionCard({ title, number, tone = "blue", children, className = "" }: { title: string; number?: string; tone?: string; children: React.ReactNode; className?: string }) {
  return <section className={`section-card ${tone} ${className}`}><div className="section-heading"><h2>{number && `${number}. `}{title}</h2></div><div className="section-body">{children}</div></section>;
}

function Field({ label, required, value, onChange, placeholder, icon, disabled = false, select = false }: { label: string; required?: boolean; value: string; onChange?: (value: string) => void; placeholder?: string; icon?: string; disabled?: boolean; select?: boolean }) {
  return <label className="field"><span>{label}{required && <em> *</em>}</span><div className={`field-control ${disabled ? "disabled" : ""} ${select ? "select-control" : ""}`}><input value={value} disabled={disabled} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} />{icon && <b>{icon}</b>}{select && <b>⌄</b>}</div></label>;
}

function TextAreaField({ label, required, value, onChange, placeholder, counter = "0/500", className = "" }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; placeholder?: string; counter?: string; className?: string }) {
  return <label className={`textarea-field ${className}`}><span>{label}{required && <em> *</em>}</span><div className="textarea-wrap"><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><small>{counter.includes("/") ? `${value.length}/${counter.split("/")[1]}` : counter}</small></div></label>;
}

function PlanForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState("Nguyễn Khánh Linh");
  const [birthday, setBirthday] = useState("07/07/2026");
  const [generalGoal, setGeneralGoal] = useState("");
  const [note, setNote] = useState("");
  return <>
    <Header title="Nhập thông tin kế hoạch giáo dục" breadcrumb={["Nhập thông tin"]} secondaryLabel="Hủy" onSecondary={onCancel} actionLabel="Lưu kế hoạch" onAction={onSaved} />
    <div className="form-layout">
      <div className="form-main">
        <SectionCard title="THÔNG TIN TRẺ" number="1">
          <div className="child-form-grid">
            <div className="child-fields">
              <Field label="Họ và tên trẻ" required value={name} onChange={setName} />
              <div className="two-fields"><Field label="Ngày sinh" required value={birthday} onChange={setBirthday} icon="▣" /><Field label="Tuổi thực" value="1 tuổi 11 tháng" disabled /></div>
            </div>
            <div className="photo-field"><span>Ảnh của trẻ</span><Avatar large /><button className="outline-button" type="button">↥ &nbsp; Thay đổi ảnh</button></div>
          </div>
        </SectionCard>

        <div className="mobile-only-stack">
          <SectionCard title="THÔNG TIN LƯỢNG GIÁ" number="2" tone="green"><div className="two-fields"><Field label="Ngày lượng giá" required value="30/07/2026" icon="▣" /><Field label="Đến ngày" required value="30/08/2026" icon="▣" /></div></SectionCard>
          <SectionCard title="GHI CHÚ CHUNG" number="3" tone="purple"><TextAreaField label="Ghi chú" value={note} onChange={setNote} placeholder="Nhập ghi chú chung (nếu có)..." /></SectionCard>
        </div>

        <SectionCard title="THÔNG TIN KẾ HOẠCH" number="4" tone="purple">
          <div className="three-fields"><Field label="Ngày lập kế hoạch" required value="30/06/2026" icon="▣" /><Field label="Người lập kế hoạch" required value="Nguyễn Thị Vành Khuyên" select /><Field label="Năm học / Giai đoạn" required value="07/2026 – 08/2026" select /></div>
          <TextAreaField label="Mục tiêu tổng quát của kế hoạch" value={generalGoal} onChange={setGeneralGoal} placeholder="Nhập mục tiêu tổng quát của kế hoạch giáo dục..." counter="0/1000" />
        </SectionCard>
        <SectionCard title="GHI CHÚ KHÁC" number="5" tone="purple"><TextAreaField label="Ghi chú khác" value={note} onChange={setNote} placeholder="Nhập ghi chú khác (nếu có)..." /></SectionCard>
      </div>
      <aside className="form-side">
        <SectionCard title="THÔNG TIN LƯỢNG GIÁ" number="2" tone="green"><div className="two-fields"><Field label="Ngày lượng giá" required value="30/07/2026" icon="▣" /><Field label="Đến ngày" required value="30/08/2026" icon="▣" /></div></SectionCard>
        <SectionCard title="GHI CHÚ CHUNG" number="3" tone="purple"><TextAreaField label="Ghi chú" value={note} onChange={setNote} placeholder="Nhập ghi chú chung (nếu có)..." /></SectionCard>
        <div className="guide-card"><h3>☼ &nbsp; Hướng dẫn</h3><ul><li>Các trường có dấu <strong>*</strong> là bắt buộc.</li><li>Vui lòng kiểm tra kỹ thông tin trước khi lưu.</li><li>Sau khi lưu, bạn có thể cập nhật mục tiêu chi tiết theo từng lĩnh vực.</li></ul><div className="guide-icon">▤</div></div>
      </aside>
    </div>
    <div className="required-note"><em>*</em> Thông tin bắt buộc phải nhập</div>
  </>;
}

function ObjectiveForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [longTerm, setLongTerm] = useState("Duy trì tương tác với giáo viên 5–10 phút");
  const [from, setFrom] = useState("01/07/2026");
  const [to, setTo] = useState("30/08/2026");
  const [shortGoals, setShortGoals] = useState(["Ngồi tại bàn 2–3 phút.", "Ngồi học 5 phút.", "Duy trì hoạt động 10 phút (có đổi trò chơi).", "Lăn bóng qua lại 2 lượt.", "Chơi trò chơi có luật (thả bóng, bỏ khối...)."]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const updateShort = (index: number, value: string) => setShortGoals((items) => items.map((item, i) => i === index ? value : item));
  const removeShort = (index: number) => setShortGoals((items) => items.filter((_, i) => i !== index));
  const addShort = () => { if (shortGoals.length < 20) setShortGoals((items) => [...items, ""]); };
  const onDrop = (event: DragEvent<HTMLDivElement>, targetIndex: number) => { event.preventDefault(); if (dragIndex === null || dragIndex === targetIndex) return; setShortGoals((items) => { const next = [...items]; const [moved] = next.splice(dragIndex, 1); next.splice(targetIndex, 0, moved); return next; }); setDragIndex(null); };
  return <>
    <Header title="Thêm mục tiêu phát triển" breadcrumb={["Mục tiêu phát triển", "Thêm mới"]} secondaryLabel="Hủy" onSecondary={onCancel} actionLabel="Lưu" onAction={onSaved} onBack={onCancel} />
    <div className="objective-layout">
      <div className="objective-main">
        <SectionCard title="LĨNH VỰC" number="1"><Field label="" required value="TƯƠNG TÁC XÃ HỘI" select /><small className="field-hint">Chọn lĩnh vực phát triển phù hợp với mục tiêu.</small></SectionCard>
        <SectionCard title="MỤC TIÊU DÀI HẠN" number="2"><div className="long-term-layout"><TextAreaField label="" value={longTerm} onChange={setLongTerm} placeholder="Nhập mục tiêu dài hạn cần đạt được trong giai đoạn kế hoạch (2 tháng)..." counter="0/500" /><div className="date-panel"><h3>THỜI GIAN ÁP DỤNG <em>*</em></h3><Field label="Từ ngày" value={from} onChange={setFrom} icon="▣" /><Field label="Đến ngày" value={to} onChange={setTo} icon="▣" /><small>Thời gian áp dụng mục tiêu dài hạn.</small></div></div><small className="field-hint">Ví dụ: Duy trì tương tác với giáo viên 5–10 phút.</small></SectionCard>
        <SectionCard title="MỤC TIÊU NGẮN HẠN" number="3"><p className="section-description">Nhập các mục tiêu ngắn hạn. Các mục tiêu này sẽ áp dụng cho tất cả các tuần.</p><div className="short-goal-list"><div className="list-head"><span>DANH SÁCH MỤC TIÊU NGẮN HẠN</span><span>ÁP DỤNG CHO TẤT CẢ CÁC TUẦN</span></div>{shortGoals.map((goal, index) => <div className="short-goal-row" key={`${index}-${goal}`} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, index)}><button className="drag-handle" type="button" aria-label="Kéo để sắp xếp">⁙</button><span className="row-number">{index + 1}.</span><input value={goal} onChange={(event) => updateShort(index, event.target.value)} aria-label={`Mục tiêu ngắn hạn ${index + 1}`} /><button className="delete-button" onClick={() => removeShort(index)} type="button" aria-label="Xóa mục tiêu">♜</button></div>)}<div className="list-footer"><button className="outline-button add-goal" onClick={addShort} type="button">＋ &nbsp; Thêm mục tiêu</button><span>{shortGoals.length}/20 mục tiêu</span></div></div></SectionCard>
        <div className="required-note"><em>*</em> Thông tin bắt buộc phải nhập</div>
      </div>
      <aside className="preview-card"><div className="preview-title">◉ &nbsp; XEM TRƯỚC</div><div className="preview-body"><span className="preview-label">Lĩnh vực</span><div className="domain-pill">♣ &nbsp; TƯƠNG TÁC XÃ HỘI</div><h3>Mục tiêu dài hạn</h3><p>{longTerm || "Chưa nhập mục tiêu"}</p><h3>Thời gian áp dụng</h3><p>{from} &nbsp;–&nbsp; {to}</p><h3>Mục tiêu ngắn hạn <small>(áp dụng cho tất cả các tuần)</small></h3><ol>{shortGoals.map((goal, index) => <li key={index}>{goal || "Mục tiêu mới"}</li>)}</ol><div className="preview-note">ⓘ &nbsp; Các mục tiêu ngắn hạn sẽ được áp dụng giống nhau cho tất cả các tuần.</div></div></aside>
    </div>
  </>;
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return <label className={`status-select ${value === "Đạt" ? "achieved" : value === "Manh nha" ? "emerging" : "not-achieved"}`}><span className="status-dot" /> <select value={value} onChange={(event) => onChange(event.target.value as Status)} aria-label="Trạng thái kết quả">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select><b>⌄</b></label>;
}

function GoalsTable({ goals, onStatusChange, compact = false }: { goals: Goal[]; onStatusChange: (id: number, week: number, status: Status) => void; compact?: boolean }) {
  const groupSizes = useMemo(() => goals.reduce<Record<string, number>>((acc, goal) => { acc[goal.domain] = (acc[goal.domain] || 0) + 1; return acc; }, {}), [goals]);
  return <div className={`table-scroll ${compact ? "compact" : ""}`}><table className="goals-table"><thead><tr><th rowSpan={2}>LĨNH VỰC</th><th rowSpan={2}>MỤC TIÊU<br />DÀI HẠN</th><th rowSpan={2}>MỤC TIÊU NGẮN HẠN</th><th colSpan={4}>KẾT QUẢ</th><th rowSpan={2}>GHI CHÚ</th></tr><tr>{weeklyLabels.map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{goals.map((goal, index) => { const isFirst = index === 0 || goals[index - 1].domain !== goal.domain; return <tr key={goal.id}>{isFirst && <td className="domain-cell" rowSpan={groupSizes[goal.domain]}><div className={`domain-icon ${goal.icon === "◉" ? "attention" : ""}`}>{goal.icon}</div><strong>{goal.domain.split(" ").map((part) => <span key={part}>{part} </span>)}</strong></td>}<td className="long-term-cell">{goal.longTerm}</td><td className="short-term-cell"><ul>{goal.shortTerm.map((item) => <li key={item}>{item}</li>)}</ul></td>{goal.statuses.map((status, week) => <td className="result-cell" key={`${goal.id}-${week}`}><StatusSelect value={status} onChange={(next) => onStatusChange(goal.id, week, next)} /></td>)}<td className="row-note"><button type="button" aria-label="Ghi chú dòng">▱</button></td></tr>})}</tbody></table></div>;
}

function ChildSummary() {
  return <section className="child-summary"><Avatar /><div className="summary-name"><strong>Nguyễn Khánh Linh</strong><span>▣ &nbsp; Ngày sinh: 07/07/2026</span><span>♙ &nbsp; Tuổi thực: 1 tuổi 11 tháng</span></div><div className="summary-meta"><span>♙ &nbsp; Người lập kế hoạch: Nguyễn Thị Vành Khuyên</span><span>▣ &nbsp; Ngày lập kế hoạch: 30/06/2026</span></div><div className="evaluation-summary"><strong>▣ &nbsp; Thông tin lượng giá</strong><span>▣ &nbsp; Ngày lượng giá:</span><b>30/07/2026 và 30/08/2026</b></div></section>;
}

function Legend() { return <div className="legend"><strong>Chú thích</strong><span><i className="green-dot" /> Đạt (Đ)</span><span><i className="yellow-dot" /> Manh nha (MN)</span><span><i className="gray-dot" /> Chưa đạt (CĐ)</span></div>; }

function PlanView({ goals, onStatusChange, onObjective, onExport, onCreate }: { goals: Goal[]; onStatusChange: (id: number, week: number, status: Status) => void; onObjective: () => void; onExport: () => void; onCreate: () => void }) {
  return <>
    <Header title="Kế hoạch giáo dục" actionLabel="▣  Xuất PDF" onAction={onExport} />
    <ChildSummary />
    <div className="section-title-row"><h2>▣ &nbsp; MỤC TIÊU PHÁT TRIỂN</h2><div className="mini-legend"><span><i className="green-dot" /> Đạt (Đ)</span><span><i className="yellow-dot" /> Manh nha (MN)</span><span><i className="gray-dot" /> Chưa đạt (CĐ)</span></div></div>
    <GoalsTable goals={goals} onStatusChange={onStatusChange} />
  </>;
}

function OverviewView({ goals, onStatusChange, onObjective, onExport, onCreate, note, setNote }: { goals: Goal[]; onStatusChange: (id: number, week: number, status: Status) => void; onObjective: () => void; onExport: () => void; onCreate: () => void; note: string; setNote: (value: string) => void }) {
  return <>
    <Header title="Kế hoạch giáo dục cá nhân" actionLabel="▣  Xuất PDF" onAction={onExport} />
    <ChildSummary />
    <div className="overview-layout"><div className="overview-main"><h2 className="section-title">MỤC TIÊU PHÁT TRIỂN</h2><GoalsTable goals={goals} onStatusChange={onStatusChange} compact /></div><aside className="overview-side"><Legend /><div className="quick-actions"><strong>Thao tác nhanh</strong><button onClick={onObjective} type="button">＋ &nbsp; Thêm mục tiêu</button><button type="button">♧ &nbsp; Thêm hoạt động gợi ý</button><button type="button">↥ &nbsp; Nhập kết quả hàng loạt</button><button onClick={onExport} type="button">▣ &nbsp; In kế hoạch</button></div><div className="general-note"><strong>Ghi chú chung</strong><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhập ghi chú chung..." /><small>{note.length}/500</small><button type="button">Lưu ghi chú</button></div></aside></div>
  </>;
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [goals, setGoals] = useState(initialGoals);
  const [note, setNote] = useState("");
  const navigate = (next: View) => setView(next);
  const updateStatus = (id: number, week: number, status: Status) => setGoals((items) => items.map((goal) => goal.id === id ? { ...goal, statuses: goal.statuses.map((current, index) => index === week ? status : current) } : goal));
  const onNav = (key: NavKey) => { setActiveNav(key); if (key === "plan") navigate("plan"); else if (key === "overview") navigate("overview"); };
  const exportPlan = () => window.print();
  return <div className="app-shell"><Sidebar active={activeNav} onChange={onNav} onCreate={() => navigate("plan-form")} /><main className="main-content">{view === "overview" && <OverviewView goals={goals} onStatusChange={updateStatus} onObjective={() => navigate("objective-form")} onExport={exportPlan} onCreate={() => navigate("plan-form")} note={note} setNote={setNote} />}{view === "plan" && <PlanView goals={goals} onStatusChange={updateStatus} onObjective={() => navigate("objective-form")} onExport={exportPlan} onCreate={() => navigate("plan-form")} />}{view === "plan-form" && <PlanForm onCancel={() => navigate("overview")} onSaved={() => navigate("plan")} />}{view === "objective-form" && <ObjectiveForm onCancel={() => navigate("plan")} onSaved={() => navigate("plan")} />}</main></div>;
}
