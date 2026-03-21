import * as Popover from '@radix-ui/react-popover';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useEffect, useState } from 'react';

const colors = [
  { name: 'green', value: '#059669' },
  { name: 'blue', value: '#2563eb' },
  { name: 'purple', value: '#7c3aed' },
  { name: 'orange', value: '#ea580c' },
  { name: 'pink', value: '#f652a0' },
] as const;

export function AccentPicker() {
  const [activeColor, setActiveColor] = useState('#f652a0');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('accent') || '#f652a0';
    setActiveColor(saved);
    applyAccent(saved, false);
  }, []);

  function applyAccent(value: string, save = true) {
    document.documentElement.style.setProperty('--accent', value);
    document.documentElement.style.setProperty('--focus', value);
    if (save) localStorage.setItem('accent', value);
    setActiveColor(value);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="cursor-pointer bg-transparent border border-[var(--border)] rounded-full p-2 flex items-center justify-center text-[var(--text)] transition-all duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
          aria-label="Choose accent color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-[var(--z-dropdown)] min-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-lg)]"
          sideOffset={8}
          align="end"
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="Accent color options">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  applyAccent(color.value);
                  setOpen(false);
                }}
                className={`h-8 w-8 cursor-pointer rounded-full border-2 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 ${
                  activeColor === color.value
                    ? 'border-[var(--text)]'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                aria-label={`Select ${color.name} accent color`}
                aria-pressed={activeColor === color.value}
              >
                <VisuallyHidden>{color.name}</VisuallyHidden>
              </button>
            ))}
          </div>
          <Popover.Arrow className="fill-[var(--border)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
