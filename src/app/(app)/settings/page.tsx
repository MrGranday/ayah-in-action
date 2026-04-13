import { ApiKeySettings } from '@/components/ApiKeySettings';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/60 block mb-4">
          Configuration
        </span>
        <h1 className="font-serif text-5xl text-primary mb-4">The Atelier</h1>
        <p className="font-body text-on-surface-variant italic">
          Refine your digital environment and spiritual intelligence.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/10" />
            <span className="font-label text-[10px] tracking-widest uppercase text-primary/40">AI Intelligence</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/10" />
          </div>
          <ApiKeySettings />
        </section>

        {/* Placeholder for other settings */}
        <section className="opacity-50 pointer-events-none grayscale">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/10" />
            <span className="font-label text-[10px] tracking-widest uppercase text-primary/40">Interface Themes</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/10" />
          </div>
          <div className="grid grid-cols-3 gap-6">
             {[1,2,3].map(i => (
               <div key={i} className="h-32 rounded-3xl bg-surface-container-low border border-dashed border-outline-variant/20" />
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
