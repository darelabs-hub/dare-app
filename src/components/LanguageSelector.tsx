import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, EU_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { playSound } from '../utils/soundEffects';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'dropdown-item';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '',
  variant = 'navbar' 
}) => {
  const { language, setLanguage, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: LanguageCode) => {
    playSound('click');
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative shrink-0 select-none ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        id="eu-language-selector-btn"
        type="button"
        onClick={() => {
          playSound('click');
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-label="Select EU language"
        className={`group flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:border-cyan-400/70 hover:bg-slate-800/90 px-2.5 py-1.5 text-xs font-mono font-semibold transition-all duration-150 cursor-pointer shadow-sm active:scale-95 ${
          isOpen ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]' : ''
        }`}
        title={`Language: ${currentLanguageInfo.name} (${currentLanguageInfo.nativeName})`}
      >
        <div className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-cyan-400 group-hover:rotate-12 transition-transform duration-200" />
          <span className="text-sm leading-none" role="img" aria-label={currentLanguageInfo.name}>
            {currentLanguageInfo.flag}
          </span>
        </div>

        <span className="text-xs font-bold text-slate-200 tracking-wider">
          {currentLanguageInfo.code.toUpperCase()}
        </span>

        <span className="hidden xl:inline text-[11px] text-slate-400 font-sans font-normal truncate max-w-[60px]">
          {currentLanguageInfo.nativeName}
        </span>

        <ChevronDown 
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-200'
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile screen backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="eu-language-dropdown"
            className="fixed left-1/2 -translate-x-1/2 top-18 sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:absolute mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-sm sm:max-w-none rounded-2xl border border-slate-700/90 bg-[#0a0f1d] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800/80 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🇪🇺</span>
                <span className="text-xs font-tech font-bold text-white tracking-wide">
                  EU Language Selector
                </span>
              </div>
              <span className="rounded bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                12 Languages
              </span>
            </div>

            <p className="px-2.5 py-1 text-[11px] text-slate-400 leading-tight mb-1">
              Select your preferred language. Persisted automatically for app downloads and offline PWA visits.
            </p>

            {/* Language Grid / List */}
            <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {EU_LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border border-cyan-500/50 bg-cyan-950/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                        : 'border border-transparent hover:border-slate-700 hover:bg-slate-850/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none shrink-0" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate">{lang.nativeName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({lang.code.toUpperCase()})</span>
                        </div>
                        <span className="block text-[10px] text-slate-400 font-sans truncate">
                          {lang.name} • {lang.region}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 shrink-0 ml-2">
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
