import type { TiptapNode } from '@cls/shared';
import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Rendu React d'un document Tiptap (ProseMirror JSON) sans `dangerouslySetInnerHTML` :
 * seuls les nœuds et marques connus sont rendus, les URL non http(s)/mailto sont ignorées.
 */
const SAFE_URL = /^(https?:|mailto:|\/)/i;

function renderMarks(text: ReactNode, marks: TiptapNode['marks'] = []): ReactNode {
  return marks.reduce<ReactNode>((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return <strong>{acc}</strong>;
      case 'italic':
        return <em>{acc}</em>;
      case 'underline':
        return <u>{acc}</u>;
      case 'strike':
        return <s>{acc}</s>;
      case 'code':
        return <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{acc}</code>;
      case 'link': {
        const href = String(mark.attrs?.href ?? '');
        if (!SAFE_URL.test(href)) return acc;
        const external = /^https?:/i.test(href);
        return (
          <a href={href} className="text-primary underline underline-offset-2" {...(external && { target: '_blank', rel: 'noopener noreferrer nofollow' })}>
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  const children = node.content?.map(renderNode);
  switch (node.type) {
    case 'doc':
      return <Fragment key={key}>{children}</Fragment>;
    case 'text':
      return <Fragment key={key}>{renderMarks(node.text ?? '', node.marks)}</Fragment>;
    case 'paragraph':
      return <p key={key}>{children}</p>;
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 2), 2), 4);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      return <Tag key={key}>{children}</Tag>;
    }
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'hardBreak':
      return <br key={key} />;
    case 'horizontalRule':
      return <hr key={key} />;
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case 'image': {
      const src = String(node.attrs?.src ?? '');
      if (!/^https:/i.test(src)) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={String(node.attrs?.alt ?? '')} loading="lazy" className="rounded-lg" />;
    }
    default:
      return children ? <Fragment key={key}>{children}</Fragment> : null;
  }
}

export function TiptapRenderer({ doc, className }: { doc?: TiptapNode | null; className?: string }) {
  if (!doc) return null;
  return <div className={cn('prose-cls', className)}>{renderNode(doc, 0)}</div>;
}
