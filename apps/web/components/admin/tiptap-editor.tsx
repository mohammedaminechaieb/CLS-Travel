'use client';

import type { TiptapDoc } from '@cls/shared';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/** Éditeur riche Tiptap : produit du JSON ProseMirror stocké tel quel en jsonb. */
export function TiptapEditor({
  value,
  onChange,
  placeholder,
  id,
  label,
  dir,
  minimal = false,
}: {
  value?: TiptapDoc | null;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
  id: string;
  label: string;
  dir?: 'rtl' | 'ltr';
  minimal?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false }),
      Link.configure({ openOnClick: false, protocols: ['https', 'mailto'], HTMLAttributes: { rel: 'noopener noreferrer nofollow' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? undefined,
    editorProps: {
      attributes: {
        id,
        'aria-label': label,
        role: 'textbox',
        'aria-multiline': 'true',
        dir: dir ?? 'auto',
        class: cn('prose-cls min-h-32 px-4 py-3 focus:outline-none', minimal && 'min-h-20'),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as TiptapDoc),
  });

  return (
    <div className="rounded-md border border-input bg-surface focus-within:ring-2 focus-within:ring-ring">
      {editor && <Toolbar editor={editor} minimal={minimal} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, minimal }: { editor: Editor; minimal: boolean }) {
  const t = useTranslations('admin.editor');
  const btn = (active: boolean) =>
    cn('flex size-8 items-center justify-center rounded hover:bg-muted', active && 'bg-primary/10 text-primary');
  const items = [
    { label: t('bold'), icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: t('italic'), icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    ...(minimal ? [] : [{ label: t('heading'), icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() }]),
    { label: t('bulletList'), icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: t('orderedList'), icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    ...(minimal ? [] : [{ label: t('quote'), icon: Quote, active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() }]),
    {
      label: t('link'),
      icon: Link2,
      active: editor.isActive('link'),
      run: () => {
        const url = window.prompt(t('linkPrompt'), editor.getAttributes('link').href ?? 'https://');
        if (url === null) return;
        if (url === '' || !/^(https:|mailto:)/.test(url)) editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      },
    },
  ];
  return (
    <div role="toolbar" aria-label={t('toolbar')} className="flex flex-wrap gap-0.5 border-b border-border p-1">
      {items.map(({ label, icon: Icon, active, run }) => (
        <button key={label} type="button" className={btn(active)} onClick={run} aria-label={label} aria-pressed={active} title={label}>
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
      <span className="mx-1 w-px bg-border" aria-hidden />
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} aria-label={t('undo')} title={t('undo')}>
        <Undo2 className="size-4" aria-hidden />
      </button>
      <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} aria-label={t('redo')} title={t('redo')}>
        <Redo2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}
