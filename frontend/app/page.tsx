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
    <main className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles size={14} />
            Бесплатно и без рекламы
          </div>

          <h1 className="text-5xl md:text-6xl font-heading font-bold text-text mb-4 leading-tight">
            Вишлисты, которые{" "}
            <span className="text-primary">работают</span>
          </h1>

          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
            Создавайте списки желаний, делитесь с друзьями и забудьте о
            повторяющихся подарках. Друзья резервируют подарки или скидываются
            на дорогие — а вы ничего не знаете до праздника.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?redirect=/wishlists/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Gift size={20} />
              Создать вишлист
            </Link>
          </div>

          {/* Decorative emojis */}
          <div className="mt-12 flex justify-center gap-4 text-4xl opacity-60">
            🎁 🎂 🎄 💍 🎓 🏠 ✈️
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">
          Как это работает
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center">
                <step.icon size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-text-muted text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { emoji: "🎉", text: "Конфетти при резервации — маленькая радость" },
            { emoji: "💸", text: "Сбор средств на дорогие подарки с прогресс-баром" },
            { emoji: "🔒", text: "Владелец не видит кто что зарезервировал" },
            { emoji: "⚡", text: "Реалтайм — все обновления мгновенно" },
            { emoji: "📱", text: "Работает на телефоне — поделитесь в мессенджере" },
            { emoji: "🔗", text: "Автозаполнение — вставьте ссылку на товар" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-gray-100"
            >
              <span className="text-2xl">{feature.emoji}</span>
              <p className="text-sm text-text">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-heading font-bold mb-4">
          Готовы к праздникам?
        </h2>
        <p className="text-text-muted mb-6">
          Создайте первый вишлист за 30 секунд
        </p>
        <Link
          href="/login?redirect=/wishlists/new"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          Начать бесплатно
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-gray-100">
        <p className="text-sm text-text-muted">
          Vishlist — социальный вишлист с любовью 💝
        </p>
      </footer>
    </main>
  );
}
