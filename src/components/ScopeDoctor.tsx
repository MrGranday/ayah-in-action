'use client';

import { ShieldAlert, ExternalLink, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScopeDoctorProps {
  missingScopes: string[];
}

export function ScopeDoctor({ missingScopes }: ScopeDoctorProps) {
  const portalUrl = 'https://developers.quran.com/';

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-low rounded-[3rem] p-12 md:p-20 border border-red-100/50 editorial-shadow parchment-texture relative overflow-hidden text-center"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <ShieldAlert className="w-64 h-64 text-red-900" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-10">
          <div className="space-y-4">
             <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100 shadow-sm transition-transform hover:scale-110 duration-700">
                <ShieldAlert className="w-8 h-8 text-red-600" />
             </div>
             <div>
                <span className="font-label text-[10px] tracking-[0.4em] uppercase text-red-600/60 font-bold block mb-4">
                  Security Handshake Restricted
                </span>
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary leading-tight">
                  Access Required for <br/><span className="italic font-light">The Archive.</span>
                </h1>
             </div>
          </div>

          <p className="font-body text-on-surface-variant text-lg leading-relaxed italic border-l-2 border-red-100 pl-8 text-left py-2">
            The sanctuary is open, but your currently configured connection lacks the permissions to retrieve your spiritual reflections.
          </p>

          <div className="space-y-6 text-left bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-outline-variant/5">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant font-bold">Lacking Permissions</span>
             </div>
             
             <div className="flex flex-wrap gap-2">
              {missingScopes.map(scope => (
                <span key={scope} className="px-4 py-2 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[10px] font-bold tracking-widest uppercase">
                  {scope}
                </span>
              ))}
              {missingScopes.length === 0 && (
                <span className="px-4 py-2 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[10px] font-bold tracking-widest uppercase">
                  note & activity_day
                </span>
              )}
           </div>
           
           <p className="text-sm text-on-surface-variant/80 leading-relaxed font-body">
             Your OAuth session was granted before these scopes were added. Re-authenticating will request the correct permissions automatically.
           </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
             <a 
               href="/api/auth/logout?reauth=true"
               className="group flex items-center gap-4 px-10 h-16 rounded-2xl bg-primary text-white font-label text-[10px] tracking-[0.2em] uppercase font-bold editorial-shadow hover:scale-[1.02] transition-all"
             >
               Re-authenticate with New Permissions
               <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
             </a>
             
             <a 
               href={portalUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-3 text-primary font-label text-[10px] tracking-widest uppercase font-bold hover:underline"
             >
               <ExternalLink className="w-3.5 h-3.5" />
               Developer Portal
             </a>
          </div>
          
          <div className="pt-10 border-t border-outline-variant/10">
             <div className="flex items-center justify-center gap-10">
                <div className="flex items-center gap-2 opacity-40">
                   <BookOpen className="w-3.5 h-3.5" />
                   <span className="font-label text-[9px] tracking-widest uppercase">Notes Sync</span>
                </div>
                <div className="flex items-center gap-2 opacity-40">
                   <ShieldCheck className="w-3.5 h-3.5" />
                   <span className="font-label text-[9px] tracking-widest uppercase">Secure Identity</span>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
