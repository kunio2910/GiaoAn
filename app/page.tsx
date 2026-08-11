"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadCloudData, saveCloudData, type CloudData } from "./google-sheet-connection";

type View = "overview" | "plan" | "children" | "settings" | "objective-form";
type Status = "Đạt" | "Manh nha" | "Chưa đạt";

const TEACHING_DAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "Chủ nhật" },
] as const;

const SCHEDULE_COLOR_COUNT = 6;

function birthdayInputValue(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function birthdayDisplayValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

type Child = {
  id: number;
  name: string;
  birthday: string;
  gender: string;
  note: string;
  teachingDays?: number[];
  teachingStartTime?: string;
  teachingEndTime?: string;
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
  note?: string;
};

type AppCloudData = CloudData & {
  children?: Child[];
  goals?: Goal[];
  evaluationPeriods?: string[];
};

const WEEK_LABELS = ["Tuần 1 - 2", "Tuần 3 - 4", "Tuần 5 - 6", "Tuần 7 - 8"];
const STATUS_OPTIONS: Status[] = ["Đạt", "Manh nha", "Chưa đạt"];
const DOMAIN_OPTIONS = ["Tương tác xã hội", "Chú ý chung", "Giao tiếp", "Kỹ năng tự phục vụ"];

const DEFAULT_EVALUATION_PERIODS = ["Tuần 1 - 2", "Tuần 3 - 4", "Tuần 5 - 6", "Tuần 7 - 8"];

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

function Icon({ name, size = 20 }: { name: "overview" | "plan" | "children" | "settings" | "target" | "note" | "chevron" | "plus" | "edit" | "trash" | "calendar" | "user" | "save" | "back" | "file" | "share" | "moon" | "sun"; size?: number }) {
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
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4" /></>,
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

function childNameSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function childShareUrl(child: Child) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("share", childNameSlug(child.name));
  return url.toString();
}

function copyChildShareLink(child: Child) {
  const url = childShareUrl(child);
  const fallback = () => window.prompt(`Đường dẫn chia sẻ của ${child.name}`, url);
  if (!navigator.clipboard?.writeText) {
    fallback();
    return;
  }
  void navigator.clipboard.writeText(url).then(() => window.alert(`Đã sao chép đường dẫn của ${child.name}.`)).catch(fallback);
}

function sharedChildSlugFromUrl() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("share");
  return value?.trim().toLowerCase() || null;
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
  const [birthday, setBirthday] = useState(birthdayInputValue(child?.birthday ?? ""));
  const [gender, setGender] = useState(child?.gender ?? "Nữ");
  const [note, setNote] = useState(child?.note ?? "");
  const [teachingDays, setTeachingDays] = useState<number[]>(child?.teachingDays ?? []);
  const [teachingStartTime, setTeachingStartTime] = useState(child?.teachingStartTime ?? "");
  const [teachingEndTime, setTeachingEndTime] = useState(child?.teachingEndTime ?? "");
  const toggleTeachingDay = (day: number) => setTeachingDays((days) => days.includes(day) ? days.filter((item) => item !== day) : [...days, day].sort((a, b) => a - b));
  const hasInvalidSchedule = teachingDays.length > 0 && (!teachingStartTime || !teachingEndTime);
  return <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="child-form-title"><div className="modal-head"><div><h2 id="child-form-title">{child ? "Chỉnh sửa hồ sơ trẻ" : "Thêm trẻ mới"}</h2><p>Nhập thông tin để quản lý mục tiêu riêng cho trẻ.</p></div><button type="button" className="close-button" onClick={onCancel} aria-label="Đóng">×</button></div><div className="form-grid"><InputField label="Họ và tên trẻ" value={name} onChange={setName} placeholder="Ví dụ: Nguyễn Minh Anh" required /><InputField label="Ngày sinh" value={birthday} onChange={setBirthday} type="date" required /><SelectField label="Giới tính" value={gender} onChange={setGender} options={["Nữ", "Nam", "Khác"]} /><fieldset className="schedule-fieldset field full"><legend>Ngày giờ dạy</legend><p>Chọn các ngày trẻ học để hiển thị trên lịch tổng quan.</p><div className="teaching-day-list">{TEACHING_DAYS.map((day) => <label className={`teaching-day-option ${teachingDays.includes(day.value) ? "selected" : ""}`} key={day.value}><input type="checkbox" checked={teachingDays.includes(day.value)} onChange={() => toggleTeachingDay(day.value)} /><span>{day.label}</span></label>)}</div><div className="teaching-time-grid"><InputField label="Giờ bắt đầu" value={teachingStartTime} onChange={setTeachingStartTime} type="time" /><InputField label="Giờ kết thúc" value={teachingEndTime} onChange={setTeachingEndTime} type="time" /></div>{hasInvalidSchedule && <small className="schedule-error">Vui lòng chọn đủ giờ bắt đầu và giờ kết thúc.</small>}</fieldset><label className="field full"><span>Ghi chú</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Thông tin cần lưu ý về trẻ..." /></label></div><div className="modal-actions"><button type="button" className="button" onClick={onCancel}>Hủy</button><button type="button" className="button primary" disabled={!name.trim() || !birthday.trim() || hasInvalidSchedule} onClick={() => onSave({ name: name.trim(), birthday: birthdayDisplayValue(birthday), gender, note: note.trim(), teachingDays, teachingStartTime, teachingEndTime })}><Icon name="save" size={17} /> Lưu hồ sơ</button></div></div></div>;
}

function ChildrenView({ childList, onAdd, onEdit, onDelete, onSelectPlan }: { childList: Child[]; onAdd: () => void; onEdit: (child: Child) => void; onDelete: (id: number) => void; onSelectPlan: (id: number) => void }) {
  return <><Header title="Hồ sơ trẻ" subtitle={`${childList.length} hồ sơ đang được quản lý`} actionLabel="Thêm trẻ" onAction={onAdd} /><div className="children-intro"><div className="intro-icon"><Icon name="children" size={27} /></div><div><h2>Thông tin tất cả các trẻ</h2><p>Quản lý hồ sơ và mở kế hoạch giáo dục riêng cho từng trẻ.</p></div></div><div className="children-grid">{childList.map((child) => <article className="child-card" key={child.id}><div className="child-card-head"><ChildAvatar name={child.name} /><div><h3>{child.name}</h3><p>{child.gender} · Sinh ngày {child.birthday}</p></div></div><div className="child-card-note"><Icon name="note" size={17} />{child.note || "Chưa có ghi chú"}</div><div className="child-card-actions"><div className="child-card-links"><button type="button" className="link-button" onClick={() => onSelectPlan(child.id)}>Xem kế hoạch <span>→</span></button><button type="button" className="link-button share-link-button" onClick={() => copyChildShareLink(child)}><Icon name="share" size={15} />Chia sẻ</button></div><div><button type="button" className="icon-action edit" onClick={() => onEdit(child)} aria-label={`Chỉnh sửa ${child.name}`}><Icon name="edit" size={18} /></button><button type="button" className="icon-action delete" onClick={() => onDelete(child.id)} aria-label={`Xóa ${child.name}`}><Icon name="trash" size={18} /></button></div></div></article>)}</div>{childList.length === 0 && <div className="empty-state"><Icon name="children" size={34} /><h3>Chưa có hồ sơ trẻ</h3><p>Nhấn “Thêm trẻ” để nhập hồ sơ đầu tiên.</p></div>}</>;
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

function SidebarV2({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return <aside className="sidebar"><Logo /><nav className="side-nav" aria-label="Điều hướng chính">{navItems.map((item) => <button key={item.view} type="button" className={`nav-item ${active === item.view ? "active" : ""}`} onClick={() => onChange(item.view)}><span className="nav-icon"><Icon name={item.icon} size={19} /></span><span>{item.label}</span></button>)}</nav><div className="sidebar-art" aria-hidden="true" /><div className="profile-card"><div className="teacher-avatar">VK</div><div><strong>Nguyễn Thị Vành Khuyên</strong><small>Người lập kế hoạch</small></div><button className="logout" type="button">Đăng xuất</button></div></aside>;
}

/* eslint-disable jsx-a11y/no-autofocus */
type GoalDialogMode = "domain" | "long" | "short" | "edit-long" | "period" | "edit-short";

type GoalDialogState = {
  mode: GoalDialogMode;
  goalId?: number;
  shortIndex?: number;
  initialValue?: string;
  initialDomain?: string;
  initialGoalId?: number;
};

type GoalDialogSave = {
  mode: GoalDialogMode;
  text: string;
  domain: string;
  goalId?: number;
};

function AddTableButton({ onClick, label = "Thêm" }: { onClick?: () => void; label?: string }) {
  if (!onClick) return null;
  return <button type="button" className="table-add-button" onClick={onClick}><Icon name="plus" size={17} />{label}</button>;
}

function ReadOnlyStatus({ value }: { value: Status }) {
  return <div className={`status-select read-only ${value === "Đạt" ? "achieved" : value === "Manh nha" ? "emerging" : "not-achieved"}`}><span className="status-dot" /><span>{value}</span></div>;
}

function EditableStatus({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return <StatusSelect value={value} onChange={onChange} />;
}

function GoalsTableV2({
  goals: inputGoals,
  evaluationPeriods,
  readOnly = false,
  onStatusChange,
  onNoteClick,
  onAddDomain,
  onAddLong,
  onAddShort,
  onAddPeriod,
  onEditLong,
  onDeleteGoal,
  onEditShort,
  onDeleteShort,
}: {
  goals: Goal[];
  evaluationPeriods: string[];
  readOnly?: boolean;
  onStatusChange?: (id: number, week: number, status: Status) => void;
  onNoteClick?: (id: number) => void;
  onAddDomain?: () => void;
  onAddLong?: () => void;
  onAddShort?: () => void;
  onAddPeriod?: () => void;
  onEditLong?: (goal: Goal) => void;
  onDeleteGoal?: (goal: Goal) => void;
  onEditShort?: (goal: Goal, index: number) => void;
  onDeleteShort?: (goal: Goal, index: number) => void;
}) {
  if (!readOnly) return <GoalsBoardV2 goals={inputGoals} evaluationPeriods={evaluationPeriods} onStatusChange={onStatusChange ?? (() => undefined)} onNoteClick={onNoteClick ?? (() => undefined)} onAddDomain={onAddDomain ?? (() => undefined)} onAddLong={onAddLong ?? (() => undefined)} onAddShort={onAddShort ?? (() => undefined)} onAddPeriod={onAddPeriod ?? (() => undefined)} onEditLong={onEditLong ?? (() => undefined)} onDeleteGoal={onDeleteGoal ?? (() => undefined)} onEditShort={onEditShort ?? (() => undefined)} onDeleteShort={onDeleteShort ?? (() => undefined)} />;
  const goals = [...new Set(inputGoals.map((goal) => goal.domain))].flatMap((domain) => inputGoals.filter((goal) => goal.domain === domain));
  const domainCounts = goals.reduce<Record<string, number>>((counts, goal) => ({ ...counts, [goal.domain]: (counts[goal.domain] ?? 0) + 1 }), {});
  const periodLabels = evaluationPeriods.length ? evaluationPeriods : ["Chưa có thời gian"];
  return <div className="table-scroll"><table className="goals-table"><thead><tr><th><div className="table-head-title">LĨNH VỰC<AddTableButton onClick={readOnly ? undefined : onAddDomain} /></div></th><th><div className="table-head-title">MỤC TIÊU DÀI HẠN<AddTableButton onClick={readOnly ? undefined : onAddLong} /></div></th><th><div className="table-head-title">MỤC TIÊU NGẮN HẠN<AddTableButton onClick={readOnly ? undefined : onAddShort} /></div></th><th colSpan={periodLabels.length}><div className="table-head-title">KẾT QUẢ<AddTableButton onClick={readOnly ? undefined : onAddPeriod} /></div></th><th>GHI CHÚ</th></tr><tr className="period-header"><th /><th /><th />{periodLabels.map((label) => <th key={label}>{label}</th>)}<th /></tr></thead><tbody>{goals.map((goal, index) => { const isFirstDomainRow = index === 0 || goals[index - 1].domain !== goal.domain; const statuses = periodLabels.map((_, periodIndex) => goal.statuses[periodIndex] ?? "Chưa đạt"); return <tr key={goal.id}>{isFirstDomainRow && <td className="domain-cell" rowSpan={domainCounts[goal.domain]}><span className="domain-icon"><Icon name="target" size={21} /></span><strong>{goal.domain || "Chưa phân loại"}</strong></td>}<td className="long-term-cell"><div>{goal.longTerm || <span className="cell-placeholder">Chưa nhập mục tiêu</span>}</div>{!readOnly && <div className="goal-inline-actions"><button type="button" className="goal-edit-button" onClick={() => onEditLong?.(goal)}><Icon name="edit" size={16} />Sửa</button><button type="button" className="goal-delete-button" onClick={() => onDeleteGoal?.(goal)}><Icon name="trash" size={16} />Xóa</button></div>}</td><td className="short-term-cell">{goal.shortTerm.length ? <ul>{goal.shortTerm.map((item, shortIndex) => <li key={`${goal.id}-${shortIndex}`}><span>{item || <span className="cell-placeholder">Chưa nhập mục tiêu</span>}</span>{!readOnly && <span className="goal-inline-actions"><button type="button" className="goal-edit-button" onClick={() => onEditShort?.(goal, shortIndex)}><Icon name="edit" size={15} />Sửa</button><button type="button" className="goal-delete-button" onClick={() => onDeleteShort?.(goal, shortIndex)}><Icon name="trash" size={15} />Xóa</button></span>}</li>)}</ul> : <span className="cell-placeholder">Chưa có mục tiêu ngắn hạn</span>}</td>{statuses.map((status, periodIndex) => <td className="result-cell" key={`${goal.id}-${periodIndex}`}>{readOnly ? <ReadOnlyStatus value={status} /> : <EditableStatus value={status} onChange={(next) => onStatusChange?.(goal.id, periodIndex, next)} />}</td>)}<td className="row-note">{readOnly ? <><span className="note-icon-display"><Icon name="note" size={20} /></span>{goal.note ? <span className="note-content" title={goal.note}>{goal.note}</span> : <span className="cell-placeholder">Chưa có ghi chú</span>}</> : <button type="button" aria-label={`Ghi chú mục tiêu ${goal.longTerm || goal.domain}`} onClick={() => onNoteClick?.(goal.id)}><Icon name="note" size={21} /></button>}</td></tr>; })}</tbody></table>{!goals.length && <div className="table-empty-state"><Icon name="target" size={30} /><strong>Chưa có mục tiêu phát triển</strong><span>Nhấn “Thêm” để bắt đầu tạo mục tiêu cho trẻ.</span></div>}<div className="table-footer"><span>Hiển thị {goals.length} mục tiêu</span><div className="pagination" aria-label="Phân trang"><button type="button" disabled aria-label="Trang đầu">|‹</button><button type="button" disabled aria-label="Trang trước">‹</button><button type="button" className="active" aria-current="page">1</button><button type="button" disabled aria-label="Trang sau">›</button><button type="button" disabled aria-label="Trang cuối">›|</button></div></div></div>;
}

function GoalsBoardV2({
  goals,
  evaluationPeriods,
  onStatusChange,
  onNoteClick,
  onAddDomain,
  onAddLong,
  onAddShort,
  onAddPeriod,
  onEditLong,
  onDeleteGoal,
  onEditShort,
  onDeleteShort,
}: {
  goals: Goal[];
  evaluationPeriods: string[];
  onStatusChange: (id: number, week: number, status: Status) => void;
  onNoteClick: (id: number) => void;
  onAddDomain: () => void;
  onAddLong: () => void;
  onAddShort: (goal?: Goal) => void;
  onAddPeriod: () => void;
  onEditLong: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
  onEditShort: (goal: Goal, index: number) => void;
  onDeleteShort: (goal: Goal, index: number) => void;
}) {
  const [search, setSearch] = useState("");
  const periods = evaluationPeriods.length ? evaluationPeriods : ["Chưa có thời gian"];
  const visibleGoals = goals.filter((goal) => `${goal.domain} ${goal.longTerm} ${goal.shortTerm.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="goals-board">
    <div className="board-toolbar">
      <div className="board-search"><Icon name="overview" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm lĩnh vực, mục tiêu..." aria-label="Tìm kiếm mục tiêu" /></div>
      <span className="board-summary"><strong>{visibleGoals.length}</strong> mục tiêu đang theo dõi</span>
      <div className="board-actions"><button type="button" className="button board-secondary-action" onClick={onAddDomain}><Icon name="plus" size={17} />Thêm lĩnh vực</button><button type="button" className="button primary" onClick={onAddLong}><Icon name="plus" size={17} />Thêm mục tiêu</button></div>
    </div>
    {!visibleGoals.length ? <div className="board-empty-state"><span className="board-empty-icon"><Icon name="target" size={28} /></span><strong>{search ? "Không tìm thấy mục tiêu" : "Chưa có mục tiêu phát triển"}</strong><span>{search ? "Thử từ khóa khác hoặc xóa bộ lọc." : "Bắt đầu bằng cách thêm lĩnh vực hoặc mục tiêu dài hạn."}</span>{!search && <button type="button" className="button primary" onClick={onAddLong}><Icon name="plus" size={17} />Thêm mục tiêu</button>}</div> : <div className="goal-card-list">
      {visibleGoals.map((goal) => <article className="goal-card" key={goal.id}>
        <header className="goal-card-header"><div className="goal-domain-heading"><span className="goal-domain-icon"><Icon name="target" size={22} /></span><div><span className="goal-card-eyebrow">Lĩnh vực</span><h3>{goal.domain || "Chưa phân loại"}</h3></div></div><div className="goal-card-actions"><button type="button" className="goal-card-action edit" onClick={() => onEditLong(goal)}><Icon name="edit" size={16} />Sửa</button><button type="button" className="goal-card-action delete" onClick={() => onDeleteGoal(goal)}><Icon name="trash" size={16} />Xóa</button><button type="button" className="goal-card-note-button" onClick={() => onNoteClick(goal.id)} aria-label={`Ghi chú ${goal.domain}`}><Icon name="note" size={18} /></button></div></header>
        <div className="goal-card-main"><section className="goal-long-section"><h4>Mục tiêu dài hạn</h4><p>{goal.longTerm || <span className="cell-placeholder">Chưa nhập mục tiêu</span>}</p><button type="button" className="text-action" onClick={() => onEditLong(goal)}><Icon name="edit" size={15} />Chỉnh sửa mục tiêu dài hạn</button></section><section className="goal-short-section"><div className="goal-card-section-head"><h4>Mục tiêu ngắn hạn</h4><button type="button" className="outline-button compact" onClick={() => onAddShort(goal)}><Icon name="plus" size={15} />Thêm</button></div>{goal.shortTerm.length ? <div className="short-goal-list">{goal.shortTerm.map((item, index) => <div className="short-goal-row" key={`${goal.id}-${index}`}><span className="short-goal-bullet" /><span className="short-goal-text">{item || <span className="cell-placeholder">Chưa nhập mục tiêu</span>}</span><span className="short-goal-actions"><button type="button" className="row-action edit" onClick={() => onEditShort(goal, index)} aria-label="Sửa mục tiêu ngắn hạn"><Icon name="edit" size={15} /></button><button type="button" className="row-action delete" onClick={() => onDeleteShort(goal, index)} aria-label="Xóa mục tiêu ngắn hạn"><Icon name="trash" size={15} /></button></span></div>)}</div> : <p className="muted-copy">Chưa có mục tiêu ngắn hạn.</p>}</section></div>
        <section className="goal-results-section"><div className="goal-card-section-head"><div><h4>Kết quả theo tuần</h4><p>Cập nhật trạng thái trực tiếp theo từng giai đoạn.</p></div><button type="button" className="outline-button compact" onClick={onAddPeriod}><Icon name="plus" size={15} />Thêm thời gian</button></div><div className="goal-period-grid">{periods.map((label, periodIndex) => <div className="goal-period" key={`${goal.id}-${label}`}><span className="goal-period-label">{label}</span><EditableStatus value={goal.statuses[periodIndex] ?? "Chưa đạt"} onChange={(next) => onStatusChange(goal.id, periodIndex, next)} /></div>)}</div></section>
        <footer className="goal-card-footer"><div><h4>Ghi chú</h4><p>{goal.note || <span className="cell-placeholder">Chưa có ghi chú.</span>}</p></div><button type="button" className="note-edit-button" onClick={() => onNoteClick(goal.id)}><Icon name="note" size={16} />{goal.note ? "Chỉnh sửa ghi chú" : "Thêm ghi chú"}</button></footer>
      </article>)}
    </div>}
    <div className="board-footer"><span>Hiển thị {visibleGoals.length} mục tiêu</span><span className="board-footer-hint">Mẹo: dùng nút Sửa/Xóa ngay trên từng thẻ để thao tác nhanh.</span></div>
  </div>;
}

function GoalDialog({ mode, goals, initialValue = "", initialGoalId, initialDomain, onCancel, onSave }: { mode: GoalDialogMode; goals: Goal[]; initialValue?: string; initialGoalId?: number; initialDomain?: string; onCancel: () => void; onSave: (data: GoalDialogSave) => void }) {
  const [text, setText] = useState(initialValue);
  const [domain, setDomain] = useState(initialDomain ?? goals[0]?.domain ?? DOMAIN_OPTIONS[0]);
  const [goalId, setGoalId] = useState(String(initialGoalId ?? goals[0]?.id ?? ""));
  const isEdit = mode === "edit-long" || mode === "edit-short";
  const isShort = mode === "short" || mode === "edit-short";
  const title = mode === "domain" ? "Thêm lĩnh vực" : mode === "period" ? "Thêm thời gian kết quả" : mode === "long" ? "Thêm mục tiêu dài hạn" : mode === "short" ? "Thêm mục tiêu ngắn hạn" : mode === "edit-long" ? "Chỉnh sửa mục tiêu dài hạn" : "Chỉnh sửa mục tiêu ngắn hạn";
  const description = mode === "period" ? "Thêm một mốc thời gian để theo dõi kết quả." : "Thông tin sẽ được hiển thị đồng thời ở Kế hoạch giáo dục và Tổng quan.";
  const label = mode === "domain" ? "Tên lĩnh vực" : mode === "period" ? "Tên thời gian đánh giá" : isShort ? "Mục tiêu ngắn hạn" : "Mục tiêu dài hạn";
  const placeholder = mode === "period" ? "Ví dụ: Tuần 9 - 10" : mode === "domain" ? "Ví dụ: Kỹ năng tự phục vụ" : "Nhập nội dung mục tiêu...";
  return <div className="modal-backdrop" role="presentation"><div className="modal-card goal-dialog" role="dialog" aria-modal="true" aria-labelledby="goal-dialog-title"><div className="modal-head"><div><h2 id="goal-dialog-title">{title}</h2><p>{description}</p></div><button type="button" className="close-button" onClick={onCancel} aria-label="Đóng">×</button></div><div className="form-grid">{mode === "long" && <SelectField label="Lĩnh vực áp dụng" value={domain} onChange={setDomain} options={[...new Set([...DOMAIN_OPTIONS, ...goals.map((goal) => goal.domain).filter(Boolean)])]} required />}{mode === "short" && <label className="field"><span>Mục tiêu dài hạn<em>*</em></span><div className="select-wrap"><select value={goalId} onChange={(event) => setGoalId(event.target.value)}>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.longTerm || "Chưa nhập mục tiêu"}</option>)}</select><Icon name="chevron" size={18} /></div></label>}{mode !== "short" && <label className="field full"><span>{label}<em>*</em></span>{mode === "period" || mode === "domain" ? <input value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} autoFocus /> : <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} autoFocus />}</label>}{mode === "short" && <label className="field full"><span>{label}<em>*</em></span><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} autoFocus /></label>}{isEdit && <div className="field full"><small className="field-hint">Bạn đang cập nhật trực tiếp thông tin trong bảng mục tiêu.</small></div>}</div><div className="modal-actions"><button type="button" className="button" onClick={onCancel}>Hủy</button><button type="button" className="button primary" disabled={!text.trim()} onClick={() => onSave({ mode, text: text.trim(), domain, goalId: mode === "short" ? Number(goalId) : undefined })}><Icon name="save" size={17} />Lưu</button></div></div></div>;
}

function NoteDialog({ goal, onCancel, onSave }: { goal?: Goal; onCancel: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState(goal?.note ?? "");
  return <div className="modal-backdrop" role="presentation"><div className="modal-card note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title"><div className="modal-head"><div><h2 id="note-dialog-title">Ghi chú mục tiêu</h2><p>{goal?.longTerm || "Nhập ghi chú cho mục tiêu đang theo dõi."}</p></div><button type="button" className="close-button" onClick={onCancel} aria-label="Đóng">×</button></div><label className="field"><span>Ghi chú</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhập ghi chú..." autoFocus /></label><div className="modal-actions"><button type="button" className="button" onClick={onCancel}>Hủy</button><button type="button" className="button primary" onClick={() => onSave(note.trim())}><Icon name="save" size={17} />Lưu ghi chú</button></div></div></div>;
}

function PlanViewV2({ childList, selectedChildId, onSelectChild, goals, evaluationPeriods, onStatusChange, onNoteClick, onAddDomain, onAddLong, onAddShort, onAddPeriod, onEditLong, onDeleteGoal, onEditShort, onDeleteShort }: { childList: Child[]; selectedChildId: number; onSelectChild: (id: number) => void; goals: Goal[]; evaluationPeriods: string[]; onStatusChange: (id: number, week: number, status: Status) => void; onNoteClick: (id: number) => void; onAddDomain: () => void; onAddLong: () => void; onAddShort: () => void; onAddPeriod: () => void; onEditLong: (goal: Goal) => void; onDeleteGoal: (goal: Goal) => void; onEditShort: (goal: Goal, index: number) => void; onDeleteShort: (goal: Goal, index: number) => void }) {
  const child = childList.find((item) => item.id === selectedChildId) ?? childList[0];
  const childGoals = child ? [...new Set(goals.filter((goal) => goal.childId === child.id).map((goal) => goal.domain))].flatMap((domain) => goals.filter((goal) => goal.childId === child.id && goal.domain === domain)) : [];
  if (!child) return <div className="empty-state"><h3>Chưa có hồ sơ trẻ</h3><p>Vào Hồ sơ trẻ để thêm thông tin trẻ mới.</p></div>;
  return <><Header title="Kế hoạch giáo dục" actionLabel="Xuất PDF" actionIcon="file" onAction={() => window.print()} /><div className="plan-toolbar"><SelectField label="Đang xem hồ sơ của" value={child.name} onChange={(name) => { const next = childList.find((item) => item.name === name); if (next) onSelectChild(next.id); }} options={childList.map((item) => item.name)} /><div className="plan-count"><span className="count-number">{childGoals.length}</span><span>mục tiêu đang theo dõi</span></div></div><ChildSummary child={child} /><div className="section-title-row"><div><h2><Icon name="calendar" size={21} /> MỤC TIÊU PHÁT TRIỂN</h2><p>Các mục tiêu được cài đặt riêng cho {child.name}.</p></div><div className="mini-legend"><span><i className="green-dot" />Đạt (Đ)</span><span><i className="yellow-dot" />Manh nha (MN)</span><span><i className="gray-dot" />Chưa đạt (CĐ)</span></div></div><GoalsTableV2 goals={childGoals} evaluationPeriods={evaluationPeriods} onStatusChange={onStatusChange} onNoteClick={onNoteClick} onAddDomain={onAddDomain} onAddLong={onAddLong} onAddShort={onAddShort} onAddPeriod={onAddPeriod} onEditLong={onEditLong} onDeleteGoal={onDeleteGoal} onEditShort={onEditShort} onDeleteShort={onDeleteShort} /></>;
}

type OverviewCalendarCell = { day: number; date: Date; muted: boolean };

function getOverviewCalendarCells(cursor: Date): OverviewCalendarCell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells: OverviewCalendarCell[] = [];

  for (let index = leadingDays - 1; index >= 0; index -= 1) {
    const day = previousMonthDays - index;
    cells.push({ day, date: new Date(year, month - 1, day), muted: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, date: new Date(year, month, day), muted: false });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextDay, date: new Date(year, month + 1, nextDay), muted: true });
    nextDay += 1;
  }

  return cells;
}

function OverviewCalendar({ childList }: { childList: Child[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [popup, setPopup] = useState<{ date: Date; entries: Array<{ child: Child; time: string; colorIndex: number }> } | null>(null);
  const cells = useMemo(() => getOverviewCalendarCells(cursor), [cursor]);
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const monthTitle = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(cursor);
  const schedules = useMemo(() => childList.flatMap((child, childIndex) => (child.teachingDays ?? []).map((day) => ({ child, day, time: child.teachingStartTime && child.teachingEndTime ? `${child.teachingStartTime} - ${child.teachingEndTime}` : "Chưa có giờ dạy", colorIndex: childIndex % SCHEDULE_COLOR_COUNT }))), [childList]);
  const formatPopupDate = (date: Date) => new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);

  return <>
    <section className="overview-calendar" aria-label="Lịch kế hoạch">
      <div className="overview-calendar-head"><div><span className="overview-calendar-kicker">LỊCH KẾ HOẠCH</span><strong>{monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}</strong></div><div className="overview-calendar-controls"><button type="button" className="overview-calendar-today" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Hôm nay</button><button type="button" className="overview-calendar-nav" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Tháng trước"><Icon name="back" size={17} /></button><button type="button" className="overview-calendar-nav is-next" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Tháng sau"><Icon name="back" size={17} /></button><button type="button" className="overview-calendar-view">Tháng <Icon name="chevron" size={15} /></button><span className="overview-calendar-icon"><Icon name="calendar" size={20} /></span></div></div>
      <div className="overview-calendar-weekdays">{["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CHỦ NHẬT"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="overview-calendar-days">{cells.map((cell, index) => {
        const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.day}`;
        const isToday = key === todayKey;
        const isSunday = index % 7 === 6;
        const weekday = cell.date.getDay() === 0 ? 7 : cell.date.getDay();
        const entries = cell.muted ? [] : schedules.filter((item) => item.day === weekday);
        const isScheduled = entries.length > 0;
        const classes = [cell.muted ? "is-muted" : "", isSunday ? "is-sunday" : "", isScheduled ? "is-scheduled" : "", entries.length > 1 ? "is-multi-scheduled" : "", entries.length === 1 ? `schedule-color-${entries[0].colorIndex}` : "", isToday ? "is-today" : ""].filter(Boolean).join(" ");
        const openPopup = () => setPopup({ date: cell.date, entries });
        return <span key={`${key}-${index}`} className={classes} role={isScheduled ? "button" : undefined} tabIndex={isScheduled ? 0 : undefined} onClick={isScheduled ? openPopup : undefined} onKeyDown={isScheduled ? (event) => { if (event.key === "Enter" || event.key === " ") openPopup(); } : undefined}><b>{cell.day}</b>{entries.length === 1 && <><small className={`calendar-event-name schedule-text-${entries[0].colorIndex}`}><i className={`schedule-color-${entries[0].colorIndex}`} />{entries[0].child.name}</small><small className="calendar-event-time">{entries[0].time}</small></>}{entries.length > 1 && entries.slice(0, 2).map((entry) => <small className={`calendar-event-name schedule-text-${entry.colorIndex}`} key={entry.child.id}><i className={`schedule-color-${entry.colorIndex}`} />{entry.child.name}</small>)}</span>;
      })}</div>
    </section>
    {popup && <div className="calendar-popup-backdrop" role="presentation"><div className="calendar-schedule-popup" role="dialog" aria-modal="true" aria-labelledby="calendar-popup-title"><div className="calendar-popup-head"><div><span>LỊCH DẠY</span><h2 id="calendar-popup-title">{formatPopupDate(popup.date)}</h2></div><button type="button" className="close-button" onClick={() => setPopup(null)} aria-label="Đóng">×</button></div><div className="calendar-popup-list">{popup.entries.map((entry) => <div className="calendar-popup-entry" key={entry.child.id}><i className={`schedule-dot schedule-color-${entry.colorIndex}`} /><div><strong>{entry.child.name}</strong><span>{entry.time}</span></div></div>)}</div></div></div>}
  </>;
}

function OverviewViewV2({ childList, selectedChildId, onSelectChild, goals, evaluationPeriods, onOpenPlan }: { childList: Child[]; selectedChildId: number; onSelectChild: (id: number) => void; goals: Goal[]; evaluationPeriods: string[]; onOpenPlan: () => void }) {
  const child = childList.find((item) => item.id === selectedChildId) ?? childList[0];
  if (!child) return <div className="empty-state"><h3>Chưa có dữ liệu tổng quan</h3><p>Vào Hồ sơ trẻ để thêm hồ sơ đầu tiên.</p></div>;
  const childGoals = [...new Set(goals.filter((goal) => goal.childId === child.id).map((goal) => goal.domain))].flatMap((domain) => goals.filter((goal) => goal.childId === child.id && goal.domain === domain));
  return <><Header title="Tổng quan" subtitle="Theo dõi nhanh kế hoạch giáo dục của các trẻ" actionLabel="Xem kế hoạch" actionIcon="file" onAction={onOpenPlan} /><OverviewCalendar childList={childList} /><div className="overview-toolbar"><SelectField label="Đang xem tổng quan của" value={child.name} onChange={(name) => { const next = childList.find((item) => item.name === name); if (next) onSelectChild(next.id); }} options={childList.map((item) => item.name)} /></div><ChildSummary child={child} /><div className="section-title-row"><div><h2><Icon name="overview" size={21} /> Mục tiêu đang theo dõi</h2><p>Thông tin chỉ hiển thị; chỉnh sửa tại Kế hoạch giáo dục.</p></div><div className="mini-legend"><span><i className="green-dot" />Đạt</span><span><i className="yellow-dot" />Manh nha</span><span><i className="gray-dot" />Chưa đạt</span></div></div><GoalsTableV2 goals={childGoals} evaluationPeriods={evaluationPeriods} readOnly /></>;
}

function ShareView({ child, goals, evaluationPeriods }: { child: Child; goals: Goal[]; evaluationPeriods: string[] }) {
  const achievedCount = goals.reduce((total, goal) => total + goal.statuses.filter((status) => status === "Đạt").length, 0);
  return <main className="share-page"><div className="share-container"><header className="share-header"><div className="share-brand"><span className="share-brand-mark"><Icon name="target" size={20} /></span><div><strong>KẾ HOẠCH GIÁO DỤC</strong><small>Trang chia sẻ hồ sơ trẻ</small></div></div><span className="share-readonly"><Icon name="file" size={16} />Chỉ xem</span></header><section className="share-hero"><span className="share-eyebrow">HỒ SƠ TRẺ</span><h1>{child.name}</h1><p>Thông tin kế hoạch giáo dục được chia sẻ riêng cho hồ sơ này.</p></section><ChildSummary child={child} /><div className="share-summary"><span><strong>{goals.length}</strong> mục tiêu đang theo dõi</span><span><strong>{achievedCount}</strong> kết quả đạt</span><span>Không cho phép chỉnh sửa</span></div><section className="share-goals"><div className="share-section-heading"><div><span className="share-eyebrow">KẾ HOẠCH GIÁO DỤC</span><h2>Mục tiêu phát triển</h2><p>Kết quả được hiển thị theo từng giai đoạn đánh giá.</p></div><span className="share-lock"><Icon name="file" size={16} />Chế độ chỉ xem</span></div><GoalsTableV2 goals={goals} evaluationPeriods={evaluationPeriods} readOnly /></section><footer className="share-footer">Đường dẫn này chỉ hiển thị thông tin của <strong>{child.name}</strong>.</footer></div></main>;
}

/* eslint-enable jsx-a11y/no-autofocus */

function SettingsView({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const [saved, setSaved] = useState(false);
  return <><Header title="Cài đặt" subtitle="Tùy chỉnh cách bạn sử dụng kế hoạch giáo dục" /><div className="settings-card"><div className="settings-heading"><div className="settings-icon"><Icon name="settings" size={24} /></div><div><h2>Tùy chọn ứng dụng</h2><p>Các thay đổi được lưu trên thiết bị này.</p></div></div><div className="setting-row"><span><strong>Giao diện tối</strong><small>Đổi sang nền tối để sử dụng dễ chịu hơn vào buổi tối.</small></span><input aria-label="Giao diện tối" type="checkbox" checked={darkMode} onChange={onToggleTheme} /></div><div className="settings-save"><button type="button" className="button primary" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); }}><Icon name="save" size={17} /> Lưu cài đặt</button>{saved && <span>Đã lưu thay đổi</span>}</div></div></>;
}

export default function Home() {
  const [view, setView] = useState<View>("plan");
  const [shareChildSlug] = useState<string | null>(() => sharedChildSlugFromUrl());
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("giaoan-theme") === "dark");
  const [children, setChildren] = useState<Child[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [evaluationPeriods, setEvaluationPeriods] = useState<string[]>(DEFAULT_EVALUATION_PERIODS);
  const [selectedChildId, setSelectedChildId] = useState(0);
  const [editingChild, setEditingChild] = useState<Child | undefined>();
  const [showChildForm, setShowChildForm] = useState(false);
  const [goalDialog, setGoalDialog] = useState<GoalDialogState | null>(null);
  const [noteGoalId, setNoteGoalId] = useState<number | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState(false);
  const [cloudExtras, setCloudExtras] = useState<Record<string, unknown>>({});
  const cloudSaveTimer = useRef<number | null>(null);

  useEffect(() => { document.documentElement.classList.toggle("dark-mode", darkMode); window.localStorage.setItem("giaoan-theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => {
    let active = true;
    loadCloudData<AppCloudData>().then((data) => {
      if (!active) return;
      const { children: cloudChildren, goals: cloudGoals, evaluationPeriods: cloudPeriods, ...extras } = data ?? {};
      setCloudExtras(extras);
      setChildren(Array.isArray(cloudChildren) ? cloudChildren : []);
      setGoals(Array.isArray(cloudGoals) ? cloudGoals : []);
      if (Array.isArray(cloudPeriods) && cloudPeriods.length) setEvaluationPeriods(cloudPeriods);
      setCloudReady(true);
    }).catch((error) => {
      console.error("Không thể tải dữ liệu từ Google Sheet:", error);
      if (active) setCloudError(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!cloudReady || shareChildSlug !== null) return;
    if (cloudSaveTimer.current !== null) window.clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = window.setTimeout(() => {
      saveCloudData({ ...cloudExtras, children, goals, evaluationPeriods }).catch((error) => console.error("Không thể đồng bộ dữ liệu lên Google Sheet:", error));
    }, 250);
    return () => { if (cloudSaveTimer.current !== null) window.clearTimeout(cloudSaveTimer.current); };
  }, [children, goals, evaluationPeriods, cloudExtras, cloudReady, shareChildSlug]);

  const updateStatus = (id: number, periodIndex: number, status: Status) => setGoals((items) => items.map((goal) => goal.id === id ? { ...goal, statuses: evaluationPeriods.map((_, index) => index === periodIndex ? status : goal.statuses[index] ?? "Chưa đạt") } : goal));
  const saveChild = (data: Omit<Child, "id">) => { if (editingChild) setChildren((items) => items.map((item) => item.id === editingChild.id ? { ...data, id: item.id } : item)); else setChildren((items) => [...items, { ...data, id: Math.max(0, ...items.map((item) => item.id)) + 1 }]); setShowChildForm(false); setEditingChild(undefined); };
  const deleteChild = (id: number) => { const child = children.find((item) => item.id === id); if (!child || !window.confirm(`Xóa hồ sơ của ${child.name}?`)) return; setChildren((items) => items.filter((item) => item.id !== id)); setGoals((items) => items.filter((goal) => goal.childId !== id)); if (selectedChildId === id) { const next = children.find((item) => item.id !== id); if (next) setSelectedChildId(next.id); } };
  const saveGoal = (goal: Omit<Goal, "id">) => { setGoals((items) => [...items, { ...goal, id: Math.max(0, ...items.map((item) => item.id)) + 1 }]); setSelectedChildId(goal.childId); setView("plan"); };
  const openGoalDialog = (state: GoalDialogState) => setGoalDialog(state);
  const saveGoalDialog = ({ mode, text, domain, goalId }: GoalDialogSave) => {
    if (mode === "domain") {
      setGoals((items) => [...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, childId: selectedChildId, domain: text, longTerm: "", shortTerm: [], from: "01/07/2026", to: "30/08/2026", statuses: evaluationPeriods.map(() => "Chưa đạt") }]);
    } else if (mode === "long") {
      setGoals((items) => [...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, childId: selectedChildId, domain: domain || DOMAIN_OPTIONS[0], longTerm: text, shortTerm: [], from: "01/07/2026", to: "30/08/2026", statuses: evaluationPeriods.map(() => "Chưa đạt") }]);
    } else if (mode === "edit-long" && goalDialog?.goalId) {
      setGoals((items) => items.map((goal) => goal.id === goalDialog.goalId ? { ...goal, longTerm: text } : goal));
    } else if (mode === "short" && goalId) {
      setGoals((items) => items.map((goal) => goal.id === goalId ? { ...goal, shortTerm: [...goal.shortTerm, text] } : goal));
    } else if (mode === "edit-short" && goalDialog?.goalId && goalDialog.shortIndex !== undefined) {
      setGoals((items) => items.map((goal) => goal.id === goalDialog.goalId ? { ...goal, shortTerm: goal.shortTerm.map((item, index) => index === goalDialog.shortIndex ? text : item) } : goal));
    } else if (mode === "period" && !evaluationPeriods.includes(text)) {
      setEvaluationPeriods((items) => [...items, text]);
      setGoals((items) => items.map((goal) => ({ ...goal, statuses: [...goal.statuses, "Chưa đạt"] })));
    }
    setGoalDialog(null);
  };
  const deleteGoal = (goal: Goal) => { if (!window.confirm(`Xóa mục tiêu “${goal.longTerm || goal.domain}”?`)) return; setGoals((items) => items.filter((item) => item.id !== goal.id)); };
  const deleteShort = (goal: Goal, index: number) => { if (!window.confirm("Xóa mục tiêu ngắn hạn này?")) return; setGoals((items) => items.map((item) => item.id === goal.id ? { ...item, shortTerm: item.shortTerm.filter((_, itemIndex) => itemIndex !== index) } : item)); };
  const saveNote = (note: string) => { if (noteGoalId === null) return; setGoals((items) => items.map((goal) => goal.id === noteGoalId ? { ...goal, note } : goal)); setNoteGoalId(null); };
  const navigate = (next: View) => { setView(next); if (next === "objective-form" && !children.length) setShowChildForm(true); };
  const currentChildGoals = goals.filter((goal) => goal.childId === selectedChildId);
  const currentView = useMemo(() => view, [view]);
  const noteGoal = goals.find((goal) => goal.id === noteGoalId);
  if (shareChildSlug !== null) {
    const sharedChild = children.find((child) => childNameSlug(child.name) === shareChildSlug);
    if (!cloudReady && !cloudError) return <div className="share-page"><div className="share-loading">Đang tải hồ sơ được chia sẻ…</div></div>;
    if (!sharedChild) return <div className="share-page"><div className="share-loading"><strong>Không tìm thấy hồ sơ</strong><span>Đường dẫn có thể đã hết hiệu lực hoặc hồ sơ không tồn tại.</span></div></div>;
    return <ShareView child={sharedChild} goals={goals.filter((goal) => goal.childId === sharedChild.id)} evaluationPeriods={evaluationPeriods} />;
  }
  return <div className="app-shell"><SidebarV2 active={currentView} onChange={navigate} /><main className="main-content">{view === "overview" && <OverviewViewV2 childList={children} selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} goals={goals} evaluationPeriods={evaluationPeriods} onOpenPlan={() => setView("plan")} />}{view === "plan" && <PlanViewV2 childList={children} selectedChildId={selectedChildId} onSelectChild={setSelectedChildId} goals={goals} evaluationPeriods={evaluationPeriods} onStatusChange={updateStatus} onNoteClick={setNoteGoalId} onAddDomain={() => openGoalDialog({ mode: "domain" })} onAddLong={() => openGoalDialog({ mode: "long", initialDomain: currentChildGoals[0]?.domain })} onAddShort={() => { if (!currentChildGoals.length) { window.alert("Hãy thêm mục tiêu dài hạn trước."); return; } openGoalDialog({ mode: "short", initialGoalId: currentChildGoals[0].id }); }} onAddPeriod={() => openGoalDialog({ mode: "period" })} onEditLong={(goal) => openGoalDialog({ mode: "edit-long", goalId: goal.id, initialValue: goal.longTerm })} onDeleteGoal={deleteGoal} onEditShort={(goal, index) => openGoalDialog({ mode: "edit-short", goalId: goal.id, shortIndex: index, initialValue: goal.shortTerm[index] })} onDeleteShort={deleteShort} />}{view === "children" && <ChildrenView childList={children} onAdd={() => { setEditingChild(undefined); setShowChildForm(true); }} onEdit={(child) => { setEditingChild(child); setShowChildForm(true); }} onDelete={deleteChild} onSelectPlan={(id) => { setSelectedChildId(id); setView("plan"); }} />}{view === "objective-form" && <ObjectiveForm childList={children} onCancel={() => setView("plan")} onSaved={saveGoal} />}{view === "settings" && <SettingsView darkMode={darkMode} onToggleTheme={() => setDarkMode((value) => !value)} />}</main>{showChildForm && <ChildForm child={editingChild} onCancel={() => { setShowChildForm(false); setEditingChild(undefined); }} onSave={saveChild} />}{goalDialog && <GoalDialog mode={goalDialog.mode} goals={currentChildGoals} initialValue={goalDialog.initialValue} initialGoalId={goalDialog.goalId} initialDomain={goalDialog.initialValue} onCancel={() => setGoalDialog(null)} onSave={saveGoalDialog} />}{noteGoalId !== null && <NoteDialog goal={noteGoal} onCancel={() => setNoteGoalId(null)} onSave={saveNote} />}</div>;
}

void HomeLegacy;
function HomeLegacy() {
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
