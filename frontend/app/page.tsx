import Link from "next/link";
import { Gift, Share2, Users, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Gift,
    title: "Создайте вишлист",
    description: "Добавьте желания с названием, ссылкой, ценой и картинкой",
  },
  {
    icon: Share2,
    title: "Поделитесь ссылкой",
    description: "Отправьте друзьям — они увидят список без регистрации",
  },
  {
    icon: Users,
    title: "Друзья выбирают",
    description: "Резервируют подарки или скидываются на дорогие — без повторов",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fill text-text-muted text-sm font-medium mb-8">
            <Sparkles size={14} />
            Бесплатно и без рекламы
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text mb-6 leading-[1.05]">
            Вишлисты, которые{" "}
            <span className="text-primary">работают</span>
          </h1>

          <p className="text-xl text-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Создавайте списки желаний, делитесь с друзьями и забудьте о
            повторяющихся подарках.
          </p>

          <Link
            href="/login?redirect=/wishlists/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Gift size={20} />
            Создать вишлист
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-16">
          Как это работает
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={i} className="group text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 group-hover:scale-105 transition-all duration-300">
                <step.icon size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">{step.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-16">
          Всё что нужно
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { emoji: "🎉", title: "Конфетти", text: "Маленькая радость при резервации подарка" },
            { emoji: "💸", title: "Совместный сбор", text: "Скидывайтесь на дорогие подарки с прогресс-баром" },
            { emoji: "🔒", title: "Сюрприз", text: "Владелец не видит кто что зарезервировал" },
            { emoji: "⚡", title: "Реалтайм", text: "Все обновления мгновенно — никаких повторов" },
            { emoji: "📱", title: "Мобильный", text: "Работает на телефоне — поделитесь в мессенджере" },
            { emoji: "🔗", title: "Автозаполнение", text: "Вставьте ссылку — название и картинка подтянутся" },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-3xl bg-surface border border-separator/50 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,122,255,0.08)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-fill flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.emoji}
              </div>
              <h3 className="font-semibold text-text mb-1">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Готовы к праздникам?
        </h2>
        <p className="text-text-muted mb-8">
          Создайте первый вишлист за 30 секунд
        </p>
        <Link
          href="/login?redirect=/wishlists/new"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-black/8 hover:shadow-xl hover:shadow-black/12 hover:-translate-y-0.5 transition-all duration-200"
        >
          Начать бесплатно
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-separator">
        <p className="text-sm text-text-muted">
          Vishlist — социальный вишлист
        </p>
      </footer>
    </main>
  );
}
