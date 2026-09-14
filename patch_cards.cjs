const fs = require('fs');
let file = 'src/components/daily-shift/VeterinaryAssignmentCard.tsx';
let code = fs.readFileSync(file, 'utf8');

// The Trash2 button logic: only show if < 5 minutes
const unmarkRegex = /<button\s+type="button"\s+onClick=\{\(e\) => \{\s+e\.stopPropagation\(\);\s+onUnmark\(\);\s+\}\}[\s\S]*?<Trash2 size=\{15\} \/>\s+<\/button>/;

const replacement = `{completedAt && (Date.now() - new Date().setHours(parseInt(completedAt.split(':')[0]), parseInt(completedAt.split(':')[1]), 0, 0)) < 5 * 60 * 1000 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmark();
                  }}
                  className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200/70 shadow-xs active:scale-95 transition flex items-center justify-center cursor-pointer tap-target touch-manipulation"
                  title="Снять отметку о выполнении (доступно 5 минут)"
                  aria-label="Снять отметку"
                >
                  <Trash2 size={15} />
                </button>
                )}`;

if (unmarkRegex.test(code)) {
  code = code.replace(unmarkRegex, replacement);
  fs.writeFileSync(file, code);
}
