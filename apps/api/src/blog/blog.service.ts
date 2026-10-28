import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { paginated, skipTake } from '../common/pagination';
import type { RequestMeta } from '../common/request-meta';
import { uniqueSlug } from '../common/slug';
import { tiptapToText } from '../common/tiptap';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminBlogQueryDto, BlogQueryDto, CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';

const AUTHOR = { select: { id: true, first_name: true, last_name: true, avatar_url: true } } as const;
const WORDS_PER_MINUTE = 200;

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listPublic(query: BlogQueryDto) {
    return this.list(query, { status: PostStatus.published, published_at: { lte: new Date() } }, true);
  }

  async findPublicBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: PostStatus.published, published_at: { lte: new Date() } },
      include: { author: AUTHOR },
    });
    if (!post) throw new NotFoundException('Article introuvable');

    const related = await this.prisma.blogPost.findMany({
      where: { status: PostStatus.published, id: { not: post.id }, tags: { hasSome: post.tags } },
      select: { slug: true, title_fr: true, title_ar: true, title_en: true, cover_url: true, published_at: true },
      orderBy: { published_at: 'desc' },
      take: 3,
    });
    return { ...post, reading_minutes: this.readingMinutes(post.body), related };
  }

  /** Nuage de tags des articles publiés. */
  async tags() {
    const rows = await this.prisma.$queryRaw<{ tag: string; count: number }[]>`
      SELECT unnest(tags) AS tag, COUNT(*)::int AS count FROM blog_posts
      WHERE status = 'published' AND published_at <= now()
      GROUP BY tag ORDER BY count DESC, tag ASC LIMIT 50`;
    return rows;
  }

  async listAdmin(query: AdminBlogQueryDto) {
    return this.list(query, query.status ? { status: query.status } : {}, false);
  }

  async findById(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id }, include: { author: AUTHOR } });
    if (!post) throw new NotFoundException('Article introuvable');
    return post;
  }

  async create(dto: CreateBlogPostDto, authorId: string, meta: RequestMeta) {
    const slug = await uniqueSlug(dto.slug ?? dto.title_fr, (s) => this.slugExists(s));
    const post = await this.prisma.blogPost.create({
      data: {
        ...dto,
        slug,
        body: dto.body as Prisma.InputJsonValue,
        tags: dto.tags ?? [],
        author_id: authorId,
        published_at: dto.status === PostStatus.published ? new Date() : null,
      },
    });
    await this.audit.log({ actorId: authorId, action: 'BLOG_POST_CREATED', resourceType: 'blog_post', resourceId: post.id, meta });
    return post;
  }

  async update(id: string, dto: UpdateBlogPostDto, actorId: string, meta: RequestMeta) {
    const current = await this.findById(id);
    const slug = dto.slug && dto.slug !== current.slug ? await uniqueSlug(dto.slug, (s) => this.slugExists(s, id)) : undefined;
    const firstPublication = dto.status === PostStatus.published && !current.published_at;

    const { body, ...rest } = dto;
    const post = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...rest,
        ...(slug && { slug }),
        ...(body && { body: body as Prisma.InputJsonValue }),
        ...(firstPublication && { published_at: new Date() }),
      },
    });
    await this.audit.log({
      actorId,
      action: 'BLOG_POST_UPDATED',
      resourceType: 'blog_post',
      resourceId: id,
      payload: { fields: Object.keys(dto) },
      meta,
    });
    return post;
  }

  async remove(id: string, actorId: string, meta: RequestMeta) {
    const post = await this.findById(id);
    await this.prisma.blogPost.delete({ where: { id } });
    await this.audit.log({ actorId, action: 'BLOG_POST_DELETED', resourceType: 'blog_post', resourceId: id, payload: { slug: post.slug }, meta });
  }

  private async list(query: BlogQueryDto, base: Prisma.BlogPostWhereInput, publicView: boolean) {
    const where: Prisma.BlogPostWhereInput = {
      ...base,
      ...(query.tag && { tags: { has: query.tag } }),
      ...(query.search && {
        OR: [
          { title_fr: { contains: query.search, mode: 'insensitive' } },
          { title_en: { contains: query.search, mode: 'insensitive' } },
          { title_ar: { contains: query.search } },
          { excerpt_fr: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        include: { author: AUTHOR },
        orderBy: publicView ? { published_at: 'desc' } : { updated_at: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    // Le corps complet n'est pas renvoyé en liste : seulement le temps de lecture
    const data = items.map(({ body, ...p }) => ({ ...p, reading_minutes: this.readingMinutes(body) }));
    return paginated(data, total, query);
  }

  private readingMinutes(body: Prisma.JsonValue): number {
    const words = tiptapToText(body).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  private async slugExists(slug: string, excludeId?: string) {
    const found = await this.prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(found && found.id !== excludeId);
  }
}
