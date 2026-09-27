import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Users, Phone, MapPin, Award, ClipboardCheck, CalendarDays, IndianRupee, Bell } from "lucide-react";

const courses = [
  { name: "MPC", desc: "Mathematics, Physics & Chemistry", focus: "Mathematics and physical sciences" },
  { name: "BiPC", desc: "Biology, Physics & Chemistry", focus: "Biology and life sciences" },
  { name: "MEC", desc: "Mathematics, Economics & Commerce", focus: "Mathematics, economics and commerce" },
  { name: "CEC", desc: "Civics, Economics & Commerce", focus: "Commerce and social sciences" },
];

const features = [
  ["Attendance", "Students can view subject-wise attendance while faculty record assigned-class attendance.", ClipboardCheck],
  ["Examinations", "Marks and examination records are organised for students, faculty and administrators.", BookOpen],
  ["Timetable", "Current class schedules, subjects, faculty and rooms are available through the portal.", CalendarDays],
  ["Fees", "Students can review fee records and outstanding balances through their account.", IndianRupee],
  ["Notices", "Official college announcements are published through the secure portal.", Bell],
  ["Role-based access", "Student, faculty, admin and principal accounts have separate permissions.", ShieldCheck],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#102a43] text-xl text-white">ॐ</div>
            <div><p className="text-sm font-black uppercase tracking-wide text-[#102a43]">Gnana Saraswati</p><p className="text-xs font-medium text-slate-500">Junior College • Bethamcherla</p></div>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#about" className="hover:text-blue-700">About</a><a href="#courses" className="hover:text-blue-700">Courses</a><a href="#services" className="hover:text-blue-700">Portal Services</a><a href="#contact" className="hover:text-blue-700">Contact</a>
          </nav>
          <a href="/login" className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800">Portal Login</a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#102a43]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,.3),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 md:py-32">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-blue-100">Education • Discipline • Excellence</span>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">Gnana Saraswati<span className="block text-amber-300">Junior College</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">A digital college platform for academic administration, student services, faculty workflows and official communication at Gnana Saraswati Junior College, Bethamcherla.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300">Open College Portal <ArrowRight size={18}/></a><a href="#courses" className="rounded-xl border border-white/25 px-5 py-3 font-bold text-white hover:bg-white/10">Explore Programs</a></div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-8 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1.1fr_.9fr] md:p-12">
          <div><p className="text-sm font-extrabold uppercase tracking-[.2em] text-blue-700">About the College</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A focused academic environment with a connected student portal.</h2></div>
          <div className="space-y-4 leading-7 text-slate-600"><p>Gnana Saraswati Junior College is based in Bethamcherla, Andhra Pradesh. Official college information, admissions details and contact information can be configured by authorised administrators.</p><p className="flex items-start gap-3"><Award className="mt-1 shrink-0 text-blue-700" size={20}/>The portal brings everyday academic records and student services into one secure place.</p></div>
        </div>
      </section>

      <section id="courses" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5"><p className="text-sm font-extrabold uppercase tracking-[.2em] text-blue-700">Academic Programs</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Intermediate programs</h2><p className="mt-4 max-w-2xl text-slate-600">The combinations shown here can be configured to match the college's official academic offering.</p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{courses.map(c=><article key={c.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><GraduationCap size={24}/></div><h3 className="mt-5 text-2xl font-black">{c.name}</h3><p className="mt-2 text-sm font-semibold text-slate-700">{c.desc}</p><p className="mt-2 text-sm leading-6 text-slate-500">{c.focus}</p></article>)}</div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-20"><div className="max-w-2xl"><p className="text-sm font-extrabold uppercase tracking-[.2em] text-blue-700">Portal Services</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Everything connected in one portal</h2></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{features.map(([title,text,Icon])=><article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><Icon className="text-blue-700" size={28}/><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></article>)}</div></section>

      <section className="bg-[#fffaf0] py-20"><div className="mx-auto max-w-7xl px-5"><div className="grid gap-6 md:grid-cols-3"><div className="rounded-2xl bg-white p-6 shadow-sm"><Users className="text-blue-700"/><h3 className="mt-4 font-black">For Students</h3><p className="mt-2 text-sm leading-6 text-slate-600">Attendance, marks, timetable, assignments, fees, notices and profile.</p></div><div className="rounded-2xl bg-white p-6 shadow-sm"><BookOpen className="text-blue-700"/><h3 className="mt-4 font-black">For Faculty</h3><p className="mt-2 text-sm leading-6 text-slate-600">Assigned sections and subjects, attendance, marks, assignments and timetable.</p></div><div className="rounded-2xl bg-white p-6 shadow-sm"><ShieldCheck className="text-blue-700"/><h3 className="mt-4 font-black">For Management</h3><p className="mt-2 text-sm leading-6 text-slate-600">Student and faculty management, academic setup, fees, notices and live reports.</p></div></div></div></section>

      <section id="contact" className="bg-[#102a43] text-white"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-3"><div><p className="text-lg font-black">Gnana Saraswati Jr. College</p><p className="mt-2 text-sm text-blue-200">Bethamcherla, Andhra Pradesh</p></div><div className="flex items-start gap-3 text-sm text-blue-100"><MapPin size={19}/>Bethamcherla, Andhra Pradesh</div><div className="flex items-start gap-3 text-sm text-blue-100"><Phone size={19}/>Official contact details can be configured by administration</div></div><div className="border-t border-white/10 py-5 text-center text-xs text-blue-300">© {new Date().getFullYear()} Gnana Saraswati Jr. College</div></section>
    </main>
  );
}
