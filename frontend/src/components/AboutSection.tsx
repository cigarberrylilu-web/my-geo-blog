import { motion } from "motion/react";
import { Github, Mail, MapPin, Code, Globe, Coffee, Heart, Camera, Terminal } from "lucide-react";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const BiliBiliIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
  </svg>
);

export function AboutSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // ── 真实链接，替换下面的占位符 ──────────────────────────
  const socialLinks = [
    { icon: Github,       label: "GitHub",  href: "https://github.com/syyyclover" },
    { icon: XIcon,        label: "X",       href: "https://x.com/syyy0514" },
    { icon: Mail,         label: "Email",   href: "mailto:syyy6472@gmail.com" },
    { icon: BiliBiliIcon, label: "BiliBili",href: "https://space.bilibili.com/649037397?spm_id_from=333.1007.0.0" },
  ];

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Profile Card */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-8 bg-black/40 border border-white/10 rounded-[2.5rem] shadow-2xl"
        >
          {/* Banner */}
          <div className="h-48 relative overflow-hidden rounded-t-[2.5rem]">
            <img src="/banner.jpg" alt="banner" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {/* Avatar — banner 外，不受 overflow-hidden 裁切 */}
          <div className="px-12">
            <div className="relative z-10 -mt-16 mb-4 w-32 h-32 rounded-3xl border-4 border-black/40 bg-white/10 overflow-hidden shadow-2xl">
              <img src="/avatar.jpg" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="px-12 pb-12 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight font-display">Syyy</h1>
              <p className="text-blue-400 font-medium flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5" /> Geo &amp; Blog
              </p>
            </div>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
              前端：React + Vite
              后端：Node.js + Cloudflare R2
              知识库：Quartz 4（DS 总结 Markdown）
              部署：Nginx + Podman 容器化
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 group"
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-4 grid grid-cols-2 gap-4 isolate"
        >
          <StatCard icon={Globe}    value="24"   label="Countries" />
          <StatCard icon={Camera}   value="1.2k" label="Photos" />
          <StatCard icon={Terminal} value="8y"   label="Coding" />
          <StatCard icon={Coffee}   value="∞"    label="Coffee" />
        </motion.div>

        {/* Tech Stack
            修复光条：去掉 backdrop-blur-md；
            tag hover 只改 border+text，不改 bg（bg 变化会触发 Chrome 合成层重建） */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-5 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6"
        >
          <div className="flex items-center gap-3">
            <Code className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Tech Stack</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {['React', 'TypeScript', 'Node.js', 'Mapbox', 'Tailwind', 'Astro', 'Cloudflare', 'PostgreSQL', 'Podman'].map(tech => (
              <span
                key={tech}
                className="px-4 py-2 bg-white/5 text-white/80 text-sm rounded-2xl border border-white/10 hover:border-white/30 hover:text-white transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Interests */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-7 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-400" />
            <h3 className="text-xl font-bold text-white">Interests</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['Photography', 'Hiking', 'Open Source', 'GIS Tech', 'Movie', 'Game'].map(item => (
              <div
                key={item}
                className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white/70 text-sm font-medium hover:text-white hover:border-white/20 transition-all text-center"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-1 hover:border-white/20 transition-colors">
      <Icon className="w-6 h-6 text-blue-400 mb-2" />
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</span>
    </div>
  );
}
