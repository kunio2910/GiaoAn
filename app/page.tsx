"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadCloudData, saveCloudData, type CloudData } from "./google-sheet-connection";

type View = "overview" | "plan" | "children" | "settings" | "objective-form";
type Status = "Đạt" | "Manh nha" | "Chưa đạt";

type Child = {
  id: number;
  name: string;
  birthday: string;
  gender: string;
  note: string;
};

type Goal = {
  id: number;
  childId: number;
  domain: string;
  longTerm: string;
  shortTerm: string[];
  from: string;
  to: string;
  statuses: Status[];
};

type AppCloudData = CloudData & {
  children?: Child[];
  goals?: Goal[];
};

const WEEK_LABELS = ["Tuần 1 - 2", "Tuần 3 - 4", "Tuần 5 - 6", "Tuần 7 - 8"];
const STATUS_OPTIONS: Status[] = ["Đạt", "Manh nha", "Chưa đạt"];
const DOMAIN_OPTIONS = ["Tương tác xã hội", "Chú ý chung", "Giao tiếp", "Kỹ năng tự phục vụ"];

const initialChildren: Child[] = [
  { id: 1, name: "Nguyễn Khánh Linh", birthday: "07/07/2021", gender: "Nữ", note: "Thích hoạt động có âm nhạc." },
  { id: 2, name: "Trần Minh Anh", birthday: "18/03/2021", gender: "Nam", note: "Cần nhắc nhẹ khi chuyển hoạt động." },
];

const initialGoals: Goal[] = [
  {
    id: 1,
    childId: 1,
    domain: "Tương tác xã hội",
    longTerm: "Duy trì tương tác với giáo viên 5–10 phút",
    shortTerm: ["Ngồi tại bàn 2–3 phút.", "Ngồi học 5 phút.", "Duy trì hoạt động 10 phút."],
    from: "01/07/2026",
    to: "30/08/2026",
    statuses: ["Manh nha", "Đạt", "Manh nha", "Chưa đạt"],
  },
  {
    id: 2,
    childId: 1,
    domain: "Giao tiếp",
    longTerm: "Tăng giao tiếp bằng mắt khi được gọi tên",
    shortTerm: ["Nhìn mặt giáo viên khi được gọi tên.", "Duy trì giao tiếp mắt 2–3 giây."],
    from: "01/07/2026",
    to: "30/08/2026",
    statuses: ["Manh nha", "Manh nha", "Đạt", "Đạt"],
  },
  {
    id: 3,
    childId: 2,
    domain: "Chú ý chung",
    longTerm: "Nhìn theo người lớn và đồ vật được chỉ dẫn",
    shortTerm: ["Nhìn theo khi cô chỉ vào đồ vật gần.", "Luân phiên nhìn người và đồ vật 2–3 lần."],
    from: "01/07/2026",
    to: "30/08/2026",
    statuses: ["Chưa đạt", "Manh nha", "Đạt", "Đạt"],
  },
];

function Icon({ name, size = 20 }: { name: "overview" | "plan" | "children" | "settings" | "target" | "note" | "chevron" | "plus" | "edit" | "trash" | "calendar" | "user" | "save" | "back" | "file" | "moon" | "sun"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<string, React.ReactNode> = {
    overview: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    plan: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
    children: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><circle cx="17.5" cy="10" r="2.2" /><path d="M15.5 16.8a4.2 4.2 0 0 1 5 3.2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2H15v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V14h-.2a1.7 1.7 0 0 0-1.6 1z" /></>,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="m16.5 7.5 3-3M19.5 4.5v3h-3" /></>,
    note: <><path d="M4.5 5h15v11H10l-4.5 4V5z" /><path d="M8 9h8M8 12h5" /></>,
    chevron: <path d="m7 9 5 5 5-5" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    edit: <><path d="M4 16.5V20h3.5L18.8 8.7a2.1 2.1 0 0 0-3-3z" /><path d="m14.5 7.5 2 2" /></>,
    trash: <><path d="M4 7h16M10 11v5M14 11v5" /><path d="M6.5 7 7.3 20h9.4L17.5 7M9 7V4h6v3" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7 3v4M17 3v4M3.5 9h17" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    save: <><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v5h8V4M8 20v-6h8v6" /></>,
    back: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
    file: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v5h4M9 13h6M9 16h6" /></>,
    moon: <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2z" />,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Logo() {
  return <div className="brand"><div className="brand-mark" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} className={`bubble b${index + 1}`} />)}</div><span>KẾ HOẠCH<br />GIÁO DỤC</span></div>;
}

const navItems: { label: string; icon: "overview" | "plan" | "children" | "settings" | "target"; view: View }[] = [
  { label: "Tổng quan", icon: "overview", view: "overview" },
  { label: "Kế hoạch giáo dục", icon: "plan", view: "plan" },
  { label: "Thêm mục tiêu", icon: "target", view: "objective-form" },
  { label: "Hồ sơ trẻ", icon: "children", view: "children" },
  { label: "Cài đặt", icon: "settings", view: "settings" },
];

function Sidebar({ active, onChange, darkMode, onToggleTheme }: { active: View; onChange: (view: View) => void; darkMode: boolean; onToggleTheme: () => void }) {
  return <aside className="sidebar"><Logo /><nav className="side-nav" aria-label="Điều hướng chính">{navItems.map((item) => <button key={item.view} type="button" className={`nav-item ${active === item.view ? "active" : ""}`} onClick={() => onChange(item.view)}><span className="nav-icon"><Icon name={item.icon} size={19} /></span><span>{item.label}</span></button>)}</nav><button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}><Icon name={darkMode ? "sun" : "moon"} size={18} /><span>{darkMode ? "Giao diện sáng" : "Giao diện tối"}</span></button><div className="sidebar-art" aria-hidden="true" /><div className="profile-card"><div className="teacher-avatar">VK</div><div><strong>Nguyễn Thị Vành Khuyên</strong><small>Người lập kế hoạch</small></div><button className="logout" type="button">Đăng xuất</button></div></aside>;
}

function Header({ title, subtitle, actionLabel, actionIcon = "plus", onAction, onBack }: { title: string; subtitle?: string; actionLabel?: string; actionIcon?: "plus" | "file"; onAction?: () => void; onBack?: () => void }) {
  return <header className="topbar"><div className="topbar-title">{onBack && <button className="back-button" type="button" onClick={onBack} aria-label="Quay lại"><Icon name="back" size={24} /></button>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div><div className="topbar-actions"><div className="date-pill"><span>30/06/2026</span><Icon name="calendar" size={17} /></div>{actionLabel && <button className="button primary" type="button" onClick={onAction}><Icon name={actionIcon} size={17} />{actionLabel}</button>}</div></header>;
}

function SelectField({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) {
  return <label className="field"><span>{label}{required && <em>*</em>}</span><div className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><Icon name="chevron" size={18} /></div></label>;
}

function InputField({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <label className="field"><span>{label}{required && <em>*</em>}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ChildAvatar({ name, large = false }: { name: string; large?: boolean }) {
  return <div className={`child-avatar ${large ? "large" : ""}`} aria-label={`Ảnh của ${name}`}><span>{name.split(" ").map((part) => part[0]).slice(-2).join("")}</span></div>;
}

function ChildSummary({ child }: { child: Child }) {
  return <section className="child-summary"><ChildAvatar name={child.name} /><div className="summary-name"><strong>{child.name}</strong><span><Icon name="calendar" size={16} /> Ngày sinh: {child.birthday}</span><span><Icon name="user" size={16} /> Tuổi thực: 1 tuổi 11 tháng</span></div><div className="summary-meta"><span><Icon name="user" size={16} /> Người lập kế hoạch: Nguyễn Thị Vành Khuyên</span><span><Icon name="calendar" size={16} /> Ngày lập kế hoạch: 30/06/2026</span></div><div className="evaluation-summary"><strong><Icon name="calendar" size={16} /> Thông tin lượng giá</strong><span>Ngày lượng giá:</span><b>30/07/2026 và 30/08/2026</b></div></section>;
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return <label className={`status-select ${value === "Đạt" ? "achieved" : value === "Manh nha" ? "emerging" : "not-achieved"}`}><span className="status-dot" /><select value={value} onChange={(event) => onChange(event.target.value as Status)} aria-label="Trạng thái kết quả">{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select><Icon name="chevron" size={15} /></label>;
}

function GoalsTable({ goals, onStatusChange }: { goals: Goal[]; onStatusChange: (id: number, week: number, status: Status) => void }) {
  if (!goals.length) return <div className="empty-state"><Icon name="target" size={34} /><h3>Chưa có mục tiêu phát triển</h3><p>Hãy thêm mục tiêu riêng cho trẻ để bắt đầu theo dõi.</p></div>;
  return <div className="table-scroll"><table className="goals-table"><thead><tr><th>LĨNH VỰC</th><th>MỤC TIÊU<br />DÀI HẠN</th><th>MỤC TIÊU NGẮN HẠN</th>{WEEK_LABELS.map((label) => <th key={label}>{label}</th>)}<th>GHI CHÚ</th></tr></thead><tbody>{goals.map((goal) => <tr key={goal.id}><td><span className="domain-badge"><Icon name="target" size={16} />{goal.domain.toUpperCase()}</span></td><td className="long-term-cell">{goal.longTerm}</td><td className="short-term-cell"><ul>{goal.shortTerm.map((item, index) => <li key={`${goal.id}-${index}`}>{item}</li>)}</ul></td>{goal.statuses.map((status, week) => <td className="result-cell" key={`${goal.id}-${week}`}><StatusSelect value={status} onChange={(next) => onStatusChange(goal.id, week, next)} /></td>)}<td className="row-note"><button type="button" aria-label="Ghi chú mục tiêu"><Icon name="note" size={21} /></button></td></tr>)}</tbody></table></div>;
}

function PlanView({ childList, selectedChildId, onSelectChild, goals, onStatusChange }: { childList: Child[]; selectedChildId: number; onSelectChild: (id: number) => void; goals: Goal[]; onStatusChange: (id: number, week: number, status: Status) => void }) {
  const child = childList.find((item) => item.id === selectedChildId) ?? childList[0];
  const childGoals = goals.filter((goal) => goal.childId === child?.id);
  if (!child) return <div className="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p></div>;
  return <><Header title="Kế hoạch giáo dục" actionLabel="Xuất PDF" actionIcon="file" onAction={() => window.print()} /><div className="plan-toolbar"><SelectField label="Đang xem hồ sơ của" value={child.name} onChange={(name) => { const next = childList.find((item) => item.name === name); if (next) onSelectChild(next.id); }} options={childList.map((item) => item.name)} /><div className="plan-count"><span className="count-number">{childGoals.length}</span><span>mục tiêu đang theo dõi</span></div></div><ChildSummary child={child} /><div className="section-title-row"><div><h2><Icon name="calendar" size={21} /> Mục tiêu phát triển</h2><p>Các mục tiêu được cài đặt riêng cho {child.name}.</p></div><div className="mini-legend"><span><i className="green-dot" /> Đạt</span><span><i className="yellow-dot" /> Manh nha</span><span><i className="gray-dot" /> Chưa đạt</span></div></div><GoalsTable goals={childGoals} onStatusChange={onStatusChange} /></>;
}

function ChildForm({ child, onCancel, onSave }: { child?: Child; onCancel: () => void; onSave: (child: Omit<Child, "id">) => void }) {
  const [name, setName] = useState(child?.name ?? "");
  const [birthday, setBirthday] = useState(child?.birthday ?? "");
  const [gender, setGender] = useState(child?.gender ?? "Nữ");
  const [note, setNote] = useState(child?.note ?? "");
  return <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="child-form-title"><div className="modal-head"><div><h2 id="child-form-title">{child ? "Chỉnh sửa hồ sơ trẻ" : "Thêm trẻ mới"}</h2><p>Nhập thông tin để quản lý mục tiêu riêng cho trẻ.</p></div><button type="button" className="close-button" onClick={onCancel} aria-label="Đóng">×</button></div><div className="form-grid"><InputField label="Họ và tên trẻ" value={name} onChange={setName} placeholder="Ví dụ: Nguyễn Minh Anh" required /><InputField label="Ngày sinh" value={birthday} onChange={setBirthday} placeholder="dd/mm/yyyy" required /><SelectField label="Giới tính" value={gender} onChange={setGender} options={["Nữ", "Nam", "Khác"]} /><label className="field full"><span>Ghi chú</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Thông tin cần lưu ý về trẻ..." /></label></div><div className="modal-actions"><button type="button" className="button" onClick={onCancel}>Hủy</button><button type="button" className="button primary" disabled={!name.trim() || !birthday.trim()} onClick={() => onSave({ name: name.trim(), birthday: birthday.trim(), gender, note: note.trim() })}><Icon name="save" size={17} /> Lưu hồ sơ</button></div></div></div>;
}

function ChildrenView({ childList, onAdd, onEdit, onDelete, onSelectPlan }: { childList: Child[]; onAdd: () => void; onEdit: (child: Child) => void; onDelete: (id: number) => void; onSelectPlan: (id: number) => void }) {
  return <><Header title="Hồ sơ trẻ" subtitle={`${childList.length} hồ sơ đang được quản lý`} actionLabel="Thêm trẻ" onAction={onAdd} /><div className="children-intro"><div className="intro-icon"><Icon name="children" size={27} /></div><div><h2>Thông tin tất cả các trẻ</h2><p>Quản lý hồ sơ và mở kế hoạch giáo dục riêng cho từng trẻ.</p></div></div><div className="children-grid">{childList.map((child) => <article className="child-card" key={child.id}><div className="child-card-head"><ChildAvatar name={child.name} /><div><h3>{child.name}</h3><p>{child.gender} · Sinh ngày {child.birthday}</p></div></div><div className="child-card-note"><Icon name="note" size={17} />{child.note || "Chưa có ghi chú"}</div><div className="child-card-actions"><button type="button" className="link-button" onClick={() => onSelectPlan(child.id)}>Xem kế hoạch <span>→</span></button><div><button type="button" className="icon-action edit" onClick={() => onEdit(child)} aria-label={`Chỉnh sửa ${child.name}`}><Icon name="edit" size={18} /></button><button type="button" className="icon-action delete" onClick={() => onDelete(child.id)} aria-label={`Xóa ${child.name}`}><Icon name="trash" size={18} /></button></div></div></article>)}</div>{childList.length === 0 && <div className="empty-state"><Icon name="children" size={34} /><h3>Chưa có hồ sơ trẻ</h3><p>Nhấn “Thêm trẻ” để nhập hồ sơ đầu tiên.</p></div>}</>;
}

function ObjectiveForm({ childList, onCancel, onSaved }: { childList: Child[]; onCancel: () => void; onSaved: (goal: Omit<Goal, "id">) => void }) {
  const [childId, setChildId] = useState(String(childList[0]?.id ?? ""));
  const [domain, setDomain] = useState(DOMAIN_OPTIONS[0]);
  const [longTerm, setLongTerm] = useState("");
  const [from, setFrom] = useState("01/07/2026");
  const [to, setTo] = useState("30/08/2026");
  const [shortGoals, setShortGoals] = useState(["", ""]);
  const addShort = () => setShortGoals((items) => [...items, ""]);
  const updateShort = (index: number, value: string) => setShortGoals((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const removeShort = (index: number) => setShortGoals((items) => items.length > 1 ? items.filter((_, itemIndex) => itemIndex !== index) : items);
  const effectiveChildId = childId || String(childList[0]?.id ?? "");
  const selectedChild = childList.find((child) => String(child.id) === effectiveChildId);
  return <><Header title="Thêm mục tiêu" subtitle="Cài đặt mục tiêu phát triển riêng cho từng trẻ" onBack={onCancel} /><div className="objective-layout"><main><section className="form-card"><div className="form-card-title"><span className="step">01</span><div><h2>Chọn trẻ và lĩnh vực</h2><p>Mỗi mục tiêu chỉ áp dụng cho hồ sơ trẻ được chọn.</p></div></div><div className="form-grid"><SelectField label="Trẻ áp dụng" value={selectedChild?.name ?? ""} onChange={(name) => { const child = childList.find((item) => item.name === name); if (child) setChildId(String(child.id)); }} options={childList.map((child) => child.name)} required /><SelectField label="Lĩnh vực phát triển" value={domain} onChange={setDomain} options={DOMAIN_OPTIONS} required /></div></section><section className="form-card"><div className="form-card-title"><span className="step">02</span><div><h2>Mục tiêu dài hạn</h2><p>Mô tả kết quả mong đợi trong giai đoạn áp dụng.</p></div></div><label className="field"><span>Mục tiêu dài hạn<em>*</em></span><textarea value={longTerm} onChange={(event) => setLongTerm(event.target.value)} placeholder="Ví dụ: Duy trì tương tác với giáo viên 5–10 phút" /></label><div className="form-grid dates"><InputField label="Từ ngày" value={from} onChange={setFrom} /><InputField label="Đến ngày" value={to} onChange={setTo} /></div></section><section className="form-card"><div className="form-card-title"><span className="step">03</span><div><h2>Mục tiêu ngắn hạn</h2><p>Các bước nhỏ giúp trẻ tiến tới mục tiêu dài hạn.</p></div></div><div className="short-goal-editor">{shortGoals.map((goal, index) => <div className="short-goal-edit-row" key={index}><span>{index + 1}</span><input value={goal} onChange={(event) => updateShort(index, event.target.value)} placeholder={`Mục tiêu ngắn hạn ${index + 1}`} /><button type="button" onClick={() => removeShort(index)} aria-label="Xóa mục tiêu"><Icon name="trash" size={17} /></button></div>)}</div><button type="button" className="outline-button" onClick={addShort}><Icon name="plus" size={16} /> Thêm mục tiêu ngắn hạn</button></section><div className="form-actions"><button type="button" className="button" onClick={onCancel}>Hủy</button><button type="button" className="button primary" disabled={!selectedChild || !longTerm.trim() || !shortGoals.some((item) => item.trim())} onClick={() => onSaved({ childId: Number(effectiveChildId), domain, longTerm: longTerm.trim(), shortTerm: shortGoals.map((item) => item.trim()).filter(Boolean), from, to, statuses: ["Manh nha", "Manh nha", "Chưa đạt", "Chưa đạt"] })}><Icon name="save" size={17} /> Lưu mục tiêu</button></div></main><aside className="objective-preview"><div className="preview-heading"><Icon name="target" size={19} /> Xem trước</div><div className="preview-body"><span className="preview-label">{selectedChild?.name || "Chưa chọn trẻ"}</span><span className="domain-pill">{domain}</span><h3>Mục tiêu dài hạn</h3><p>{longTerm || "Chưa nhập mục tiêu"}</p><h3>Mục tiêu ngắn hạn</h3><ol>{shortGoals.filter(Boolean).map((goal, index) => <li key={index}>{goal}</li>)}</ol></div></aside></div></>;
}

function OverviewView({ childList, selectedChildId, onSelectChild, goals, onStatusChange, onOpenPlan }: { childList: Child[]; selectedChildId: number; onSelectChild: (id: number) => void; goals: Goal[]; onStatusChange: (id: number, week: number, status: Status) => void; onOpenPlan: () => void }) {
  const child = childList.find((item) => item.id === selectedChildId) ?? childList[0];
  if (!child) return <div className="empty-state"><Icon name="overview" size={34} /><h3>Chưa có dữ liệu tổng quan</h3><p>Vào Hồ sơ trẻ để thêm hồ sơ đầu tiên.</p></div>;
  const childGoals = goals.filter((goal) => goal.childId === child.id);
  const achievedCount = childGoals.reduce((total, goal) => total + goal.statuses.filter((status) => status === "Đạt").length, 0);
  const trackedCount = childGoals.length;
  return <><Header title="Tổng quan" subtitle="Theo dõi nhanh kế hoạch giáo dục của các trẻ" actionLabel="Xem kế hoạch" actionIcon="file" onAction={onOpenPlan} /><div className="overview-grid"><article className="overview-card"><span className="overview-card-label">Hồ sơ trẻ</span><strong>{childList.length}</strong><small>đang được quản lý</small></article><article className="overview-card"><span className="overview-card-label">Mục tiêu đang theo dõi</span><strong>{trackedCount}</strong><small>của {child.name}</small></article><article className="overview-card success"><span className="overview-card-label">Kết quả đạt</span><strong>{achievedCount}</strong><small>trạng thái theo tuần</small></article></div><div className="overview-toolbar"><SelectField label="Đang xem tổng quan của" value={child.name} onChange={(name) => { const next = childList.find((item) => item.name === name); if (next) onSelectChild(next.id); }} options={childList.map((item) => item.name)} /></div><ChildSummary child={child} /><div className="section-title-row"><div><h2><Icon name="overview" size={21} /> Mục tiêu đang theo dõi</h2><p>Tổng hợp nhanh các mục tiêu của {child.name}.</p></div><div className="mini-legend"><span><i className="green-dot" /> Đạt</span><span><i className="yellow-dot" /> Manh nha</span><span><i className="gray-dot" /> Chưa đạt</span></div></div><GoalsTable goals={childGoals} onStatusChange={onStatusChange} /></>;
}

function SettingsView({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const [saved, setSaved] = useState(false);
  return <><Header title="Cài đặt" subtitle="Tùy chỉnh cách bạn sử dụng kế hoạch giáo dục" /><div className="settings-card"><div className="settings-heading"><div className="settings-icon"><Icon name="settings" size={24} /></div><div><h2>Tùy chọn ứng dụng</h2><p>Các thay đổi được lưu trên thiết bị này.</p></div></div><div className="setting-row"><span><strong>Giao diện tối</strong><small>Đổi sang nền tối để sử dụng dễ chịu hơn vào buổi tối.</small></span><input aria-label="Giao diện tối" type="checkbox" checked={darkMode} onChange={onToggleTheme} /></div><div className="settings-save"><button type="button" className="button primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); }}><Icon name="save" size={17} /> Lưu cài đặt</button>{saved && <span>Đã lưu thay đổi</span>}</div></div></>;
}

export default function Home() {
  const [view, setView] = useState<View>("plan");
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("giaoan-theme") === "dark");
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [selectedChildId, setSelectedChildId] = useState(initialChildren[0].id);
  const [editingChild, setEditingChild] = useState<Child | undefined>();
  const [showChildForm, setShowChildForm] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudExtras, setCloudExtras] = useState<Record<string, unknown>>({});
  const cloudSaveTimer = useRef<number | null>(null);
  useEffect(() => { document.documentElement.classList.toggle("dark-mode", darkMode); window.localStorage.setItem("giaoan-theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => {
    let active = true;

    loadCloudData<AppCloudData>()
      .then((data) => {
        if (!active) return;

        if (data) {
          const { children: cloudChildren, goals: cloudGoals, ...extras } = data;
          setCloudExtras(extras);
          if (Array.isArray(cloudChildren)) setChildren(cloudChildren);
          if (Array.isArray(cloudGoals)) setGoals(cloudGoals);
        }

        setCloudReady(true);
      })
      .catch((error) => {
        console.error("Không thể tải dữ liệu từ Google Sheet:", error);
        if (active) setCloudReady(true);
      });

    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!cloudReady) return;

    if (cloudSaveTimer.current !== null) {
      window.clearTimeout(cloudSaveTimer.current);
    }

    cloudSaveTimer.current = window.setTimeout(() => {
      saveCloudData({ ...cloudExtras, children, goals }).catch((error) => {
        console.error("Không thể đồng bộ dữ liệu lên Google Sheet:", error);
      });
    }, 250);

    return () => {
      if (cloudSaveTimer.current !== null) {
        window.clearTimeout(cloudSaveTimer.current);
      }
    };
  }, [children, goals, cloudExtras, cloudReady]);
  const updateStatus = (id: number, week: number, status: Status) => setGoals((items) => items.map((goal) => goal.id === id ? { ...goal, statuses: goal.statuses.map((item, index) => index === week ? status : item) } : goal));
  const saveChild = (data: Omit<Child, "id">) => { if (editingChild) setChildren((items) => items.map((item) => item.id === editingChild.id ? { ...data, id: item.id } : item)); else setChildren((items) => [...items, { ...data, id: Math.max(0, ...items.map((item) => item.id)) + 1 }]); setShowChildForm(false); setEditingChild(undefined); };
  const deleteChild = (id: number) => { const child = children.find((item) => item.id === id); if (!child || !window.confirm(`Xóa hồ sơ của ${child.name}?`)) return; setChildren((items) => items.filter((item) => item.id !== id)); setGoals((items) => items.filter((goal) => goal.childId !== id)); if (selectedChildId === id) { const next = children.find((item) => item.id !== id); if (next) setSelectedChildId(next.id); } };
  const saveGoal = (goal: Omit<Goal, "id">) => { setGoals((items) => [...items, { ...goal, id: Math.max(0, ...items.map((item) => item.id)) + 1 }]); setSelectedChildId(goal.childId); setView("plan"); };
  const navigate = (next: View) => { setView(next); if (next === "objective-form" && !children.length) setShowChildForm(true); };
  const currentView = useMemo(() => view, [view]);
  return <div className="app-shell"><Sidebar active={currentView} onChange={navigate} darkMode={darkMode} onToggleTheme={() => setDarkMode((value) => !value)} /><main className="main-content">{view === "overview" && <OverviewView childList={children} selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} goals={goals} onStatusChange={updateStatus} onOpenPlan={() => setView("plan")} />}{view === "plan" && <PlanView childList={children} selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} goals={goals} onStatusChange={updateStatus} />}{view === "children" && <ChildrenView childList={children} onAdd={() => { setEditingChild(undefined); setShowChildForm(true); }} onEdit={(child) => { setEditingChild(child); setShowChildForm(true); }} onDelete={deleteChild} onSelectPlan={(id) => { setSelectedChildId(id); setView("plan"); }} />}{view === "objective-form" && <ObjectiveForm childList={children} onCancel={() => setView("plan")} onSaved={saveGoal} />}{view === "settings" && <SettingsView darkMode={darkMode} onToggleTheme={() => setDarkMode((value) => !value)} />}</main>{showChildForm && <ChildForm child={editingChild} onCancel={() => { setShowChildForm(false); setEditingChild(undefined); }} onSave={saveChild} />}</div>;
}
