import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit3, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRole } from '../context/RoleContext';
import { HandbookArticle, INITIAL_HANDBOOK_ARTICLES } from '../types/engine';

export function HandbookScreen() {
  const { userRole, canEditHandbook } = useRole();

  const [articles, setArticles] = useLocalStorage<HandbookArticle[]>(
    'slonovet_handbook_articles_v2',
    INITIAL_HANDBOOK_ARTICLES
  );

  const [activeCategory, setActiveCategory] = useState<'all' | 'ration' | 'safety' | 'vet'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(articles[0]?.id || null);

  // Modal editor state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<'ration' | 'safety' | 'vet'>('ration');
  const [formTitle, setFormTitle] = useState('');
  const [formIcon, setFormIcon] = useState('🥣');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');

  const triggerHaptic = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  const handleOpenAdd = () => {
    setEditingArticleId(null);
    setFormCategory('ration');
    setFormTitle('');
    setFormIcon('🥣');
    setFormSummary('');
    setFormContent('');
    setModalOpen(true);
  };

  const handleOpenEdit = (article: HandbookArticle) => {
    setEditingArticleId(article.id);
    setFormCategory(article.category);
    setFormTitle(article.title);
    setFormIcon(article.icon);
    setFormSummary(article.summary);
    setFormContent(article.content);
    setModalOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingArticleId) {
      setArticles(prev => prev.map(a => {
        if (a.id === editingArticleId) {
          return {
            ...a,
            category: formCategory,
            title: formTitle.trim(),
            icon: formIcon,
            summary: formSummary.trim(),
            content: formContent.trim(),
            updatedAt: todayStr
          };
        }
        return a;
      }));
    } else {
      const newArticle: HandbookArticle = {
        id: `art-${Date.now()}`,
        category: formCategory,
        title: formTitle.trim(),
        icon: formIcon,
        summary: formSummary.trim(),
        content: formContent.trim(),
        updatedAt: todayStr,
        author: userRole === 'vet' ? 'Ветврач' : 'Шеф'
      };
      setArticles(prev => [newArticle, ...prev]);
    }

    triggerHaptic([30, 40]);
    setModalOpen(false);
  };

  const filteredArticles = articles.filter(a => {
    const matchesCat = activeCategory === 'all' || a.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) || 
      a.summary.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const getCategoryBadge = (category: 'ration' | 'safety' | 'vet') => {
    switch (category) {
      case 'safety':
        return { label: 'ТБ и безопасность', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'vet':
        return { label: 'Ветеринария', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      case 'ration':
      default:
        return { label: 'Рацион и кормление', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-lg mx-auto w-full pb-20">
      
      {/* HEADER С КНОПКОЙ ДЛЯ ADMIN / VET */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>📖</span>
            <span>Справочник и ТБ</span>
          </h1>
          <span className="text-xs text-zinc-400 font-medium">
            База знаний зоопарка: регламенты, рационы и правила безопасности
          </span>
        </div>

        {canEditHandbook && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Добавить статью</span>
          </button>
        )}
      </div>

      {/* ПОИСКОВАЯ СТРОКА */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по рецептам, запарке, ТБ..."
          className="w-full h-10 pl-9 pr-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* КАТЕГОРИИ СПРАВОЧНИКА */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-x-auto">
        {[
          { id: 'all', label: 'Все статьи' },
          { id: 'ration', label: '🥣 Рационы' },
          { id: 'safety', label: '🔒 ТБ и защита' },
          { id: 'vet', label: '🩺 Вет-правила' }
        ].map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* СПИСОК СТАТЕЙ СПРАВОЧНИКА — ТЕКСТ ПОЛНОСТЬЮ ПЕРЕНОСИТСЯ, БЕЗ ОБРЕЗКИ */}
      <div className="flex flex-col gap-2">
        {filteredArticles.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 text-center text-zinc-500 text-xs font-bold">
            Ничего не найдено по вашему запросу
          </div>
        ) : (
          filteredArticles.map(article => {
            const isExpanded = expandedArticleId === article.id;
            const badge = getCategoryBadge(article.category);

            return (
              <div
                key={article.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2 shadow-sm transition-all"
              >
                {/* Шапка статьи (клик разворачивает) */}
                <div 
                  onClick={() => {
                    setExpandedArticleId(isExpanded ? null : article.id);
                    triggerHaptic(10);
                  }}
                  className="flex items-start justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-xl shrink-0 mt-0.5">{article.icon}</span>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-bold text-white leading-snug break-words">
                        {article.title}
                      </span>
                      {article.summary && (
                        <span className="text-xs text-zinc-400 font-normal leading-relaxed break-words">
                          {article.summary}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {canEditHandbook && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(article);
                        }}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Редактировать статью"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Мета-плашка */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Обновлено: {article.updatedAt}
                  </span>
                </div>

                {/* Развернутый текст статьи — ПОЛНЫЙ ФОРМАТИРОВАННЫЙ ТЕКСТ */}
                {isExpanded && (
                  <div className="mt-2 pt-3 border-t border-zinc-800/80 flex flex-col gap-2 animate-in fade-in duration-150">
                    <div className="text-xs text-zinc-200 leading-relaxed font-normal whitespace-pre-wrap break-words bg-zinc-950 p-3 rounded-xl border border-zinc-850 select-text">
                      {article.content}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ СТАТЬИ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />

          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h2 className="text-sm font-black text-white leading-tight">
                  {editingArticleId ? 'Редактировать статью' : 'Новая статья базы знаний'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="flex flex-col gap-3 py-3 overflow-y-auto pr-1">
              
              {/* Категория */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Категория</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'ration' as const, label: 'Рацион', icon: '🥣' },
                    { id: 'safety' as const, label: 'ТБ и защита', icon: '🔒' },
                    { id: 'vet' as const, label: 'Ветеринария', icon: '🩺' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setFormCategory(c.id);
                        setFormIcon(c.icon);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                        formCategory === c.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Заголовок */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Заголовок статьи <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Например: Правила подачи сочных кормов..."
                  className="w-full h-10 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Краткая суть */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">Краткое описание (summary)</label>
                <input
                  type="text"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Одно предложение о главном выводе регламента..."
                  className="w-full h-10 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Полный текст статьи */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300">
                  Полный текст регламента <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Пошаговая инструкция, дозировки, предостережения..."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                />
              </div>

              {/* Сохранить */}
              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {editingArticleId ? 'Сохранить изменения' : 'Опубликовать в базу знаний'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
